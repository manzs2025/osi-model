/**
 * shared-nav.js — شريط التنقل المشترك + تحميل الصفحات الديناميكية
 * يُحمَّل في نهاية كل صفحة HTML بـ: <script src="shared-nav.js"></script>
 */

import { initializeApp, getApps }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, orderBy, query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCz9Wedr_X3VzoaH0gJj8QFrNIK5vT4vww",
  authDomain:        "networkacademy-795c8.firebaseapp.com",
  projectId:         "networkacademy-795c8",
  storageBucket:     "networkacademy-795c8.firebasestorage.app",
  messagingSenderId: "458132238000",
  appId:             "1:458132238000:web:bffd7321407b094bb21575",
};
const _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const _db  = getFirestore(_app);

/* ── الصفحات الأصلية الثابتة ── */
const STATIC_PAGES = [
  { id:"networks", name:"شبكات الحاسب", icon:"📡", num:"01", file:"networks.html" },
  { id:"security", name:"الأمان",        icon:"🔒", num:"02", file:"security.html" },
  { id:"osi",      name:"نموذج OSI",    icon:"🔁", num:"03", file:"osi.html"      },
  { id:"cables",   name:"الكيابل",       icon:"🔌", num:"04", file:"cables.html"   },
  { id:"ip",       name:"بروتوكول IP",  icon:"🌍", num:"05", file:"ip.html"       },
];

/* ── تحديد الصفحة الحالية ── */
const _currentFile = location.pathname.split("/").pop() || "index.html";
const _urlParams   = new URLSearchParams(location.search);
const _currentId   = _urlParams.get("id") || _currentFile.replace(".html","");

/* ── بناء الـ nav ── */
async function buildNav() {
  const navEl = document.getElementById("shared-nav-links") ||
                document.querySelector(".sub-nav-links") ||
                null;

  /* جلب الصفحات الديناميكية من Firestore */
  let dynamicPages = [];
  try {
    const snap = await getDocs(query(collection(_db, "sitePages"), orderBy("order")));
    snap.forEach(d => {
      const data = d.data();
      dynamicPages.push({ id: d.id, name: data.name, icon: data.icon || "📄", file: `page.html?id=${d.id}` });
    });
  } catch(e) { /* تجاهل خطأ التحميل */ }

  /* دمج الصفحات */
  const allPages = [
    ...STATIC_PAGES,
    ...dynamicPages.filter(d => !STATIC_PAGES.find(s => s.id === d.id))
  ];

  /* إضافة الصفحات الديناميكية لكل nav موجود في الصفحة */
  _injectDynamicLinks(allPages, dynamicPages);
}

function _injectDynamicLinks(allPages, dynamicPages) {
  if (dynamicPages.length === 0) return;

  /* ابحث عن شريط التنقل الرئيسي بعدة طرق */
  const navContainers = [
    document.querySelector("header nav"),
    document.querySelector(".sub-nav"),
    document.querySelector("nav.sub-nav"),
  ].filter(Boolean);

  dynamicPages.forEach(page => {
    const isActive = _currentId === page.id;
    const href = `page.html?id=${page.id}`;

    navContainers.forEach(nav => {
      /* تجنب التكرار */
      if (nav.querySelector(`[href="${href}"]`)) return;

      const link = document.createElement("a");
      link.href = href;
      link.textContent = `${page.icon} ${page.name}`;
      if (isActive) link.classList.add("active");
      nav.appendChild(link);
    });
  });
}

/* ── حماية خفيفة للصفحات التعليمية ── */
function enablePageProtection() {
  /* منع النسخ */
  document.addEventListener("copy",  e => e.preventDefault());
  document.addEventListener("cut",   e => e.preventDefault());

  /* منع القائمة السياقية */
  document.addEventListener("contextmenu", e => {
    if (!(e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) {
      e.preventDefault();
    }
  });

  /* منع اختصارات المطوّر */
  document.addEventListener("keydown", e => {
    const k = (e.key || "").toLowerCase();
    if (k === "f12") { e.preventDefault(); return; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i","j","c"].includes(k)) { e.preventDefault(); return; }
    if ((e.ctrlKey || e.metaKey) && k === "u") { e.preventDefault(); return; }
  });

  /* منع تحديد النص */
  const style = document.createElement("style");
  style.textContent = `
    body { -webkit-user-select:none; user-select:none; }
    input, textarea, [contenteditable] { -webkit-user-select:text; user-select:text; }
  `;
  document.head.appendChild(style);
}

/* ── تنفيذ ── */
buildNav();
enablePageProtection();
