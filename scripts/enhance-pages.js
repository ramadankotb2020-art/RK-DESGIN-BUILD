'use strict';
const fs=require('fs'), path=require('path'), sharp=require('sharp');
const root=path.join(__dirname,'..'), config=require('../site.config.json');
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const pages={
 'index.html':['رمضان قطب | مصمم داخلي وجرافيك في مصر — RK Design Studio','RK Design Studio — رمضان قطب، تصميم داخلي سكني وتجاري، واجهات ولاندسكيب، جرافيك وهوية بصرية. خدمات تصميم في القاهرة ومصر. شاهد الأعمال واطلب استشارة.'],
 'about.html':['عن رمضان قطب | مصمم داخلي وجرافيك — RK Design Studio','تعرف على رمضان قطب ومجالات عمل RK Design Studio: التصميم الداخلي والخارجي، التصور ثلاثي الأبعاد، الجرافيك والهوية البصرية في مصر.'],
 'interior-design.html':['تصميم داخلي سكني وتجاري في القاهرة | RK Design Studio','شاهد أعمال رمضان قطب في تصميم ديكور الشقق والمساحات السكنية والتجارية، مع رندر ثلاثي الأبعاد ومخططات تنفيذية. اطلب استشارة تصميم داخلي في القاهرة ومصر.'],
 'exterior-design.html':['تصميم واجهات معمارية ولاندسكيب | RK Design Studio مصر','أعمال RK Design Studio في تصميم الواجهات المعمارية والتصميم الخارجي ولاندسكيب وتنسيق الحدائق. شاهد المشاريع وتواصل مع رمضان قطب لمناقشة مشروعك.'],
 'graphic-design.html':['تصميم هوية بصرية ولوجو في مصر | رمضان قطب — RK Design Studio','تصميم شعارات وهويات بصرية، مطبوعات وتغليف وحملات سوشيال ميديا. شاهد أعمال رمضان قطب في الجرافيك والبراندينج لخدمة العلامات التجارية في مصر.'],
 'contact.html':['طلب استشارة تصميم في القاهرة ومصر | تواصل مع RK Design Studio','تواصل مع رمضان قطب عبر واتساب لطلب استشارة في التصميم الداخلي والخارجي أو الجرافيك والهوية البصرية. أرسل تفاصيل مشروعك إلى RK Design Studio.'],
 'room-designer.html':['مخطط غرف ثنائي الأبعاد 2D أونلاين | RK Design Studio','خطط غرفتك ووزع الأثاث باستخدام مخطط RK Design Studio ثنائي الأبعاد، ثم تواصل مع رمضان قطب لمناقشة التصميم.'],
 '3d-view.html':['معاينة مخطط الغرفة ثلاثي الأبعاد | RK Design Studio','اعرض مخطط غرفتك في معاينة ثلاثية الأبعاد باستخدام أدوات RK Design Studio.'],
 'project.html':['تفاصيل المشروع | RK Design Studio','تصفح تفاصيل أحد مشاريع رمضان قطب في التصميم الداخلي والخارجي والجرافيك.']
};
module.exports=async()=>{
 for(const [file,[title,description]] of Object.entries(pages)){
  const name=path.join(root,file); let html=fs.readFileSync(name,'utf8');
  html=html.replace(/https:\/\/rk-design\.com/g,config.url);
  html=html.replace(/<meta name="keywords"[^>]*>\s*/g,'');
  html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${escape(title)}</title>`);
  const set=(key,value,property=false)=>{
   const attr=property?'property':'name';
   const re=new RegExp(`<meta ${attr}="${key}"[^>]*>`,'g');
   const tag=`<meta ${attr}="${key}" content="${escape(value)}">`;
   html=re.test(html)?html.replace(re,tag):html.replace('</head>',tag+'\n</head>');
  };
  const url=config.url+(file==='index.html'?'/':'/'+file.replace(/\.html$/, ''));
  const canonical=`<link rel="canonical" href="${url}">`;
  html=/<link rel="canonical"[^>]*>/.test(html)?html.replace(/<link rel="canonical"[^>]*>/g,canonical):html.replace('</head>',canonical+'\n</head>');
  set('description',description);set('og:title',title,true);set('og:description',description,true);set('og:url',url,true);set('og:type','website',true);set('og:locale','ar_EG',true);
  set('og:image',config.url+'/images/homepage/hero-slide-1-interior.webp',true);set('twitter:card','summary_large_image');set('twitter:title',title);set('twitter:description',description);set('twitter:image',config.url+'/images/homepage/hero-slide-1-interior.webp');
  if(['project.html','3d-view.html'].includes(file))set('robots','noindex, follow');
  // Preserve real filenames and use intrinsic dimensions, never invented aspect ratios.
  const tags=[...html.matchAll(/<img\b[^>]*>/g)];
  for(const [tag] of tags){
   const src=tag.match(/src="([^"]+)"/)?.[1]; if(!src||src.startsWith('http')||!fs.existsSync(path.join(root,src)))continue;
   try{const {width,height,orientation}=await sharp(path.join(root,src)).metadata();
    let next=tag.replace(/\s(?:width|height|decoding)="[^"]*"/g,'');
    const w=orientation>=5?height:width,h=orientation>=5?width:height;
    next=next.replace(/\s*\/?\>$/,` width="${w}" height="${h}"${/loading=/.test(tag)?'':' loading="lazy"'} decoding="async">`);html=html.replace(tag,next);
   }catch(e){throw new Error(`Invalid image ${src}: ${e.message}`)}
  }
  if(file==='index.html'){
   if(config.googleSiteVerification)set('google-site-verification',config.googleSiteVerification);
   else html=html.replace(/<meta name="google-site-verification"[^>]*>/g,'');
   const schema={'@context':'https://schema.org','@graph':[
    {'@type':'Person','@id':config.url+'/#person',name:'رمضان قطب',alternateName:'Ramadan Kotb',url:config.url+'/',jobTitle:'مصمم داخلي وجرافيك',worksFor:{'@id':config.url+'/#studio'}},
    {'@type':'Organization','@id':config.url+'/#studio',name:config.name,url:config.url+'/',telephone:config.telephone,areaServed:config.areaServed,founder:{'@id':config.url+'/#person'},knowsAbout:['Interior Design','Exterior Design','3D Visualization','2D Plans','Graphic Design','Brand Identity']},
    {'@type':'WebSite','@id':config.url+'/#website',url:config.url+'/',name:config.name,inLanguage:'ar-EG',publisher:{'@id':config.url+'/#studio'}}]};
   html=html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,`<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`);
  }
  fs.writeFileSync(name,html);
 }
};
if(require.main===module)module.exports().catch(e=>{console.error(e);process.exitCode=1});
