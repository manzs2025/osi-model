/**
 * ═══════════════════════════════════════════════════════════
 *  migrate.js  —  سكريبت ترحيل محتوى الموقع إلى Firestore
 *  يُشغَّل مرة واحدة فقط من أي صفحة HTML مؤقتة
 *
 *  الاستخدام:
 *  1. أنشئ صفحة migrate.html وأضف فيها:
 *       <script type="module" src="migrate.js"></script>
 *  2. افتحها في المتصفح بعد تسجيل دخول المشرف
 *  3. انتظر رسالة "اكتمل الترحيل"
 *  4. احذف migrate.html و migrate.js فوراً
 * ═══════════════════════════════════════════════════════════
 */

import { initializeApp }          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection,
         addDoc, getDocs, query,
         where, serverTimestamp }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* ─── إعدادات Firebase ─────────────────────────────── */
const app = initializeApp({
  apiKey:            "AIzaSyCz9Wedr_X3VzoaH0gJj8QFrNIK5vT4vww",
  authDomain:        "networkacademy-795c8.firebaseapp.com",
  projectId:         "networkacademy-795c8",
  storageBucket:     "networkacademy-795c8.firebasestorage.app",
  messagingSenderId: "458132238000",
  appId:             "1:458132238000:web:bffd7321407b094bb21575",
});
const db   = getFirestore(app);
const auth = getAuth(app);

/* ═══════════════════════════════════════════════════════
   محتوى الصفحات الخمس — HTML جاهز للتحرير في TinyMCE
   يمكنك استبدال أي قسم بمحتواك الكامل لاحقاً
═══════════════════════════════════════════════════════ */
const SITE_PAGES = [

  /* ══════════════════════════════════════
     1. شبكات الحاسب الآلي
  ══════════════════════════════════════ */
  {
    pageId:  "networks",
    title:   "شبكات الحاسب الآلي — Computer Networks",
    excerpt: "مقدمة شاملة عن شبكات الحاسب الآلي وتعريفها ومكوناتها وفوائدها وأنواعها",
    content: /* html */`
<h1>شبكات الحاسب الآلي</h1>
<h2>ما هي شبكة الحاسب؟ (Network Computer)</h2>
<p>شبكة الحاسب عبارة عن مجموعة من الحاسبات والأجهزة الأخرى المتصلة مع بعضها البعض حيث يكون لها القدرة على مشاركة عدد كبير من المستخدمين للبيانات <strong>(Data)</strong> والأجهزة <strong>(Hardware)</strong> كما تعتبر الشبكة وسيلة اتصال إلكتروني بين الأفراد.</p>

<h2>مكونات شبكة الحاسب</h2>
<p>تتكون شبكة الحاسب من ثلاث مكونات رئيسية وهي:</p>
<h3>① الأجهزة الطرفية (Clients)</h3>
<p>أي جهاز يُرسل المعلومات ويستقبلها على الشبكة مثل كمبيوتر، طابعة. الجهاز الطرفي هو المكان الذي تنشأ منه الرسالة أو المكان الذي يتم استلامها فيه. تنشأ البيانات باستخدام جهاز طرفي، وتتدفق خلال الشبكة، وتصل إلى جهاز طرفي آخر.</p>
<h3>② الأجهزة الوسيطة</h3>
<p>هي الأجهزة المسؤولة عن توجيه الحزم ما بين المرسل والمستقبل مثل سويتش، راوتر، نقطة الوصول. ومن الأمثلة على هذه الأجهزة:</p>
<ul>
  <li>أجهزة التبديل — المبدل/المحول: <strong>Switch</strong></li>
  <li>نقاط الوصول اللاسلكية: <strong>Access Point</strong></li>
  <li>أجهزة التوجيه — الموجه: <strong>Router</strong></li>
  <li>جدران الحماية: <strong>Firewall</strong></li>
</ul>
<h3>③ وسائط الشبكة</h3>
<p>مكون تنتقل عبره الرسالة من المصدر إلى الوجهة. أنواعه:</p>
<ul>
  <li><strong>Cable</strong> — كابل سلكي</li>
  <li><strong>Fiber Optic</strong> — ألياف ضوئية</li>
  <li><strong>Wireless</strong> — موجات لاسلكية</li>
</ul>

<h2>فوائد شبكات الحاسب</h2>
<ol>
  <li><strong>مشاركة موارد الشبكة (Hardware):</strong> مشاركة الطابعة وأجهزة التخزين بين المستخدمين.</li>
  <li><strong>مشاركة البرمجيات (Software):</strong> مشاركة البرمجيات بين المستخدمين على الشبكة.</li>
  <li><strong>مشاركة الملفات مباشرة:</strong> نقل الملفات مباشرة بين الأجهزة بدلاً من البريد الإلكتروني.</li>
  <li><strong>ممارسة الألعاب الجماعية (Multiplayer):</strong> ممارسة الألعاب بين أكثر من مستخدم عبر الشبكة.</li>
</ol>

<h2>أنواع شبكات الحاسب</h2>
<h3>أولاً: الشبكات من حيث المدى الجغرافي</h3>
<table>
  <thead><tr><th>الاختصار</th><th>الاسم</th><th>الوصف</th></tr></thead>
  <tbody>
    <tr><td><strong>LAN</strong></td><td>الشبكة المحلية</td><td>تربط أجهزة داخل منطقة جغرافية محدودة مثل منزل أو مكتب.</td></tr>
    <tr><td><strong>WLAN</strong></td><td>الشبكة المحلية اللاسلكية</td><td>تستخدم تقنية Wi-Fi للتواصل بين الأجهزة دون كابلات.</td></tr>
    <tr><td><strong>PAN</strong></td><td>الشبكة الشخصية</td><td>توصّل أجهزة شخصية قريبة في نطاق بضعة أمتار.</td></tr>
    <tr><td><strong>MAN</strong></td><td>الشبكة المتوسطة</td><td>تربط عدة شبكات LAN ضمن نطاق مدينة أو منطقة.</td></tr>
    <tr><td><strong>WAN</strong></td><td>الشبكة الواسعة</td><td>تربط شبكات عبر مسافات جغرافية كبيرة كمدن أو دول.</td></tr>
  </tbody>
</table>
<h3>ثانياً: الشبكات من حيث معمارية الشبكة</h3>
<ul>
  <li><strong>شبكة نظير إلى نظير (Peer to Peer):</strong> تتصل الحواسيب ببعضها مباشرة دون خادم مركزي.</li>
  <li><strong>شبكة العميل والخادم (Client Server):</strong> خادم مركزي يقدم الخدمات للعملاء.</li>
</ul>
<h3>ثالثاً: الشبكات حسب التصميم الهندسي (Topology)</h3>
<ul>
  <li><strong>الشبكة الخطية (Bus):</strong> جميع الأجهزة متصلة بكابل واحد.</li>
  <li><strong>الشبكة النجمية (Star):</strong> جميع الأجهزة متصلة بمركز واحد (Switch).</li>
  <li><strong>الشبكة الحلقية (Ring):</strong> الأجهزة في شكل حلقة مغلقة.</li>
  <li><strong>الشبكة المعقدة (Mesh):</strong> كل جهاز متصل بجميع الأجهزة الأخرى.</li>
</ul>
`.trim(),
  },

  /* ══════════════════════════════════════
     2. الأمان في الشبكات
  ══════════════════════════════════════ */
  {
    pageId:  "security",
    title:   "الأمان في شبكات الحاسب — Network Security",
    excerpt: "مفهوم أمان الشبكات والتهديدات الداخلية والخارجية وحلول الأمان",
    content: /* html */`
<h1>الأمان في شبكات الحاسب</h1>
<h2>مفهوم أمان الشبكات</h2>
<p>أمان الشبكات هو مجموعة من السياسات والتقنيات التي تهدف إلى حماية البيانات والأجهزة المتصلة بالشبكة من الوصول غير المصرح به، أو سوء الاستخدام، أو الهجمات.</p>
<h3>أهمية أمان الشبكات</h3>
<ul>
  <li>حماية البيانات الحساسة</li>
  <li>ضمان استمرارية العمل</li>
  <li>تعزيز الثقة في الأنظمة التقنية</li>
  <li>منع الخسائر المالية</li>
</ul>

<h2>التهديدات الداخلية للشبكة</h2>
<p>هي التهديدات التي تأتي من داخل المؤسسة نفسها، سواء بقصد أو بدون قصد. <strong>لماذا هي خطيرة؟</strong> لأن أصحابها غالباً يمتلكون صلاحيات وصول واسعة.</p>
<h3>أمثلة على التهديدات الداخلية</h3>
<ul>
  <li>موظف يشارك كلمة المرور مع الآخرين.</li>
  <li>حذف ملفات مهمة عن طريق الخطأ.</li>
  <li>استخدام أجهزة شخصية غير آمنة داخل الشبكة.</li>
  <li>موظف غاضب يقوم بتخريب البيانات.</li>
</ul>

<h2>التهديدات الخارجية للشبكة</h2>
<p>هي التهديدات التي تأتي من خارج حدود الشبكة. <strong>خطورتها:</strong> قد تؤدي إلى سرقة بيانات، تعطيل خدمات، أو ابتزاز مالي.</p>
<h3>أمثلة على التهديدات الخارجية</h3>
<ul>
  <li><strong>هجمات الاختراق (Hacking):</strong> الوصول غير المصرح به للأنظمة.</li>
  <li><strong>البرمجيات الخبيثة (Malware):</strong> برامج ضارة لإلحاق الضرر أو سرقة البيانات.</li>
  <li><strong>هجمات حجب الخدمة (DDoS):</strong> إغراق الخوادم بطلبات زائفة لتعطيلها.</li>
  <li><strong>التصيد الإلكتروني (Phishing):</strong> خداع المستخدمين للحصول على بياناتهم.</li>
  <li><strong>استغلال الثغرات الأمنية:</strong> استغلال نقاط الضعف في البرامج.</li>
</ul>

<h2>حلول الأمان في الشبكات</h2>
<table>
  <thead><tr><th>الحل</th><th>الوصف</th></tr></thead>
  <tbody>
    <tr><td><strong>الجدران النارية (Firewalls)</strong></td><td>تعمل كحارس بين الشبكة الداخلية والخارجية.</td></tr>
    <tr><td><strong>أنظمة IDS/IPS</strong></td><td>IDS يكتشف الهجمات. IPS يكتشف ويمنع تلقائياً.</td></tr>
    <tr><td><strong>التشفير (Encryption)</strong></td><td>تحويل البيانات لصيغة غير مفهومة إلا لمن يملك المفتاح.</td></tr>
    <tr><td><strong>النسخ الاحتياطي (Backup)</strong></td><td>حماية البيانات من الفقدان أو هجمات الفدية.</td></tr>
    <tr><td><strong>إدارة الصلاحيات (Access Control)</strong></td><td>تحديد من يمكنه الوصول إلى ماذا.</td></tr>
    <tr><td><strong>التوعية الأمنية</strong></td><td>تدريب المستخدمين على الممارسات الآمنة.</td></tr>
  </tbody>
</table>
`.trim(),
  },

  /* ══════════════════════════════════════
     3. نموذج OSI
  ══════════════════════════════════════ */
  {
    pageId:  "osi",
    title:   "نموذج OSI — Open Systems Interconnection",
    excerpt: "النموذج المرجعي لبروتوكولات الاتصال في شبكات الحاسب — سبع طبقات ووظائفها",
    content: /* html */`
<h1>نموذج OSI</h1>
<h2>ما هو نموذج OSI؟</h2>
<p>OSI هو مراحل تكون البيانات ونقلها من الجهاز المرسل (Source device) إلى الجهاز المستقبل (Destination device). وضعته المنظمة الدولية للمعايير (ISO) سنة 1983 برقم 7498، ليكون نموذجاً نظرياً موثوقاً لبروتوكولات الاتصالات بين شبكات الحاسب. وظائفه مقسمة على <strong>سبع طبقات (Layers)</strong>.</p>

<h2>فائدة فهم OSI Layers</h2>
<ol>
  <li>تستطيع فهم وحل المشاكل Troubleshooting الشبكات.</li>
  <li>معرفة كيفية تكوين البيانات في كل مرحلة Encapsulations.</li>
  <li>معرفة النقاط الحساسة وكيفية تشفير البيانات وفك التشفير.</li>
  <li>معرفة كل جهاز في أية طبقة يعمل (HUB، الراوتر، السويتش، الكمبيوتر).</li>
</ol>

<h2>عملية التغليف (Encapsulation)</h2>
<p>تسمى العملية التي تضيف فيها البروتوكولات الترويسات والتذييل على البيانات بعملية <strong>تغليف البيانات (Encapsulation)</strong>. أما في الاستقبال فتُسمى <strong>فك التغليف (De-Encapsulation)</strong>.</p>

<h2>طبقات نموذج OSI</h2>
<table>
  <thead><tr><th>رقم الطبقة</th><th>الاسم</th><th>الوظيفة</th><th>الجهاز الرئيسي</th><th>البروتوكولات</th></tr></thead>
  <tbody>
    <tr><td>7</td><td>Application — التطبيقات</td><td>التطبيقات التي نستخدمها (WhatsApp, Gmail)</td><td>—</td><td>HTTP، FTP، SMTP</td></tr>
    <tr><td>6</td><td>Presentation — التقديم</td><td>تهيئة البيانات والتشفير وفك التشفير</td><td>—</td><td>JPEG، HTML</td></tr>
    <tr><td>5</td><td>Session — الجلسة</td><td>إدارة وفتح وإغلاق الاتصال</td><td>—</td><td>NFS، SQL</td></tr>
    <tr><td>4</td><td>Transport — النقل</td><td>تحديد نوع البروتوكول المناسب للبيانات</td><td>—</td><td>TCP، UDP</td></tr>
    <tr><td>3</td><td>Network — الشبكة</td><td>توجيه الحزم وإضافة عنوان IP</td><td>Router</td><td>IPv4، IPv6</td></tr>
    <tr><td>2</td><td>Data Link — ربط البيانات</td><td>تقسيم البيانات إلى Frames، التعرف بـ MAC</td><td>Switch</td><td>Ethernet</td></tr>
    <tr><td>1</td><td>Physical — الفيزيائية</td><td>نقل البيانات كإشارات كهربائية (Bits)</td><td>Hub، Cables</td><td>—</td></tr>
  </tbody>
</table>

<h2>البروتوكول (Protocol)</h2>
<p>البروتوكول عبارة عن مجموعة القواعد التي تحدد كيف يمكن لأجهزة الكمبيوتر أن تتفاهم مع بعضها عبر الشبكة. وهو مجموعة من الأكواد البرمجية كُتبت لتسهيل عملية التخاطب بين الأجهزة.</p>

<h2>الفروقات بين TCP و UDP</h2>
<table>
  <thead><tr><th>الفروق</th><th>TCP</th><th>UDP</th></tr></thead>
  <tbody>
    <tr><td>حجم الـ Header</td><td>20 bytes</td><td>8 bytes</td></tr>
    <tr><td>السرعة</td><td>أبطأ</td><td>أسرع</td></tr>
    <tr><td>التحقق من الأخطاء</td><td>نعم ✓</td><td>لا ✗</td></tr>
    <tr><td>ترتيب الرسالة</td><td>نعم ✓</td><td>لا ✗</td></tr>
    <tr><td>الاستخدام</td><td>تحميل الملفات</td><td>مشاهدة الفيديو</td></tr>
  </tbody>
</table>

<h2>الفروقات بين السويتش والراوتر</h2>
<table>
  <thead><tr><th>الخاصية</th><th>السويتش (Switch)</th><th>الراوتر (Router)</th></tr></thead>
  <tbody>
    <tr><td>الطبقة</td><td>Layer 2 — Data Link</td><td>Layer 3 — Network</td></tr>
    <tr><td>العنوان المستخدم</td><td>MAC Address</td><td>IP Address</td></tr>
    <tr><td>الوظيفة</td><td>ربط أجهزة نفس الشبكة</td><td>ربط شبكات مختلفة</td></tr>
  </tbody>
</table>

<h2>نموذج TCP/IP</h2>
<table>
  <thead><tr><th>طبقة TCP/IP</th><th>الطبقات المقابلة في OSI</th><th>البروتوكولات</th></tr></thead>
  <tbody>
    <tr><td>طبقة التطبيق</td><td>7 + 6 + 5</td><td>HTTP، FTP، SMTP، DNS</td></tr>
    <tr><td>طبقة النقل</td><td>4</td><td>TCP، UDP</td></tr>
    <tr><td>طبقة الإنترنت</td><td>3</td><td>IPv4، IPv6، OSPF</td></tr>
    <tr><td>طبقة وصول الشبكة</td><td>2 + 1</td><td>Ethernet، Wi-Fi</td></tr>
  </tbody>
</table>
`.trim(),
  },

  /* ══════════════════════════════════════
     4. كيابل الشبكات
  ══════════════════════════════════════ */
  {
    pageId:  "cables",
    title:   "كيابل الشبكات — Networking Cables",
    excerpt: "تعريف كابلات الشبكات وأنواعها المختلفة وأدوات تصنيعها وتركيبها",
    content: /* html */`
<h1>كيابل الشبكات</h1>
<h2>تعريف كيبل الشبكة</h2>
<p>الكابل هو الذي تنتقل من خلاله البيانات والمعلومات من حاسب إلى آخر في الشبكة أو من شبكة إلى شبكة أخرى.</p>

<h2>أنواع كابلات الشبكات</h2>
<ol>
  <li>الكابل المحوري (Coaxial Cable)</li>
  <li>الكابل المزدوج المجدول (Twisted Pair Cable)</li>
  <li>الكابل الضوئي (Fiber Optic Cable)</li>
</ol>

<h2>الكابل المحوري (Coaxial Cable)</h2>
<p>يتكون من عدة طبقات متحدة المحور:</p>
<ul>
  <li><strong>الغلاف الخارجي:</strong> طبقة الحماية الخارجية</li>
  <li><strong>وقاء نحاسي مجدول:</strong> حماية من التداخل الكهرومغناطيسي</li>
  <li><strong>عازل بلاستيكي:</strong> يفصل الموصل عن الوقاء</li>
  <li><strong>موصل نحاسي:</strong> السلك الذي تنتقل عبره البيانات</li>
</ul>
<p>موصلاته: <strong>BNC</strong>، <strong>النوع N</strong>، <strong>النوع F</strong></p>

<h2>الكابل المزدوج المجدول (Twisted Pair Cable)</h2>
<p>يتكون من أزواج من الأسلاك الملفوفة على بعضها لتقليل التشويش الكهرومغناطيسي. ينقسم إلى نوعين:</p>
<ul>
  <li><strong>STP (Shielded):</strong> محمي بطبقة من القصدير.</li>
  <li><strong>UTP (Unshielded):</strong> غير محمي، الأكثر شيوعاً في الشبكات المحلية.</li>
</ul>
<h3>تصنيفات كابل UTP</h3>
<table>
  <thead><tr><th>الفئة</th><th>السرعة</th><th>الطول الأقصى</th><th>الاستخدام</th></tr></thead>
  <tbody>
    <tr><td>CAT5</td><td>100 Mbps</td><td>100m</td><td>FastEthernet</td></tr>
    <tr><td>CAT5e</td><td>1 Gbps</td><td>100m</td><td>Gigabit Ethernet</td></tr>
    <tr><td>CAT6</td><td>10 Gbps</td><td>55m</td><td>10G Ethernet</td></tr>
    <tr><td>CAT6a</td><td>10 Gbps</td><td>100m</td><td>10G Ethernet</td></tr>
    <tr><td>CAT7</td><td>10 Gbps</td><td>100m</td><td>GigabitEthernet</td></tr>
  </tbody>
</table>
<h3>أنواع التوصيل</h3>
<ul>
  <li><strong>Straight-through:</strong> توصيل أجهزة مختلفة (كمبيوتر ↔ سويتش)</li>
  <li><strong>Crossover:</strong> توصيل أجهزة متشابهة (سويتش ↔ سويتش)</li>
</ul>
<p>نظامَا ترتيب الأسلاك: <strong>T568A</strong> و <strong>T568B</strong> — تستخدم مشبك <strong>RJ-45</strong></p>

<h2>الكابل الضوئي (Fiber Optic Cable)</h2>
<p>يستخدم الضوء بدلاً من الإشارات الكهربائية. نوعان:</p>
<ul>
  <li><strong>SMF (Single Mode Fiber):</strong> ليزر، مدى مئات الكيلومترات.</li>
  <li><strong>MMF (Multi Mode Fiber):</strong> LED، مدى حتى 550 متراً.</li>
</ul>

<h2>أدوات تصنيع الكيابل</h2>
<table>
  <thead><tr><th>الأداة</th><th>الاستخدام</th></tr></thead>
  <tbody>
    <tr><td>RG45 (المشبك)</td><td>يُثبَّت في نهاية الكابل للتوصيل</td></tr>
    <tr><td>Crimping Tool</td><td>لتثبيت قطعة RG45 على الكابل</td></tr>
    <tr><td>Cable Tester</td><td>للتحقق من سلامة التوصيلات</td></tr>
    <tr><td>Stripper</td><td>لإزالة الغلاف الخارجي بدقة</td></tr>
    <tr><td>Fiber Optic Tool</td><td>لتصنيع كابل الألياف الضوئية</td></tr>
  </tbody>
</table>

<h2>وحدات قياس البيانات</h2>
<table>
  <thead><tr><th>الوحدة</th><th>القيمة</th></tr></thead>
  <tbody>
    <tr><td>bit</td><td>1 or 0</td></tr>
    <tr><td>Byte</td><td>8 bits</td></tr>
    <tr><td>Kilobyte</td><td>1024 Bytes</td></tr>
    <tr><td>Megabyte</td><td>1024 KB</td></tr>
    <tr><td>Gigabyte</td><td>1024 MB</td></tr>
    <tr><td>Terabyte</td><td>1024 GB</td></tr>
  </tbody>
</table>
`.trim(),
  },

  /* ══════════════════════════════════════
     5. بروتوكول IP
  ══════════════════════════════════════ */
  {
    pageId:  "ip",
    title:   "بروتوكول IP — Internet Protocol Address",
    excerpt: "تعريف بروتوكول IP وإصداراته وتدريبات عملية على IPv4 وIPv6",
    content: /* html */`
<h1>بروتوكول IP</h1>
<h2>تعريف بروتوكول IP</h2>
<p>عنوان بروتوكول الإنترنت (IP address) هو المعرف الرقمي لأي جهاز (حاسوب، هاتف، طابعة، موجّه) مرتبط بشبكة معلوماتية. يعمل ببروتوكولات الإنترنت سواء أكانت شبكة محلية أو الإنترنت. يقابل عنوان IP رقمَ الهاتف في شبكات الهاتف.</p>

<h2>إصدارات بروتوكول IP</h2>
<ol>
  <li><strong>IPv4:</strong> الإصدار الرابع — يدعم 4.2 مليار عنوان.</li>
  <li><strong>IPv6:</strong> الإصدار السادس — يدعم 340 undecillion عنوان.</li>
</ol>

<h2>بروتوكول IPv4</h2>
<p>هو الإصدار الرابع من بروتوكول الانترنت:</p>
<ul>
  <li>طول العنوان: <strong>32 بت</strong></li>
  <li>مقسم إلى 4 خانات (Octets) كل خانة 8 بت</li>
  <li>مدى الأرقام لكل خانة: من 0 إلى 255</li>
  <li>مثال: <code>192.168.10.2</code> ← ثنائي: <code>11000000.10101000.00001010.00000010</code></li>
</ul>
<h3>نظام الترقيم</h3>
<ul>
  <li><strong>عشري (Decimal):</strong> الأرقام من 0 إلى 9</li>
  <li><strong>ثنائي (Binary):</strong> القيمتان 0 و 1 فقط</li>
  <li><strong>سادس عشري (Hexadecimal):</strong> 0-9 + A-F (16 رمزاً)</li>
</ul>
<h3>فئات العناوين (Classful Networking)</h3>
<table>
  <thead><tr><th>الفئة</th><th>المدى</th><th>قناع الشبكة</th></tr></thead>
  <tbody>
    <tr><td><strong>A</strong></td><td>1.0.0.0 – 126.255.255.255</td><td>255.0.0.0</td></tr>
    <tr><td><strong>B</strong></td><td>128.0.0.0 – 191.255.255.255</td><td>255.255.0.0</td></tr>
    <tr><td><strong>C</strong></td><td>192.0.0.0 – 223.255.255.255</td><td>255.255.255.0</td></tr>
  </tbody>
</table>

<h2>تدريبات على IPv4</h2>
<table>
  <thead><tr><th>عنوان الشبكة</th><th>الفئة</th><th>قناع الشبكة</th><th>أول مضيف</th><th>آخر مضيف</th><th>البث</th></tr></thead>
  <tbody>
    <tr><td>13.0.0.0/8</td><td>A</td><td>255.0.0.0</td><td>13.0.0.1</td><td>13.255.255.254</td><td>13.255.255.255</td></tr>
    <tr><td>192.168.8.0/24</td><td>C</td><td>255.255.255.0</td><td>192.168.8.1</td><td>192.168.8.254</td><td>192.168.8.255</td></tr>
    <tr><td>120.0.0.0/8</td><td>A</td><td>255.0.0.0</td><td>120.0.0.1</td><td>120.255.255.254</td><td>120.255.255.255</td></tr>
    <tr><td>130.168.0.0/16</td><td>B</td><td>255.255.0.0</td><td>130.168.0.1</td><td>130.168.255.254</td><td>130.168.255.255</td></tr>
  </tbody>
</table>

<h2>بروتوكول IPv6</h2>
<p>جاء IPv6 لحل مشكلة نفاد عناوين IPv4:</p>
<ul>
  <li>طول العنوان: <strong>128 بت</strong></li>
  <li>يُمثَّل بالنظام السادس عشري — 8 مجموعات مفصولة بنقطتين</li>
  <li>مثال: <code>2001:0db8:85a3::8a2e:0370:7334</code></li>
  <li>لا حاجة لـ NAT — أمان مدمج (IPSec) — تكوين تلقائي</li>
</ul>
<h3>تدريبات على IPv6 — الاختصار</h3>
<table>
  <thead><tr><th>العنوان الكامل</th><th>الاختصار</th></tr></thead>
  <tbody>
    <tr><td>2001:0db8:0000:0000:0000:0000:0000:0001</td><td>2001:db8::1</td></tr>
    <tr><td>0000:0000:0000:0000:0000:0000:0000:0001</td><td>::1 (Loopback)</td></tr>
    <tr><td>fe80:0000:0000:0000:0202:b3ff:fe1e:8329</td><td>fe80::202:b3ff:fe1e:8329</td></tr>
  </tbody>
</table>
`.trim(),
  },
];

/* ═══════════════════════════════════════════════════════
   دالة الترحيل الرئيسية
═══════════════════════════════════════════════════════ */
async function migrate(adminUid) {
  const log = (msg, type = "info") => {
    const el  = document.getElementById("log");
    const row = document.createElement("div");
    row.className = `log-${type}`;
    row.textContent = `${new Date().toLocaleTimeString("ar")} — ${msg}`;
    el.appendChild(row);
    el.scrollTop = el.scrollHeight;
    console.log(msg);
  };

  log("بدء الترحيل…");
  let created = 0, skipped = 0;

  for (const page of SITE_PAGES) {
    /* ── تحقق: هل موجود مسبقاً؟ ── */
    const existing = await getDocs(
      query(collection(db, "articles"), where("pageId", "==", page.pageId))
    );

    if (!existing.empty) {
      log(`⏭ تخطي "${page.title}" — موجود مسبقاً`, "warn");
      skipped++;
      continue;
    }

    /* ── إنشاء المستند ── */
    await addDoc(collection(db, "articles"), {
      title:     page.title,
      pageId:    page.pageId,
      content:   page.content,
      excerpt:   page.excerpt,
      isSeedPage: true,           /* علامة تميز صفحات الترحيل */
      createdAt:  serverTimestamp(),
      createdBy:  adminUid,
    });

    log(`✅ أُنشئ: "${page.title}"`, "success");
    created++;
  }

  log(`─────────────────────────────`, "sep");
  log(`اكتمل الترحيل: ${created} أُنشئ، ${skipped} مُتجاوَز`, "done");
  document.getElementById("statusBadge").textContent = "✅ اكتمل";
  document.getElementById("statusBadge").style.background = "rgba(0,201,177,0.2)";
}

/* ── تشغيل بعد التحقق من تسجيل دخول المشرف ── */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    document.getElementById("statusBadge").textContent = "❌ يجب تسجيل الدخول أولاً";
    return;
  }
  await migrate(user.uid);
});
