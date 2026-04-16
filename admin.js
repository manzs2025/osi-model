/**
 * admin.js — منطق لوحة التحكم المحدث
 * يتضمن: إدارة المقالات، الاختبارات، المتدربين (الرفع الفردي والجماعي)، وتعديل البيانات.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, doc, getDoc, collection, getCountFromServer, 
  addDoc, getDocs, deleteDoc, updateDoc, setDoc,
  query, orderBy, where, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ─── إعدادات Firebase ────────────────────────────────── */
const firebaseConfig = {
  apiKey:            "AIzaSyCz9Wedr_X3VzoaH0gJj8QFrNIK5vT4vww",
  authDomain:        "networkacademy-795c8.firebaseapp.com",
  projectId:         "networkacademy-795c8",
  storageBucket:     "networkacademy-795c8.firebasestorage.app",
  messagingSenderId: "458132238000",
  appId:             "1:458132238000:web:bffd7321407b094bb21575"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ─── الثوابت الأساسية ────────────────────────────────── */
const TRAINEE_DOMAIN = "@trainee.network.com";
const TRAINEE_DEFAULT_PASS = "12345678";

/* ─── عناصر DOM ───────────────────────────────────────── */
const loadingOverlay  = document.getElementById("loadingOverlay");
const dashboardShell  = document.getElementById("dashboardShell");
const sidebar         = document.getElementById("sidebar");
const welcomeName     = document.getElementById("welcomeName");
const sbUserName      = document.getElementById("sbUserName");
const sbAvatarInitial = document.getElementById("sbAvatarInitial");

/* ════════════════════════════════════════════════════════
   1. حارس الصفحة (Route Guard)
════════════════════════════════════════════════════════ */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    redirectToLogin("لم يتم التعرف على جلستك");
    return;
  }

  const profile = await fetchProfile(user.uid);
  if (!profile || profile.role !== "admin") {
    await signOut(auth);
    redirectToLogin("ليس لديك صلاحية الدخول");
    return;
  }

  initDashboard(user, profile);
});

async function fetchProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("fetchProfile error:", err);
    return null;
  }
}

function redirectToLogin(reason) {
  const url = reason ? `login.html?reason=${encodeURIComponent(reason)}` : "login.html";
  window.location.replace(url);
}

function initDashboard(user, profile) {
  const name  = profile.displayName || user.email;
  welcomeName.textContent = name;
  sbUserName.textContent = name;
  sbAvatarInitial.textContent = (name[0] || "م").toUpperCase();

  loadingOverlay.classList.add("hidden");
  setTimeout(() => {
    loadingOverlay.style.display = "none";
    dashboardShell.classList.add("visible");
    sidebar.classList.remove("hidden");
  }, 420);

  loadStats();
}

/* ════════════════════════════════════════════════════════
   2. إحصاءات Firestore
════════════════════════════════════════════════════════ */
async function loadStats() {
  const collections = ["users", "quizzes", "results"];
  for (const col of collections) {
    try {
      const snap = await getCountFromServer(collection(db, col));
      const el = document.getElementById(`stat${col.charAt(0).toUpperCase() + col.slice(1)}`);
      if (el) el.textContent = snap.data().count;
    } catch (err) {
      console.error(`Error counting ${col}:`, err);
    }
  }
}

/* ════════════════════════════════════════════════════════
   3. إدارة المتدربين (إضافة، رفع جماعي، تعديل)
════════════════════════════════════════════════════════ */

// إضافة متدرب فردي
window.addTrainee = async function () {
  const nameEl = document.getElementById("newTraineeName");
  const idEl   = document.getElementById("newTraineeEmail"); // حقل الرقم التدريبي
  const msgEl  = document.getElementById("addTraineeMsg");
  
  const name = nameEl.value.trim();
  const studentId = idEl.value.trim();

  if (!name || !/^\d{10}$/.test(studentId)) {
    _showMsg(msgEl, "يرجى إدخال اسم ورقم تدريبي صحيح (10 أرقام)", "error");
    return;
  }

  try {
    await _createTraineeAccount(name, studentId);
    _showMsg(msgEl, "✅ تم إنشاء الحساب بنجاح", "success");
    nameEl.value = ""; idEl.value = "";
    loadTrainees(); loadStats();
  } catch (err) {
    _showMsg(msgEl, "❌ خطأ: " + err.message, "error");
  }
};

// دالة إنشاء الحساب (تستخدم للفردي والجماعي)
async function _createTraineeAccount(name, studentId) {
  const email = studentId + TRAINEE_DOMAIN;
  
  // إنشاء تطبيق ثانوي لعدم تسجيل خروج المشرف
  const tempApp = initializeApp(firebaseConfig, "Secondary-" + Date.now());
  const tempAuth = getAuth(tempApp);
  const { createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");

  const cred = await createUserWithEmailAndPassword(tempAuth, email, TRAINEE_DEFAULT_PASS);
  const uid = cred.user.uid;

  await setDoc(doc(db, "users", uid), {
    uid, email, studentId, displayName: name,
    role: "trainee", createdAt: serverTimestamp()
  });

  await signOut(tempAuth);
  await tempApp.delete();
  return uid;
}

// الرفع الجماعي من إكسيل
window.handleBulkImport = async function (inputEl) {
  const file = inputEl.files?.[0];
  if (!file) return;
  inputEl.value = "";

  if (typeof XLSX === "undefined") {
    alert("مكتبة SheetJS غير محمّلة");
    return;
  }

  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  
  const colKeys = Object.keys(rows[0] || {});
  const nameKey = colKeys.find(k => k.trim().includes("الاسم") || k.includes("اسم")) || colKeys[0];
  const idKey = colKeys.find(k => k.trim().includes("الرقم التدريبي") || k.includes("id")) || colKeys[1];

  const validRows = rows.filter(r => r[nameKey] && /^\d{10}$/.test(String(
