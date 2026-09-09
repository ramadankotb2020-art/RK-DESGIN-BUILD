# RK Design Studio — رمضان قطب

بورتفوليو عربي RTL بهوية داكنة وذهبية، على Cloudflare Pages. مصدر المشاريع هو فولدرات الصور وملف `info.txt` لكل مشروع. البناء يولد بيانات JavaScript وصفحات HTML مستقلة وSEO وsitemap؛ لا يستخدم إطار عمل أو CMS جديدًا.

## التشغيل
```sh
npm ci
npm run build
python serve-nocache.py
```
افتح `http://localhost:8000`. لا يكفي فتح HTML مباشرة لمعاينة الروابط الجديدة ذات المجلدات.

- Windows: `update-site.bat` يضغط الوسائط الموجودة ثم يعيد بناء الموقع محليًا. **لا يولد فيديوهات، ولا يرفع إلى GitHub.**
- `npm run build`: بناء فقط بدون ضغط/استبدال الصور الأصلية.
- `npm run update`: ضغط الوسائط الموجودة ثم البناء.
- `npm run deploy:build`: تجهيز مجلد `dist` للنشر في Cloudflare.
- `npm test`: اختبارات Node، بيانات وSEO وسلامة السكربتات وFacebook Mock.
- `python tests/link-audit.py`: فحص روابط ووسائط HTML محليًا.
- `npx playwright install chromium` ثم تشغيل خادم على 8090 و`node tests/browser-audit.cjs`: اختبارات المتصفح. Playwright وAxe أدوات تطوير فقط ولا تدخل ملفات النشر.
- `npm run facebook:preview`: لا يرسل أي شيء ما لم يتم تفعيل Facebook بالمتغيرات والأسرار اللازمة.

## أدلة الاستخدام
- [إضافة المشاريع والنشر](docs/PUBLISHING-GUIDE.md)
- [إعداد Facebook الاختياري](docs/FACEBOOK-SETUP.md)
- [التقرير النهائي وSEO وSearch Console](docs/FINAL-AUDIT.md)
- [التحليل قبل التعديل](docs/IMPLEMENTATION-AUDIT.md)

## هيكل المشروع
- `site.config.json`: اسم الاستوديو، دومين الإنتاج، الاتصال، رمز تحقق Search Console الاختياري.
- `images/projects-by-name/{interior,exterior,graphic}/`: المشاريع وصورها وinfo.txt.
- `scripts/build-projects.js`: البيانات والمعرفات والأبعاد ومصغرات الأغلفة.
- `scripts/build-pages.js`: قالب مشترك يستخرج header/footer من الرئيسية ويولد صفحات المشاريع والأرشيف وsitemap ومنشورات التواصل.
- `scripts/enhance-pages.js`: بيانات الصفحات الرئيسية وSchema وأبعاد الصور.
- `projects/`: صفحات مولدة؛ لا تعدلها يدويًا.
- `images/responsive/`: أغلفة WebP مشتقة للموبايل؛ لا تستبدل صور المعرض الأصلية.
- `css/responsive.css`: تحسينات الواجهة المشتركة؛ أداة المخطط لها تنسيقات مستقلة.
- `docs/workflow-templates/facebook.yml.template`: تكامل اختياري مغلق افتراضيًا، لا يعمل من Preview branch.

لوحة `admin.html` وFunctions/KV القديمة ما زالت موجودة للتوافق، لكنها **ليست مصدر النشر المعتمد** ولا تتزامن مع صفحات المشاريع المولدة. لا تستخدم طريقتين متوازيتين لتعديل نفس المحتوى. تفاصيل الحدود المتبقية في التقرير النهائي.

لا تضع كلمات سر أو Facebook tokens في الملفات أو المحادثة. ملفات `.env` و`.dev.vars` مستبعدة من Git.

## تفعيل GitHub Actions لاحقًا
اتصال Arena الحالي لا يملك صلاحية كتابة workflows. ملفات الأتمتة محفوظة كقوالب في `docs/workflow-templates/`؛ ينسخها مالك المستودع إلى `.github/workflows/` مع إزالة امتداد `.template` عندما يريد تفعيلها. هذا ليس مطلوبًا لنشر الموقع على Cloudflare.
