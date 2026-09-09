'use strict';
// Curated static deployment: scripts, docs, backups, node_modules and source secrets stay out.
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),out=path.join(root,'dist');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const files=['index.html','admin.html','about.html','contact.html','interior-design.html','exterior-design.html','graphic-design.html','room-designer.html','3d-view.html','project.html','404.html','favicon.svg','robots.txt','sitemap.xml','_headers','_routes.json'];
for(const f of files)fs.copyFileSync(path.join(root,f),path.join(out,f));
for(const d of ['css','js','images','videos','projects'])fs.cpSync(path.join(root,d),path.join(out,d),{recursive:true,filter:src=>!src.endsWith('.bak')&&!src.endsWith('info.txt')});
console.log('Static site prepared in dist/. Secrets, scripts, docs and backups excluded.');
