const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('vm'),fs=require('fs');
const source=fs.readFileSync('scripts/facebook-publish.cjs','utf8').replace('main().catch(e=>','globalThis.done=main().catch(e=>');
const config=require('../site.config.json');
const post={id:'project-test',status:'published',url:config.url+'/projects/test/',image:config.url+'/images/test.webp',message:'Test only'};
async function run({enabled=true,existing=false,failMeta=false}={}){
 const calls=[],env={FACEBOOK_ENABLED:String(enabled),FACEBOOK_PAGE_TOKEN:'mock-token-not-a-secret',FACEBOOK_PAGE_ID:'123',FACEBOOK_API_VERSION:'v26.0',GITHUB_TOKEN:'mock-token',GITHUB_REPOSITORY:'owner/repo'};
 const process={env,exitCode:0};
 const ctx={process,URL,AbortSignal,setTimeout,console:{log(){},error(){}},require(name){
  if(name==='fs')return {readFileSync:()=>JSON.stringify([post])};return config;
 },async fetch(url,options={}){
  url=String(url);calls.push({url,method:options.method||'GET',body:options.body});
  const response=(data,headers={})=>({ok:true,status:200,json:async()=>data,text:async()=>data,headers:new Headers(headers)});
  if(url.startsWith(config.url+'/projects/'))return response('<meta name="rk-project-id" content="project-test"><meta property="og:image" content="image">');
  if(url===post.image)return response('',{'content-type':'image/webp'});
  if(url.includes('graph.facebook.com')){if(failMeta)throw Error('Simulated timeout');return response({id:'123_456'});}
  if(url.includes('/issues?'))return response(existing?[{title:'[RK Facebook] project-test'}]:[]);
  if(url.endsWith('/issues'))return response({number:7,title:'[RK Facebook] project-test'});
  return response({});
 }};
 vm.runInNewContext(source,ctx);await ctx.done;return {calls,process};
}
test('Facebook disabled means zero network requests',async()=>{const r=await run({enabled:false});assert.equal(r.calls.length,0)});
test('existing ledger blocks duplicate posting',async()=>{const r=await run({existing:true});assert(!r.calls.some(c=>c.url.includes('graph.facebook.com')))});
test('reservation precedes Meta and success stores Facebook Posted state',async()=>{
 const {calls,process}=await run();assert.equal(process.exitCode,0);
 const reserve=calls.findIndex(c=>c.url.endsWith('/issues')&&c.method==='POST');
 const meta=calls.findIndex(c=>c.url.includes('graph.facebook.com'));
 assert(reserve>=0&&meta>reserve);assert.equal(calls.filter(c=>c.url.includes('graph.facebook.com')).length,1);
 assert(calls.some(c=>c.method==='PATCH'&&c.body.includes('facebook_posted')));
});
test('ambiguous Meta result is not retried and retains reservation',async()=>{
 const {calls,process}=await run({failMeta:true});assert.equal(process.exitCode,1);
 assert.equal(calls.filter(c=>c.url.includes('graph.facebook.com')).length,1);
 assert(calls.some(c=>c.url.endsWith('/comments')));
 assert(!calls.some(c=>c.method==='DELETE'));
});
