/* Run with NODE_PATH pointing at Playwright and @axe-core/playwright.
   BROWSER_PATH may point at an existing Chromium; no live forms or Meta requests are sent. */
const {chromium}=require('playwright');
const fs=require('fs');
fs.mkdirSync('test-results',{recursive:true});
(async()=>{
 const launch={headless:true};
 if(process.env.BROWSER_PATH)launch.executablePath=process.env.BROWSER_PATH;
 if(process.env.BROWSER_PATH)launch.args=['--no-sandbox','--disable-dev-shm-usage'];
 const browser=await chromium.launch(launch);
 const base=process.env.AUDIT_URL||'http://localhost:8090';
 const vm=require('vm'),c={};vm.createContext(c);vm.runInContext(fs.readFileSync('js/projects-data.js','utf8')+';this.projects=projectsData',c);
 const routes=['/','/about.html','/interior-design.html','/exterior-design.html','/graphic-design.html','/contact.html','/room-designer.html','/3d-view.html','/projects/',...c.projects.map(p=>'/'+p.url),'/404.html','/project.html?id=missing'];
 const widths=[320,360,375,390,414,430,480,768,820,1024,1280,1440,1920,2560];
 const report={checks:[],errors:[],networkErrors:[],accessibility:[],interactions:[]};
 for(const route of routes){
  const context=await browser.newContext(); const page=await context.newPage();
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  page.on('pageerror',e=>report.errors.push({route,error:e.message}));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)report.networkErrors.push({route,url:r.url(),status:r.status()});});
  await page.goto(base+route,{waitUntil:'domcontentloaded'});
  for(const width of widths){
   await page.setViewportSize({width,height:900});
   await page.waitForTimeout(80);
   const result=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,overflow:[...document.querySelectorAll('main *,header *,footer *')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width && s.position!=='absolute' && s.position!=='fixed' && (r.right>innerWidth+1||r.left< -1)}).slice(0,10).map(e=>e.tagName+'.'+e.className)}));
   report.checks.push({route,width,...result});
  }
  if(route==='/'){
   await page.setViewportSize({width:390,height:844});
   await page.locator('.nav-toggle').click();
   report.interactions.push({test:'mobile menu opens',pass:await page.locator('.nav-links').isVisible()});
   await page.keyboard.press('Escape');
   report.interactions.push({test:'Escape closes menu',pass:!(await page.locator('.nav-links').isVisible())});
   await page.screenshot({path:'test-results/home-mobile.png'});
   await page.locator('[data-search-trigger]').click();await page.locator('#search-input').fill('مطعم');
   report.interactions.push({test:'search finds restaurants',pass:await page.locator('#search-results a').count()===Math.min(6,c.projects.filter(p=>(p.title||'').includes('مطعم')||(p.category||'').includes('مطعم')).length)});await page.keyboard.press('Escape');
   await page.locator('.hero-pause').click();report.interactions.push({test:'carousel can pause',pass:(await page.locator('.hero-pause').getAttribute('aria-label')).includes('تشغيل')});
   await page.setViewportSize({width:1440,height:1000});
   await page.screenshot({path:'test-results/home-desktop.png'});
  }
  if(route==='/interior-design.html'){
   const restaurants=page.locator('[data-filter="مطاعم"]');
   if(await restaurants.count()){await restaurants.click();
   report.interactions.push({test:'restaurant filter',pass:await page.locator('[data-work-grid] .project-card').count()===c.projects.filter(p=>p.discipline==='interior'&&(p.category||'').includes('مطاعم')).length});
   await page.locator('[data-filter="all"]').click();}
  }
  if(route==='/contact.html'){
   await page.setViewportSize({width:390,height:844});
   await page.locator('[type=submit]').click();
   report.interactions.push({test:'empty contact form rejected',pass:(await page.locator('[data-form-status]').textContent()).includes('يرجى')});
   await page.locator('#name').fill('اختبار');await page.locator('#phone').fill('01112345678');await page.locator('#message').fill('اختبار نموذج بدون إرسال');await page.locator('label[for=s1]').click();
   let wa='';await page.route('https://wa.me/**',r=>{wa=r.request().url();r.abort();});
   await page.locator('[type=submit]').click();await page.waitForTimeout(150);
   report.interactions.push({test:'valid form prepares WhatsApp URL (intercepted, not sent)',pass:wa.includes('wa.me/201112630681?text=')});
   await page.goto(base+route);
  }
  if(route.startsWith('/projects/')&&route!=='/projects/'){
   const btn=page.locator('[data-gallery-src]').first();if(await btn.count()){
    await btn.click();report.interactions.push({test:'gallery opens',pass:await page.locator('dialog').isVisible()});await page.keyboard.press('Escape');report.interactions.push({test:'gallery Escape and focus restore',pass:await btn.evaluate(e=>e===document.activeElement)});
   }
  }
  if(['/','/contact.html','/interior-design.html'].includes(route)){
   const AxeBuilder=require('@axe-core/playwright').default;
   const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   report.accessibility.push({route,violations:a.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.slice(0,6).map(n=>({target:n.target,summary:n.failureSummary}))}))});
  }
  await context.close();
 }
 fs.writeFileSync('test-results/browser-audit.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({checks:report.checks.length,overflow:report.checks.filter(c=>c.scroll>c.width),errors:report.errors,networkErrors:report.networkErrors,interactions:report.interactions,accessibility:report.accessibility},null,2));
 await browser.close();
 if(report.checks.some(c=>c.scroll>c.width)||report.errors.length||report.networkErrors.length||report.interactions.some(i=>!i.pass))process.exitCode=1;
})();
