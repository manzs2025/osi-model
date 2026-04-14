/**
 * ═══════════════════════════════════════════════════════════════
 *  firebase.js  —  تهيئة Firebase لمشروع مبادئ شبكات الحاسب
 *  SDK Version: Firebase 9+ (Modular)
 *  Project: networkacademy-795c8
 * ═══════════════════════════════════════════════════════════════
 *
 *  كيفية الاستخدام في أي صفحة HTML:
 *  <script type="module">
 *    import { loginUser, logoutUser, getCurrentUser } from './firebase.js';
 *  </script>
 */

import { initializeApp }                      from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc,
         getDoc, addDoc, collection,
         serverTimestamp }                     from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword,
         signOut, onAuthStateChanged,
         createUserWithEmailAndPassword }      from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* ─────────────────────────────────────────────
   1. إعدادات المشروع
───────────────────────────────────────────── */
const firebaseConfig = {
  apiKey:            "AIzaSyCz9Wedr_X3VzoaH0gJj8QFrNIK5vT4vww",
  authDomain:        "networkacademy-795c8.firebaseapp.com",
  projectId:         "networkacademy-795c8",
  storageBucket:     "networkacademy-795c8.firebasestorage.app",
  messagingSenderId: "458132238000",
  appId:             "1:458132238000:web:bffd7321407b094bb21575"
};

/* ─────────────────────────────────────────────
   2. تهيئة الخدمات
───────────────────────────────────────────── */
const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);     // Cloud Firestore
const auth = getAuth(app);          // Firebase Authentication

/* ─────────────────────────────────────────────
   3. ثوابت الأدوار
───────────────────────────────────────────── */
export const ROLES = {
  ADMIN:   "admin",
  TRAINEE: "trainee"
};

/* ═══════════════════════════════════════════════════════════
   المصادقة (Authentication)
═══════════════════════════════════════════════════════════ */

/**
 * تسجيل الدخول بالبريد وكلمة المرور
 * @param {string} email
 * @param {string} password
 * @returns {{ user, profile } | { error }}
 *
 * مثال:
 *   const result = await loginUser("admin@academy.com", "pass123");
 *   if (result.error) { showError(result.error); return; }
 *   redirectByRole(result.profile.role);
 */
export async function loginUser(email, password) {
  try {
    const cred    = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(cred.user.uid);

    // تسجيل الجلسة في Firestore
    await logSession(cred.user.uid);

    return { user: cred.user, profile };
  } catch (err) {
    return { error: _parseAuthError(err.code) };
  }
}

/**
 * تسجيل الخروج
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * إنشاء حساب متدرب جديد (يستخدمه المشرف فقط)
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @param {string} role — ROLES.ADMIN | ROLES.TRAINEE
 * @returns {{ uid } | { error }}
 */
export async function createAccount(email, password, displayName, role = ROLES.TRAINEE) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;

    // إنشاء مستند المستخدم في Firestore
    await setDoc(doc(db, "users", uid), {
      uid,
      email,
      displayName,
      role,
      createdAt: serverTimestamp()
    });

    return { uid };
  } catch (err) {
    return { error: _parseAuthError(err.code) };
  }
}

/**
 * مراقبة حالة المصادقة (مستمع)
 * @param {function} callback — يُستدعى عند تغيّر حالة تسجيل الدخول
 *
 * مثال:
 *   onAuthChange((user, profile) => {
 *     if (!user) { location.href = 'login.html'; return; }
 *     if (profile.role !== 'admin') { location.href = 'index.html'; }
 *   });
 */
export function onAuthChange(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      callback(user, profile);
    } else {
      callback(null, null);
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   قراءة بيانات المستخدم (Firestore)
═══════════════════════════════════════════════════════════ */

/**
 * جلب ملف المستخدم من Firestore
 * @param {string} uid
 * @returns {object | null}
 */
export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

/**
 * المستخدم الحالي المُسجَّل دخوله (متزامن)
 * @returns {object | null}
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/* ═══════════════════════════════════════════════════════════
   تسجيل الجلسات
═══════════════════════════════════════════════════════════ */

/**
 * تسجيل جلسة دخول في Firestore
 * @param {string} uid
 */
async function logSession(uid) {
  try {
    await addDoc(collection(db, "sessions"), {
      userId:   uid,
      loginAt:  serverTimestamp(),
      device:   navigator.userAgent,
      active:   true
    });
  } catch {
    // لا نُوقف التطبيق إذا فشل تسجيل الجلسة
    console.warn("فشل تسجيل الجلسة");
  }
}

/* ═══════════════════════════════════════════════════════════
   حارس الصفحات (Page Guard)
═══════════════════════════════════════════════════════════ */

/**
 * يحمي الصفحة بحيث لا يدخلها إلا الأدوار المسموح لها
 * @param {...string} allowedRoles — ROLES.ADMIN | ROLES.TRAINEE
 *
 * الاستخدام في أعلى أي صفحة محمية:
 *   import { guardPage, ROLES } from './firebase.js';
 *   guardPage(ROLES.ADMIN);              // مشرفون فقط
 *   guardPage(ROLES.ADMIN, ROLES.TRAINEE); // جميع المسجلين
 */
export function guardPage(...allowedRoles) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      location.href = "login.html";
      return;
    }
    const profile = await getUserProfile(user.uid);
    if (!profile || !allowedRoles.includes(profile.role)) {
      location.href = "unauthorized.html";
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   تصدير الخدمات الأساسية للاستخدام في ملفات أخرى
═══════════════════════════════════════════════════════════ */
export { db, auth };

/* ─────────────────────────────────────────────
   دالة داخلية: تحويل رموز خطأ Firebase إلى رسائل عربية
───────────────────────────────────────────── */
function _parseAuthError(code) {
  const errors = {
    "auth/user-not-found":      "البريد الإلكتروني غير مسجّل",
    "auth/wrong-password":      "كلمة المرور غير صحيحة",
    "auth/invalid-credential":  "بيانات الدخول غير صحيحة",
    "auth/email-already-in-use":"البريد الإلكتروني مسجّل مسبقاً",
    "auth/weak-password":       "كلمة المرور ضعيفة (6 أحرف على الأقل)",
    "auth/too-many-requests":   "محاولات كثيرة، يرجى الانتظار",
    "auth/network-request-failed": "خطأ في الاتصال بالإنترنت"
  };
  return errors[code] || `خطأ غير متوقع (${code})`;
}
