(function () {
  'use strict';
  const buttons = [...document.querySelectorAll('[data-gallery-src]')];
  if (!buttons.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'gallery-dialog';
  dialog.setAttribute('aria-label','معرض صور المشروع');
  dialog.innerHTML = '<div class="gallery-dialog-controls"><button type="button" data-prev aria-label="الصورة السابقة">السابق</button><span aria-live="polite"></span><button type="button" data-next aria-label="الصورة التالية">التالي</button><button type="button" data-close aria-label="إغلاق المعرض">إغلاق</button></div><img alt="">';
  document.body.append(dialog);
  let index=0, opener, startX=null;
  const image=dialog.querySelector('img');
  const show = n => {
    index=(n+buttons.length)%buttons.length;
    image.src=buttons[index].dataset.gallerySrc;
    image.alt=buttons[index].querySelector('img').alt;
    dialog.querySelector('[aria-live]').textContent=`${index+1} / ${buttons.length}`;
  };
  buttons.forEach((button,i)=>button.addEventListener('click',()=>{
    opener=button;show(i);dialog.showModal();document.body.style.overflow='hidden';
  }));
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.querySelector('[data-prev]').onclick=()=>show(index-1);
  dialog.querySelector('[data-next]').onclick=()=>show(index+1);
  dialog.addEventListener('close',()=>{document.body.style.overflow='';opener?.focus();});
  dialog.addEventListener('click',e=>{if(e.target===dialog) dialog.close();});
  dialog.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'){e.preventDefault();show(index-1);}
    if(e.key==='ArrowLeft'){e.preventDefault();show(index+1);}
  });
  image.addEventListener('touchstart',e=>{startX=e.touches[0].clientX;},{passive:true});
  image.addEventListener('touchend',e=>{
    if(startX===null)return;
    const delta=e.changedTouches[0].clientX-startX;
    if(Math.abs(delta)>50)show(index+(delta>0?1:-1));startX=null;
  },{passive:true});
})();
