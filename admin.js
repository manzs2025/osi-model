/**
 * admin.js — منطق لوحة التحكم
 * يُستورد كـ ES Module من admin.html
 *
 * المسؤوليات:
 * 1. حماية الصفحة (Route Guard) — فقط admin يدخل
 * 2. عرض بيانات المشرف في الواجهة
 * 3. جلب إحصاءات سريعة من Firestore
 * 4. تسجيل الخروج
 * 5. منطق التنقل بين الألواح (Panels)
 */

import { initializeApp }                      from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc,
         collection, getCountFromServer,
         addDoc, getDocs, deleteDoc,
         query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

/* ─── عناصر DOM ───────────────────────────────────────── */
const loadingOverlay  = document.getElementById("loadingOverlay");
const dashboardShell  = document.getElementById("dashboardShell");
const sidebar         = document.getElementById("sidebar");
const sidebarOverlay  = document.getElementById("sidebarOverlay");
const welcomeName     = document.getElementById("welcomeName");
const sbUserName      = document.getElementById("sbUserName");
const sbAvatarInitial = document.getElementById("sbAvatarInitial");
const settingsName    = document.getElementById("settingsName");
const settingsEmail   = document.getElementById("settingsEmail");

/* ════════════════════════════════════════════════════════
   1. حارس الصفحة (Route Guard)
   يُنفَّذ فور تحميل الصفحة — قبل أن يرى المستخدم أي شيء
════════════════════════════════════════════════════════ */
onAuthStateChanged(auth, async (user) => {

  /* ── لا يوجد مستخدم مسجّل → طرده لصفحة الدخول ── */
  if (!user) {
    redirectToLogin("لم يتم التعرف على جلستك");
    return;
  }

  /* ── جلب الملف الشخصي للتحقق من الدور ── */
  const profile = await fetchProfile(user.uid);

  if (!profile) {
    redirectToLogin("حسابك غير مكتمل");
    return;
  }

  if (profile.role !== "admin") {
    // مستخدم عادي حاول الوصول → طرده
    await signOut(auth);
    redirectToLogin("ليس لديك صلاحية الدخول إلى لوحة التحكم");
    return;
  }

  /* ── المشرف الصحيح: إخفاء اللوديج وإظهار اللوحة ── */
  initDashboard(user, profile);
});

/* ─── جلب بيانات المستخدم من Firestore ────────────────── */
async function fetchProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("fetchProfile error:", err);
    return null;
  }
}

/* ─── إعادة التوجيه لصفحة الدخول ─────────────────────── */
function redirectToLogin(reason) {
  // نمرر سبب الطرد كمعامل URL ليظهر للمستخدم
  const url = reason
    ? `login.html?reason=${encodeURIComponent(reason)}`
    : "login.html";
  window.location.replace(url);
}

/* ════════════════════════════════════════════════════════
   2. تهيئة لوحة التحكم بعد نجاح الحراسة
════════════════════════════════════════════════════════ */
function initDashboard(user, profile) {
  const name  = profile.displayName || user.email;
  const initial = (name[0] || "م").toUpperCase();

  /* ── تحديث واجهة المشرف ── */
  welcomeName.textContent     = name;
  sbUserName.textContent      = name;
  sbAvatarInitial.textContent = initial;

  if (settingsName)  settingsName.textContent  = name;
  if (settingsEmail) settingsEmail.textContent = user.email;

  /* ── إخفاء لودينج وإظهار اللوحة ── */
  loadingOverlay.classList.add("hidden");
  setTimeout(() => {
    loadingOverlay.style.display = "none";
    dashboardShell.classList.add("visible");
    sidebar.classList.remove("hidden"); // إظهار sidebar بعد التحقق
  }, 420);

  /* ── جلب الإحصاءات ── */
  loadStats();
}

/* ════════════════════════════════════════════════════════
   3. إحصاءات سريعة من Firestore
════════════════════════════════════════════════════════ */
async function loadStats() {
  // نجلب العدد لكل collection بشكل متوازٍ
  const [traineesCount, quizzesCount, resultsCount] = await Promise.allSettled([
    countCollection("users"),
    countCollection("quizzes"),
    countCollection("results")
  ]);

  updateStat("statTrainees", traineesCount);
  updateStat("statQuizzes",  quizzesCount);
  updateStat("statResults",  resultsCount);
}

async function countCollection(colName) {
  const snap = await getCountFromServer(collection(db, colName));
  return snap.data().count;
}

function updateStat(elementId, settledResult) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (settledResult.status === "fulfilled") {
    el.textContent = settledResult.value;
  } else {
    el.textContent = "—";
  }
}

/* ════════════════════════════════════════════════════════
   4. تسجيل الخروج
════════════════════════════════════════════════════════ */
window.handleLogout = async function () {
  const confirmed = confirm("هل تريد تسجيل الخروج؟");
  if (!confirmed) return;

  try {
    await signOut(auth);
    window.location.replace("login.html");
  } catch (err) {
    alert("حدث خطأ أثناء تسجيل الخروج، حاول مجدداً");
    console.error("signOut error:", err);
  }
};

/* ════════════════════════════════════════════════════════
   5. منطق التنقل بين الألواح (Panel Navigation)
════════════════════════════════════════════════════════ */
const panelLabels = {
  home:      "الرئيسية",
  articles:  "إدارة المقالات",
  quizzes:   "إدارة الاختبارات",
  trainees:  "المتدربون",
  settings:  "الإعدادات",
};

window.switchPanel = function (btn, panelId) {
  /* ── تحديث الزر النشط في Sidebar ── */
  document.querySelectorAll(".sb-item").forEach(el => el.classList.remove("active"));
  if (btn) btn.classList.add("active");

  /* ── تحديث Breadcrumb ── */
  const crumb = document.getElementById("topbarCrumb");
  if (crumb) crumb.textContent = panelLabels[panelId] ?? panelId;

  /* ── إظهار اللوح المطلوب ── */
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  const target = document.getElementById(`panel-${panelId}`);
  if (target) target.classList.add("active");

  /* ── على الجوال: إغلاق السايدبار تلقائياً ── */
  if (window.innerWidth <= 860) closeSidebar();
};

/* برمجياً (من quick-actions) */
window.switchPanelById = function (panelId) {
  const btn = document.querySelector(`[data-panel="${panelId}"]`);
  switchPanel(btn, panelId);
};

/* ════════════════════════════════════════════════════════
   6. منطق السايدبار على الجوال
════════════════════════════════════════════════════════ */
window.toggleSidebar = function () {
  const isHidden = sidebar.classList.contains("hidden");
  if (isHidden) {
    sidebar.classList.remove("hidden");
    sidebarOverlay.classList.add("visible");
  } else {
    closeSidebar();
  }
};

window.closeSidebar = function () {
  sidebar.classList.add("hidden");
  sidebarOverlay.classList.remove("visible");
};

/* ─── على الشاشات الكبيرة: السايدبار دائماً مرئي ───────── */
function handleResize() {
  if (window.innerWidth > 860) {
    sidebar.classList.remove("hidden");
    sidebarOverlay.classList.remove("visible");
  }
}

window.addEventListener("resize", handleResize);
// تهيئة عند التحميل بناءً على حجم الشاشة
handleResize();

/* ════════════════════════════════════════════════════════
   6. إدارة الاختبارات (Quiz CRUD)
   ─────────────────────────────────────────────────────
   المسؤوليات:
   - addQuestion()   : إضافة بطاقة سؤال ديناميكية
   - removeQuestion(): حذف بطاقة سؤال
   - saveQuiz()      : حفظ الاختبار في Firestore
   - loadQuizzes()   : جلب وعرض الاختبارات في الجدول
   - deleteQuiz()    : حذف اختبار من Firestore
   - resetQuizForm() : إعادة تعيين النموذج
   - toggleQuizForm(): طي/فرد النموذج
════════════════════════════════════════════════════════ */

/* ─── ثوابت أسماء الأقسام ─────────────────────────────── */
const PAGE_LABELS = {
  networks: "شبكات الحاسب الآلي",
  security: "الأمان في الشبكات",
  osi:      "نموذج OSI",
  cables:   "كيابل الشبكات",
  ip:       "بروتوكول IP",
};

/* ─── عداد الأسئلة ────────────────────────────────────── */
let questionCounter = 0;

/* ════════════
   addQuestion — يُضيف بطاقة سؤال جديدة للنموذج
════════════ */
window.addQuestion = function () {
  questionCounter++;
  const qNum  = questionCounter;
  const qId   = `q_${qNum}_${Date.now()}`;

  /* إخفاء رسالة "لا توجد أسئلة" */
  const emptyMsg = document.getElementById("emptyQuestionsMsg");
  if (emptyMsg) emptyMsg.style.display = "none";

  const card = document.createElement("div");
  card.className  = "qz-question-card";
  card.dataset.qid = qId;
  card.innerHTML  = `
    <div class="qz-question-header">
      <span class="qz-question-num">السؤال ${qNum}</span>
      <button class="qz-question-del" onclick="removeQuestion('${qId}')" title="حذف السؤال">✕</button>
    </div>
    <div class="qz-question-body">

      <!-- نص السؤال -->
      <textarea
        class="qz-question-text"
        data-field="text"
        placeholder="اكتب نص السؤال هنا…"
        rows="2"
      ></textarea>

      <!-- الخيارات الأربعة -->
      <div class="qz-options-grid">
        ${[1, 2, 3, 4].map(i => `
          <div class="qz-option-wrap">
            <input
              type="radio"
              class="qz-radio"
              name="correct_${qId}"
              value="${i}"
              title="الإجابة الصحيحة"
            >
            <input
              type="text"
              class="qz-option-input"
              data-option="${i}"
              placeholder="الخيار ${i}"
            >
          </div>
        `).join("")}
      </div>

      <!-- تلميح الإجابة الصحيحة -->
      <div class="qz-correct-hint">
        <span class="dot"></span>
        اختر الدائرة المجاورة للإجابة الصحيحة
      </div>

    </div>
  `;

  document.getElementById("questionsList").appendChild(card);
  _updateQuestionsCount();

  /* تمرير ناعم للسؤال الجديد */
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
};

/* ════════════
   removeQuestion — يحذف بطاقة سؤال بـ id محدد
════════════ */
window.removeQuestion = function (qId) {
  const card = document.querySelector(`[data-qid="${qId}"]`);
  if (!card) return;

  card.style.opacity  = "0";
  card.style.transform = "translateY(-8px)";
  card.style.transition = "all 0.2s ease";

  setTimeout(() => {
    card.remove();
    _updateQuestionsCount();

    /* إظهار رسالة "لا توجد أسئلة" إذا أصبحت القائمة فارغة */
    const remaining = document.querySelectorAll(".qz-question-card");
    if (remaining.length === 0) {
      const emptyMsg = document.getElementById("emptyQuestionsMsg");
      if (emptyMsg) emptyMsg.style.display = "";
    }
  }, 200);
};

/* ─── مساعد: تحديث عداد الأسئلة ──────────────────────── */
function _updateQuestionsCount() {
  const count   = document.querySelectorAll(".qz-question-card").length;
  const counter = document.getElementById("questionsCount");
  if (counter) counter.textContent = `${count} ${count === 1 ? "سؤال" : "أسئلة"}`;
}

/* ════════════
   saveQuiz — يجمع البيانات ويحفظ في Firestore
════════════ */
window.saveQuiz = async function () {
  const titleEl = document.getElementById("quizTitle");
  const pageEl  = document.getElementById("quizPage");
  const msgEl   = document.getElementById("quizFormMsg");
  const btn     = document.getElementById("btnSaveQuiz");

  /* ── 1. التحقق من الحقول الأساسية ── */
  const title  = titleEl.value.trim();
  const pageId = pageEl.value;

  if (!title) {
    titleEl.classList.add("error");
    titleEl.focus();
    _showFormMsg(msgEl, "يرجى إدخال عنوان الاختبار", "error");
    return;
  }
  titleEl.classList.remove("error");

  if (!pageId) {
    pageEl.classList.add("error");
    _showFormMsg(msgEl, "يرجى اختيار القسم التابع له", "error");
    return;
  }
  pageEl.classList.remove("error");

  /* ── 2. جمع الأسئلة ── */
  const questionCards = document.querySelectorAll(".qz-question-card");

  if (questionCards.length === 0) {
    _showFormMsg(msgEl, "يرجى إضافة سؤال واحد على الأقل", "error");
    return;
  }

  const questions = [];
  let hasError    = false;

  questionCards.forEach((card, idx) => {
    const textEl   = card.querySelector("[data-field='text']");
    const text     = textEl?.value.trim() ?? "";
    const options  = [];

    /* جمع الخيارات الأربعة */
    card.querySelectorAll(".qz-option-input").forEach(inp => {
      options.push(inp.value.trim());
    });

    /* تحديد الإجابة الصحيحة */
    const selectedRadio = card.querySelector(".qz-radio:checked");
    const correctIndex  = selectedRadio ? parseInt(selectedRadio.value) - 1 : -1;

    /* التحقق */
    if (!text) {
      textEl?.classList.add("error");
      hasError = true;
      return;
    }
    textEl?.classList.remove("error");

    if (options.some(o => o === "")) {
      _showFormMsg(msgEl, `يرجى ملء جميع خيارات السؤال ${idx + 1}`, "error");
      hasError = true;
      return;
    }

    if (correctIndex < 0) {
      _showFormMsg(msgEl, `يرجى تحديد الإجابة الصحيحة للسؤال ${idx + 1}`, "error");
      hasError = true;
      return;
    }

    questions.push({
      text,
      type:          "mcq",
      options,
      correctAnswer: options[correctIndex],
      points:        10,
    });
  });

  if (hasError) return;

  /* ── 3. حفظ في Firestore ── */
  btn.disabled = true;
  btn.querySelector(".qz-btn-text").style.display = "none";
  btn.querySelector(".qz-btn-spinner").style.display = "inline";

  try {
    const docRef = await addDoc(collection(db, "quizzes"), {
      title,
      pageId,
      questions,                    /* المصفوفة الكاملة داخل Document واحد */
      questionsCount: questions.length,
      isActive:       false,
      createdAt:      serverTimestamp(),
      createdBy:      auth.currentUser?.uid ?? "",
    });

    _showFormMsg(msgEl, `✅ تم حفظ الاختبار بنجاح (${questions.length} أسئلة)`, "success");
    resetQuizForm();
    loadQuizzes();                  /* تحديث الجدول فوراً */
    updateStat("statQuizzes", { status: "refresh" });

  } catch (err) {
    console.error("saveQuiz error:", err);
    _showFormMsg(msgEl, `❌ خطأ في الحفظ: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
    btn.querySelector(".qz-btn-text").style.display = "inline";
    btn.querySelector(".qz-btn-spinner").style.display = "none";
  }
};

/* ════════════
   loadQuizzes — يجلب الاختبارات من Firestore ويعرضها في الجدول
════════════ */
window.loadQuizzes = async function () {
  const loadingEl  = document.getElementById("quizzesLoading");
  const emptyEl    = document.getElementById("quizzesEmpty");
  const tableWrap  = document.getElementById("quizzesTableWrap");
  const tbody      = document.getElementById("quizzesTableBody");

  if (!tbody) return;   /* الجدول غير محمّل (الـ panel غير نشط) */

  /* إظهار اللودينج */
  loadingEl.style.display  = "flex";
  emptyEl.style.display    = "none";
  tableWrap.style.display  = "none";

  try {
    const q    = query(collection(db, "quizzes"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    loadingEl.style.display = "none";

    if (snap.empty) {
      emptyEl.style.display = "block";
      return;
    }

    tableWrap.style.display = "block";
    tbody.innerHTML = "";

    snap.forEach(docSnap => {
      const d   = docSnap.data();
      const qId = docSnap.id;

      /* تنسيق التاريخ */
      const dateStr = d.createdAt?.toDate
        ? d.createdAt.toDate().toLocaleDateString("ar-SA", {
            year: "numeric", month: "short", day: "numeric"
          })
        : "—";

      /* اسم القسم */
      const pageLabel = PAGE_LABELS[d.pageId] ?? d.pageId ?? "—";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${_escHtml(d.title ?? "—")}</td>
        <td><span class="qz-page-badge">${pageLabel}</span></td>
        <td><span class="qz-count-badge">${d.questionsCount ?? d.questions?.length ?? 0}</span></td>
        <td><span class="qz-date">${dateStr}</span></td>
        <td>
          <button
            class="qz-del-btn"
            onclick="deleteQuiz('${qId}', this)"
          >🗑️ حذف</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("loadQuizzes error:", err);
    loadingEl.style.display = "none";
    emptyEl.style.display   = "block";
    emptyEl.textContent     = `خطأ في تحميل الاختبارات: ${err.message}`;
  }
};

/* ════════════
   deleteQuiz — يحذف اختباراً من Firestore
════════════ */
window.deleteQuiz = async function (quizId, btnEl) {
  const confirmed = confirm("هل أنت متأكد من حذف هذا الاختبار نهائياً؟");
  if (!confirmed) return;

  btnEl.disabled     = true;
  btnEl.textContent  = "⏳";

  try {
    await deleteDoc(doc(db, "quizzes", quizId));

    /* حذف الصف من الجدول مباشرة دون إعادة تحميل كامل */
    const row = btnEl.closest("tr");
    row.style.opacity    = "0";
    row.style.transition = "opacity 0.25s";
    setTimeout(() => {
      row.remove();
      /* تحقق إذا أصبح الجدول فارغاً */
      const remaining = document.querySelectorAll("#quizzesTableBody tr");
      if (remaining.length === 0) {
        document.getElementById("quizzesTableWrap").style.display = "none";
        document.getElementById("quizzesEmpty").style.display     = "block";
      }
    }, 260);

  } catch (err) {
    console.error("deleteQuiz error:", err);
    alert(`فشل الحذف: ${err.message}`);
    btnEl.disabled    = false;
    btnEl.textContent = "🗑️ حذف";
  }
};

/* ════════════
   resetQuizForm — يعيد تعيين النموذج بالكامل
════════════ */
window.resetQuizForm = function () {
  document.getElementById("quizTitle").value = "";
  document.getElementById("quizPage").value  = "";
  document.getElementById("questionsList").innerHTML = `
    <div class="qz-empty-questions" id="emptyQuestionsMsg">
      <span>لا توجد أسئلة بعد</span>
      <small>اضغط "إضافة سؤال جديد" للبدء</small>
    </div>`;
  questionCounter = 0;
  _updateQuestionsCount();

  const msgEl = document.getElementById("quizFormMsg");
  if (msgEl) msgEl.style.display = "none";

  /* إزالة كلاسات الخطأ */
  document.querySelectorAll(".qz-input.error").forEach(el => el.classList.remove("error"));
};

/* ════════════
   toggleQuizForm — طي/فرد النموذج
════════════ */
window.toggleQuizForm = function () {
  const body   = document.getElementById("quizFormBody");
  const toggle = document.getElementById("quizFormToggle");
  const isOpen = !body.classList.contains("collapsed");

  body.classList.toggle("collapsed", isOpen);
  toggle.textContent = isOpen ? "توسيع ↓" : "تصغير ↑";
};

/* ─── مساعد: عرض رسالة في النموذج ────────────────────── */
function _showFormMsg(el, text, type) {
  if (!el) return;
  el.textContent  = text;
  el.className    = `qz-form-msg ${type}`;
  el.style.display = "block";
  /* إخفاء تلقائي بعد 5 ثوانٍ للرسائل الناجحة */
  if (type === "success") setTimeout(() => { el.style.display = "none"; }, 5000);
}

/* ─── مساعد: escape HTML لمنع XSS ────────────────────── */
function _escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ─── تحميل البيانات عند فتح التبويبات ──────────────────── */
const _origSwitchPanel = window.switchPanel;
window.switchPanel = function (btn, panelId) {
  _origSwitchPanel(btn, panelId);
  if (panelId === "quizzes")   loadQuizzes();
  if (panelId === "articles")  { loadArticles(); _initQuill(); }
};

/* ════════════════════════════════════════════════════════
   7. إدارة المقالات (Articles CRUD + Quill)
════════════════════════════════════════════════════════ */

/* ─── مثيل Quill — يُنشأ مرة واحدة فقط ─────────────────── */
let _quillInstance = null;

function _initQuill() {
  if (_quillInstance) return;          /* لا تُعيد الإنشاء */
  if (typeof Quill === "undefined") {  /* CDN لم يُحمَّل بعد */
    console.warn("Quill not loaded yet");
    return;
  }

  _quillInstance = new Quill("#quillEditor", {
    theme: "snow",
    direction: "rtl",
    placeholder: "اكتب محتوى المقال هنا…",
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "code-block"],
        [{ align: [] }],
        ["link"],
        ["clean"],
      ],
    },
  });
}

/* ════════════
   saveArticle — يجمع البيانات ويحفظ في Firestore (collection: articles)
════════════ */
window.saveArticle = async function () {
  const titleEl = document.getElementById("articleTitle");
  const pageEl  = document.getElementById("articlePage");
  const msgEl   = document.getElementById("articleFormMsg");
  const btn     = document.getElementById("btnSaveArticle");

  const title  = titleEl?.value.trim() ?? "";
  const pageId = pageEl?.value ?? "";

  /* ── التحقق ── */
  if (!title) {
    titleEl?.classList.add("error");
    titleEl?.focus();
    _showArticleMsg(msgEl, "يرجى إدخال عنوان المقال", "error");
    return;
  }
  titleEl?.classList.remove("error");

  if (!pageId) {
    pageEl?.classList.add("error");
    _showArticleMsg(msgEl, "يرجى اختيار القسم التابع له", "error");
    return;
  }
  pageEl?.classList.remove("error");

  /* ── محتوى Quill ── */
  const htmlContent = _quillInstance?.root.innerHTML ?? "";
  const textContent = _quillInstance?.getText().trim() ?? "";

  if (!textContent || textContent.length < 10) {
    _showArticleMsg(msgEl, "يرجى كتابة محتوى المقال (10 أحرف على الأقل)", "error");
    return;
  }

  /* ── تحميل ── */
  if (btn) {
    btn.disabled = true;
    btn.querySelector(".art-btn-text").style.display = "none";
    btn.querySelector(".art-btn-spinner").style.display = "inline";
  }

  try {
    await addDoc(collection(db, "articles"), {
      title,
      pageId,
      content:   htmlContent,        /* HTML من Quill */
      excerpt:   textContent.slice(0, 200),
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid ?? "",
    });

    _showArticleMsg(msgEl, "✅ تم حفظ المقال بنجاح", "success");
    resetArticleForm();
    loadArticles();

  } catch (err) {
    console.error("saveArticle error:", err);
    _showArticleMsg(msgEl, `❌ خطأ في الحفظ: ${err.message}`, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.querySelector(".art-btn-text").style.display = "inline";
      btn.querySelector(".art-btn-spinner").style.display = "none";
    }
  }
};

/* ════════════
   loadArticles — يجلب المقالات ويعرضها في الجدول
════════════ */
window.loadArticles = async function () {
  const loadingEl = document.getElementById("articlesLoading");
  const emptyEl   = document.getElementById("articlesEmpty");
  const tableWrap = document.getElementById("articlesTableWrap");
  const tbody     = document.getElementById("articlesTableBody");

  if (!tbody) return;

  loadingEl.style.display  = "flex";
  emptyEl.style.display    = "none";
  tableWrap.style.display  = "none";

  try {
    const q    = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    loadingEl.style.display = "none";

    if (snap.empty) {
      emptyEl.style.display = "block";
      return;
    }

    tableWrap.style.display = "block";
    tbody.innerHTML = "";

    snap.forEach(docSnap => {
      const d       = docSnap.data();
      const artId   = docSnap.id;
      const dateStr = d.createdAt?.toDate
        ? d.createdAt.toDate().toLocaleDateString("ar-SA", {
            year: "numeric", month: "short", day: "numeric"
          })
        : "—";
      const pageLabel = PAGE_LABELS[d.pageId] ?? d.pageId ?? "—";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${_escHtml(d.title ?? "—")}</td>
        <td><span class="qz-page-badge">${pageLabel}</span></td>
        <td><span class="qz-date">${dateStr}</span></td>
        <td>
          <button
            class="qz-del-btn"
            onclick="deleteArticle('${artId}', this)"
          >🗑️ حذف</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("loadArticles error:", err);
    loadingEl.style.display = "none";
    emptyEl.style.display   = "block";
    emptyEl.textContent     = `خطأ في التحميل: ${err.message}`;
  }
};

/* ════════════
   deleteArticle — يحذف مقالاً من Firestore
════════════ */
window.deleteArticle = async function (artId, btnEl) {
  if (!confirm("هل أنت متأكد من حذف هذا المقال نهائياً؟")) return;

  btnEl.disabled    = true;
  btnEl.textContent = "⏳";

  try {
    await deleteDoc(doc(db, "articles", artId));

    const row = btnEl.closest("tr");
    row.style.opacity    = "0";
    row.style.transition = "opacity 0.25s";
    setTimeout(() => {
      row.remove();
      if (!document.querySelector("#articlesTableBody tr")) {
        document.getElementById("articlesTableWrap").style.display = "none";
        document.getElementById("articlesEmpty").style.display     = "block";
      }
    }, 260);

  } catch (err) {
    console.error("deleteArticle error:", err);
    alert(`فشل الحذف: ${err.message}`);
    btnEl.disabled    = false;
    btnEl.textContent = "🗑️ حذف";
  }
};

/* ════════════
   resetArticleForm — إعادة تعيين النموذج
════════════ */
window.resetArticleForm = function () {
  const titleEl = document.getElementById("articleTitle");
  const pageEl  = document.getElementById("articlePage");
  if (titleEl) { titleEl.value = ""; titleEl.classList.remove("error"); }
  if (pageEl)  { pageEl.value  = ""; pageEl.classList.remove("error"); }
  if (_quillInstance) _quillInstance.setContents([]);

  const msgEl = document.getElementById("articleFormMsg");
  if (msgEl) msgEl.style.display = "none";
};

/* ════════════
   toggleArticleForm — طي/فرد نموذج المقال
════════════ */
window.toggleArticleForm = function () {
  const body = document.getElementById("articleFormBody");
  const btn  = body?.previousElementSibling?.querySelector(".qz-collapse-btn");
  if (!body) return;
  const isOpen = !body.classList.contains("collapsed");
  body.classList.toggle("collapsed", isOpen);
  if (btn) btn.textContent = isOpen ? "توسيع ↓" : "تصغير ↑";
};

/* ─── مساعد: رسائل نموذج المقال ──────────────────────── */
function _showArticleMsg(el, text, type) {
  if (!el) return;
  el.textContent   = text;
  el.className     = `qz-form-msg ${type}`;
  el.style.display = "block";
  if (type === "success") setTimeout(() => { el.style.display = "none"; }, 5000);
}
