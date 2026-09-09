const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs'),vm=require('vm'),path=require('path');
const config=require('../site.config.json');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('js/projects-data.js','utf8')+';this.projects=projectsData',context);
const projects=context.projects;
test('published projects have unique stable identities, valid media, metadata and routes',()=>{
 assert(projects.length>0);
 assert.equal(new Set(projects.map(p=>p.id)).size,projects.length);
 assert.equal(new Set(projects.map(p=>p.slug)).size,projects.length);
 assert.equal(new Set(projects.map(p=>p.seoTitle)).size,projects.length);
 for(const p of projects){
  assert.equal(p.status,'published');assert(p.seoTitle&&p.seoDescription&&p.alt);
  for(const src of [p.cover,...p.gallery])assert(fs.existsSync(src),src);
  for(const src of p.coverSources)assert(fs.existsSync(src.src));
  assert(p.imageMeta[p.cover].width>0);
  const html=fs.readFileSync(path.join('projects',p.slug,'index.html'),'utf8');
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert(html.includes('property="og:image"'));
  assert(html.includes('name="rk-project-id"'));
  assert(html.includes(new URL(p.url,config.url).href));
  assert(!html.includes('noindex'));
  for(const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(match[1]);
 }
});
test('sitemap contains every published project on the production origin',()=>{
 const sitemap=fs.readFileSync('sitemap.xml','utf8');
 const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 assert.equal(new Set(urls).size,urls.length);
 assert.equal(urls.length,projects.length+8);
 for(const url of urls)assert(url.startsWith(config.url+'/'));
 for(const p of projects)assert(urls.includes(new URL(p.url,config.url).href));
 assert(fs.readFileSync('robots.txt','utf8').includes(config.url+'/sitemap.xml'));
});
test('Windows update never generates videos and retains Windows line endings',()=>{
 const bat=fs.readFileSync('update-site.bat','utf8');
 assert(!bat.includes('generate-videos.js'));
 assert(bat.includes('scripts\\build-projects.js'));
 assert.equal((bat.match(/\n/g)||[]).length,(bat.match(/\r\n/g)||[]).length);
});
test('social queue requires explicit opt-in and has unique identifiers',()=>{
 const posts=JSON.parse(fs.readFileSync('social-posts.json'));
 assert.equal(new Set(posts.map(p=>p.id)).size,posts.length);
 for(const post of posts){const p=projects.find(p=>p.id===post.id);assert(p.facebook);assert.equal(post.status,'published');assert(post.message.includes(post.url));}
});
test('shared and inline scripts parse successfully',()=>{
 for(const file of fs.readdirSync('js').filter(f=>f.endsWith('.js')&&f!=='three.min.js'))new vm.Script(fs.readFileSync('js/'+file,'utf8'),{filename:file});
 for(const file of fs.readdirSync('.').filter(f=>f.endsWith('.html'))){
  const html=fs.readFileSync(file,'utf8');
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
   if(/src=|application\/ld\+json|type="module"/.test(match[1]))continue;
   new vm.Script(match[2],{filename:file});
  }
 }
});
test('authentication fails closed when no admin password is configured',async()=>{
 const source=fs.readFileSync('functions/_utils.js','utf8');
 const m=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const token=await m.sessionToken(undefined);
 assert.equal(await m.isAuthenticated(new Request('https://example.test',{headers:{Cookie:'rk_session='+token}}),{}),false);
});
