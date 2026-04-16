import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
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

const TRAINEE_DOMAIN = "@trainee.network.com";
const TRAINEE_DEFAULT_PASS = "12345678";

/* ════════════════════════════════════════════════════════
   1. حارس الصفحة والتهيئة (Auth & UI Init)
════════════════════════════════════════════════════════ */
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.replace("login.html"); return; }
  
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const profile = snap.exists() ? snap.data() : null;
    
    if (!profile || profile.role !== "admin") {
      await signOut(auth);
      window.location.replace("login.html?reason=unauthorized");
      return;
    }

    // تحديث واجهة المشرف
    const name = profile.displayName || user.email;
    document.getElementById("welcomeName").textContent = name;
    document.getElementById("sbUserName").textContent = name;
    document.getElementById("sbAvatarInitial").textContent = (name ? name[0] : "م").toUpperCase();
    
    // إخفاء شاشة التحميل
    document.getElementById("loadingOverlay").classList.add("hidden");
    setTimeout(() => {
      document.getElementById("loadingOverlay").style.display = "none";
      document.getElementById("dashboardShell").classList.add("visible");
      document.getElementById("sidebar").classList.remove("hidden");
    }, 420);

    loadStats();
  } catch (err) {
    console.error("Auth Guard Error:", err);
  }
});

async function loadStats() {
  const statMap = { users: "statTrainees", quizzes: "statQuizzes", results: "statResults" };
  for (const [col, id] of Object.entries(statMap)) {
    try {
      const snap = await getCountFromServer(collection(db, col));
      const el = document.getElementById(id);
      if (el) el.textContent = snap.data().count;
    } catch (e) { console.error(e); }
  }
}

/* ════════════════════════════════════════════════════════
   2. وظائف النظام العامة (Logout, Sidebar, Nav)
════════════════════════════════════════════════════════ */
window.handleLogout = () => confirm("هل تريد تسجيل الخروج؟") && signOut(auth).then(() => location.replace("login.html"));

window.toggleSidebar = () => {
  document.getElementById("sidebar").classList.toggle("hidden");
  document.getElementById("sidebarOverlay").classList.toggle("visible");
};

window.closeSidebar = () => {
  document.getElementById("sidebar").classList.add("hidden");
  document.getElementById("sidebarOverlay").classList.remove("visible");
};

window.switchPanel = (btn, panelId) => {
  document.querySelectorAll(".sb-item").forEach(el => el.classList.remove("active"));
  if (btn) btn.classList.add("active");
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  const target = document.getElementById(`panel-${panelId}`);
  if (target) target.classList.add("active");
  
  const crumb = document.getElementById("topbarCrumb");
  const labels = { home: "الرئيسية", articles: "إدارة المقالات", quizzes: "إدارة الاختبارات", trainees: "المتدربون", settings: "الإعدادات" };
  if (crumb) crumb.textContent = labels[panelId] || panelId;

  if (panelId === "trainees") { loadTrainees(); loadLatestResults(); }
  if (panelId === "quizzes") loadQuizzes();
  if (panelId === "articles") { loadArticles(); _initTinyMCE(); }
  if (window.innerWidth <= 860) window.closeSidebar();
};

window.switchPanelById = (id) => window.switchPanel(document.querySelector(`[data-panel="${id}"]`), id);

/* ════════════════════════════════════════════════════════
   3. إدارة المتدربين (Add, Bulk, Delete, Edit)
════════════════════════════════════════════════════════ */
async function _createTraineeAccount(name, studentId) {
  const email = studentId + TRAINEE_DOMAIN;
  const tempApp = initializeApp(firebaseConfig, "Secondary-" + Date.now());
  const tempAuth = getAuth(tempApp);
  const cred = await createUserWithEmailAndPassword(tempAuth, email, TRAINEE_DEFAULT_PASS);
  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid, email, studentId, displayName: name,
    role: "trainee", createdAt: serverTimestamp()
  });
  await signOut(tempAuth);
  await deleteApp(tempApp);
}

window.addTrainee = async function () {
  const nameEl = document.getElementById("newTraineeName"), idEl = document.getElementById("newTraineeEmail"), msgEl = document.getElementById("addTraineeMsg");
  const name = nameEl.value.trim(), studentId = idEl.value.trim();
  if (!name || !/^\d{10}$/.test(studentId)) return _showMsg(msgEl, "بيانات غير صحيحة (الرقم 10 خانات)", "error");
  try {
    await _createTraineeAccount(name, studentId);
    _showMsg(msgEl, "✅ تم إنشاء الحساب", "success");
    nameEl.value = ""; idEl.value = "";
    loadTrainees(); loadStats();
  } catch (e) { _showMsg(msgEl, "❌ خطأ: " + e.message, "error"); }
};

window.handleBulkImport = async function (inputEl) {
  const file = inputEl.files?.[0];
  if (!file || typeof XLSX === "undefined") return;
  const data = await file.arrayBuffer(), workbook = XLSX.read(data, { type: "array" }), rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  const colKeys = Object.keys(rows[0] || {}), nK = colKeys.find(k => k.trim().includes("الاسم")) || colKeys[0], iK = colKeys.find(k => k.trim().includes("رقم")) || colKeys[1];
  const valid = rows.filter(r => r[nK] && /^\d{10}$/.test(String(r[iK]).trim()));
  if (!valid.length) return alert("لا توجد بيانات صحيحة");
  if (confirm(`رفع ${valid.length} حساب؟`)) {
    const log = document.getElementById("bulkProgressLog"); document.getElementById("bulkProgressWrap").style.display = "block";
    log.innerHTML = "";
    for (const r of valid) {
      const name = String(r[nK]).trim(), sid = String(r[iK]).trim();
      try {
        await _createTraineeAccount(name, sid);
        log.innerHTML += `<div style="color:#a5d6a7">✅ تم: ${name}</div>`;
      } catch (e) { log.innerHTML += `<div style="color:#ff6b6b">❌ ${e.code === 'auth/email-already-in-use' ? 'مسجل مسبقاً' : 'فشل'}: ${name}</div>`; }
      log.scrollTop = log.scrollHeight;
    }
    loadTrainees(); loadStats();
  }
  inputEl.value = "";
};

window.loadTrainees = async function () {
  const loadingEl = document.getElementById("traineesLoading"), wrap = document.getElementById("traineesTableWrap"), tbody = document.getElementById("traineesTableBody");
  if (!tbody) return;
  try {
    const snap = await getDocs(query(collection(db, "users"), where("role", "==", "trainee"), orderBy("createdAt", "desc")));
