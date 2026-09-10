'use strict';
/* Optional server-side publisher. NEVER import this file from browser code.
   Each project's permanent GitHub issue is a reserva'use strict';
/* Optional server-side publisher. NEVER import this file from browser code.
   Each project's permanent GitHub issue is a reservation / publication ledger.
   Ambiguous requests are deliberately not retried automatically. */
// Temporary safety mode: diagnose only. No publishing or GitHub ledger writes.
const DIAGNOSTIC_ONLY = true;
const fs=require('fs');
const config=require('../site.config.json');
const posts=JSON.parse(fs.readFileSync('social-posts.json','utf8'));
const dryRun=process.env.FACEBOOK_ENABLED!=='true';
async function main(){
 if(dryRun){console.log(`Facebook disabled. ${posts.length} opt-in published posts prepared; no network requests sent.`);return;}
 const {FACEBOOK_PAGE_TOKEN:token,FACEBOOK_PAGE_ID:page,FACEBOOK_API_VERSION:version,GITHUB_TOKEN:github,GITHUB_REPOSITORY:repo}=process.env;
 if(!token||!/^\d+$/.test(page||'')||!/^v\d+\.\d+$/.test(version||'')||!github||!repo)throw Error('Missing or invalid Facebook/GitHub configuration. See docs/FACEBOOK-SETUP.md.');
 if (DIAGNOSTIC_ONLY) {
  console.log('DIAGNOSTIC ONLY: no posts sent; no reservation changed.');
  const check = async (label, endpoint) => {
   try {
    const response = await fetch(`https://graph.facebook.com/${version}/${endpoint}`, {
     headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000)
    });
    const data = await response.json();
    if (!response.ok || data.error) {
     const code = Number.isInteger(data.error?.code) ? data.error.code : null;
     const subcode = Number.isInteger(data.error?.error_subcode) ? data.error.error_subcode : null;
     console.log(JSON.stringify({ check:label, ok:false, http:response.status, code, subcode }));
     // Do not print arbitrary API messages: they may contain tokens or private content.
     if (code === 190) console.log('TOKEN CHECK: invalid/expired/revoked token; inspect expiry in Meta privately.');
     if (code === 10 || code === 200) console.log('PERMISSION CHECK: inspect app access and Page permissions in Meta.');
     return null;
    }
    console.log(JSON.stringify({ check:label, ok:true, http:response.status }));
    return data;
   } catch {
    console.log(JSON.stringify({ check:label, ok:false, reason:'Network timeout or invalid JSON; no raw error logged.' }));
    return null;
   }
  };
  const identity = await check('PAGE_TOKEN_IDENTITY', 'me?fields=id');
  const matches = identity && String(identity.id) === page;
  if (identity) console.log('TOKEN_MATCHES_CONFIGURED_PAGE=' + Boolean(matches));
  if (!matches) {
   console.log('STOP: could not confirm that the saved secret is a token for the configured Page.');
   process.exitCode = 1;
   return;
  }
  const feed = await check('PAGE_FEED_READ', `${page}/feed?fields=id&limit=1`);
  // Read permission does NOT prove publish permission. Never perform a test POST here.
  const debug = await check('TOKEN_DETAILS_OPTIONAL', `debug_token?input_token=${encodeURIComponent(token)}`);
  if (debug?.data) {
   const d=debug.data;
   const scopes=['pages_show_list','pages_read_engagement','pages_manage_posts'];
   const details={check:'TOKEN_DETAILS_SAFE'};
   if(typeof d.is_valid==='boolean') details.is_valid=d.is_valid;
   if(['PAGE','USER','APP','SYSTEM_USER'].includes(d.type)) details.type=d.type;
   for(const key of ['expires_at','data_access_expires_at']) if(Number.isFinite(d[key])) details[key]=d[key];
   if(Array.isArray(d.scopes)) details.requiredScopes=Object.fromEntries(scopes.map(scope=>[scope,d.scopes.includes(scope)]));
   console.log(JSON.stringify(details));
  }
  console.log('DONE: read-only diagnostics. Optional token introspection may require another credential; its failure alone does not prove token invalidity.');
  console.log('Read checks cannot establish why the earlier publish failed. Existing reservation is preserved.');
  if(!feed) process.exitCode=1;
  return;
 }
 const gh=async(route,method='GET',body)=>{
  const r=await fetch(`https://api.github.com/repos/${repo}${route}`,{method,headers:{Authorization:`Bearer ${github}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
  if(!r.ok)throw Error(`GitHub ledger request failed (${r.status}). No retry performed.`);
  return r.json();
 };
 const issues=[];
 for(let p=1;;p++){const list=await gh(`/issues?state=all&per_page=100&page=${p}`);issues.push(...list);if(list.length<100)break;}
 for(const post of posts){
  const title=`[RK Facebook] ${post.id}`;
  if(issues.some(i=>i.title===title)){console.log(`Skipped existing reservation: ${post.id}`);continue;}
  const url=new URL(post.url),image=new URL(post.image);
  if(url.origin!==config.url||image.origin!==config.url||!url.pathname.startsWith('/projects/'))throw Error('Unexpected project origin/path.');
  // Cloudflare deploy must have completed. Missing or old pages must never be advertised.
  let ready=false;
  for(let attempt=0;attempt<16;attempt++){
   try{
    const live=await fetch(url,{signal:AbortSignal.timeout(15000)});
    const html=live.ok?await live.text():'';
    ready=html.includes(`content="${post.id}"`)&&html.includes('property="og:image"');
   }catch{} // Deployment may not be ready yet; no publish request has been made.
   if(ready)break;
   if(attempt<15)await new Promise(resolve=>setTimeout(resolve,15000));
  }
  if(!ready)throw Error(`Project not deployed yet: ${post.id}. Re-run after Pages deployment.`);
  const cover=await fetch(image,{method:'HEAD',signal:AbortSignal.timeout(20000)});
  if(!cover.ok||!(cover.headers.get('content-type')||'').startsWith('image/'))throw Error(`Cover unavailable for ${post.id}.`);
  // Create BEFORE sending: crash/timeout leaves a reservation requiring human reconciliation.
  const issue=await gh('/issues','POST',{title,body:JSON.stringify({state:'publishing',project:post.id,url:post.url,startedAt:new Date().toISOString()},null,2)});
  issues.push(issue);
  try{
   const response=await fetch(`https://graph.facebook.com/${version}/${page}/feed`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({message:post.message,link:post.url}),signal:AbortSignal.timeout(30000)});
   const data=await response.json();
   if(!response.ok||!data.id)throw Error(`Meta rejected request (${response.status}); check permissions/token privately.`);
   await gh(`/issues/${issue.number}`,'PATCH',{body:JSON.stringify({state:'facebook_posted',project:post.id,url:post.url,postId:data.id,postedAt:new Date().toISOString()},null,2),state:'closed'});
   console.log(`Facebook post recorded for ${post.id}.`);
  }catch(error){
   // Do not log response bodies or credentials; the request might have succeeded remotely.
   await gh(`/issues/${issue.number}/comments`,'POST',{body:'Posting needs manual review. Check the Facebook Page before any retry; this reservation blocks automatic duplicate posting.'}).catch(()=>{});
   throw Error(`Review reservation #${issue.number}. Automatic retry is blocked for safety.`);
  }
 }
}
main().catch(e=>{console.error(e.message);process.exitCode=1});tion / publication ledger.
   Ambiguous requests are deliberately not retried automatically. */
const fs=require('fs');
const config=require('../site.config.json');
const posts=JSON.parse(fs.readFileSync('social-posts.json','utf8'));
const dryRun=process.env.FACEBOOK_ENABLED!=='true';
async function main(){
 if(dryRun){console.log(`Facebook disabled. ${posts.length} opt-in published posts prepared; no network requests sent.`);return;}
 const {FACEBOOK_PAGE_TOKEN:token,FACEBOOK_PAGE_ID:page,FACEBOOK_API_VERSION:version,GITHUB_TOKEN:github,GITHUB_REPOSITORY:repo}=process.env;
 if(!token||!/^\d+$/.test(page||'')||!/^v\d+\.\d+$/.test(version||'')||!github||!repo)throw Error('Missing or invalid Facebook/GitHub configuration. See docs/FACEBOOK-SETUP.md.');
 const gh=async(route,method='GET',body)=>{
  const r=await fetch(`https://api.github.com/repos/${repo}${route}`,{method,headers:{Authorization:`Bearer ${github}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
  if(!r.ok)throw Error(`GitHub ledger request failed (${r.status}). No retry performed.`);
  return r.json();
 };
 const issues=[];
 for(let p=1;;p++){const list=await gh(`/issues?state=all&per_page=100&page=${p}`);issues.push(...list);if(list.length<100)break;}
 for(const post of posts){
  const title=`[RK Facebook] ${post.id}`;
  if(issues.some(i=>i.title===title)){console.log(`Skipped existing reservation: ${post.id}`);continue;}
  const url=new URL(post.url),image=new URL(post.image);
  if(url.origin!==config.url||image.origin!==config.url||!url.pathname.startsWith('/projects/'))throw Error('Unexpected project origin/path.');
  // Cloudflare deploy must have completed. Missing or old pages must never be advertised.
  let ready=false;
  for(let attempt=0;attempt<16;attempt++){
   try{
    const live=await fetch(url,{signal:AbortSignal.timeout(15000)});
    const html=live.ok?await live.text():'';
    ready=html.includes(`content="${post.id}"`)&&html.includes('property="og:image"');
   }catch{} // Deployment may not be ready yet; no publish request has been made.
   if(ready)break;
   if(attempt<15)await new Promise(resolve=>setTimeout(resolve,15000));
  }
  if(!ready)throw Error(`Project not deployed yet: ${post.id}. Re-run after Pages deployment.`);
  const cover=await fetch(image,{method:'HEAD',signal:AbortSignal.timeout(20000)});
  if(!cover.ok||!(cover.headers.get('content-type')||'').startsWith('image/'))throw Error(`Cover unavailable for ${post.id}.`);
  // Create BEFORE sending: crash/timeout leaves a reservation requiring human reconciliation.
  const issue=await gh('/issues','POST',{title,body:JSON.stringify({state:'publishing',project:post.id,url:post.url,startedAt:new Date().toISOString()},null,2)});
  issues.push(issue);
  try{
   const response=await fetch(`https://graph.facebook.com/${version}/${page}/feed`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({message:post.message,link:post.url}),signal:AbortSignal.timeout(30000)});
   const data=await response.json();
   if(!response.ok||!data.id)throw Error(`Meta rejected request (${response.status}); check permissions/token privately.`);
   await gh(`/issues/${issue.number}`,'PATCH',{body:JSON.stringify({state:'facebook_posted',project:post.id,url:post.url,postId:data.id,postedAt:new Date().toISOString()},null,2),state:'closed'});
   console.log(`Facebook post recorded for ${post.id}.`);
  }catch(error){
   // Do not log response bodies or credentials; the request might have succeeded remotely.
   await gh(`/issues/${issue.number}/comments`,'POST',{body:'Posting needs manual review. Check the Facebook Page before any retry; this reservation blocks automatic duplicate posting.'}).catch(()=>{});
   throw Error(`Review reservation #${issue.number}. Automatic retry is blocked for safety.`);
  }
 }
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
