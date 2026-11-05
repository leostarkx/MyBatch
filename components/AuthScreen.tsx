import React, { useState } from "react";
import {
  FileText,
  AtSign,
  User as UserIcon,
  Lock,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { User, UserRole } from "../types";
import { BatchLogo } from "./BatchLogo";
import { MOCK_USERS } from "../services/mockDb";
import { loginWithGoogle } from "../services/firebase";

export interface AuthScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  onSignup: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  users,
  onLogin,
  onSignup,
}) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || !password) {
      setError("يرجى تعبئة جميع الحقول المطلوبة");
      setIsLoading(false);
      return;
    }

    if (!isLoginMode) {
      if (!name || !cleanEmail) {
        setError("يرجى تعبئة جميع الحقول");
        setIsLoading(false);
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setError("يرجى إدخال بريد إلكتروني صحيح");
        setIsLoading(false);
        return;
      }
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      if (isLoginMode) {
        // Login Logic with MOCK_USERS fallback
        const allCandidates = [
          ...users,
          ...MOCK_USERS.filter((mu) => !users.some((u) => u.username?.toLowerCase() === mu.username?.toLowerCase())),
        ];

        const user = allCandidates.find(
          (u) =>
            (u.username &&
              u.username.toLowerCase() === cleanUsername.toLowerCase()) ||
            (u.email && u.email.toLowerCase() === cleanEmail.toLowerCase()),
        );

        if (user) {
          if (user.password && user.password !== password) {
            setError("كلمة المرور غير صحيحة");
            setIsLoading(false);
            return;
          }
          onLogin(user);
          setIsLoading(false);
        } else if (cleanUsername.toLowerCase() === 'ahmed' && password === 'ahmed0828') {
          // Special owner fallback
          const ownerFallback = MOCK_USERS.find(u => u.username === 'ahmed')!;
          onLogin(ownerFallback);
          setIsLoading(false);
        } else {
          setError("المستخدم غير موجود");
          setIsLoading(false);
        }
      } else {
        // Signup Logic
        if (users.some((u) => u.username?.toLowerCase() === cleanUsername.toLowerCase())) {
          setError("اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر");
          setIsLoading(false);
          return;
        }

        if (users.some((u) => u.email?.toLowerCase() === cleanEmail.toLowerCase())) {
          setError("البريد الإلكتروني مستخدم بالفعل");
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
          setIsLoading(false);
          return;
        }

        const newUser: User = {
          uid: `user_${Date.now()}`,
          username: cleanUsername,
          email: cleanEmail,
          password: password,
          name,
          role: UserRole.STUDENT,
          batchCode: "", // No batch yet
          pendingBatchCode: batchCode.trim().toUpperCase() || "",
          isOfficial: false,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          bio: "طالب مسجل في الدفعة",
          signatureColor: "#64748b",
        };

        onSignup(newUser);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError("حدث خطأ، يرجى المحاولة لاحقاً");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-primary rounded-b-[3rem] z-0 shadow-2xl" />

      <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-sm z-10 border border-white/50 dark:border-slate-700 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
            <BatchLogo
              className="w-24 h-24 relative z-10 drop-shadow-xl hover:scale-105 transition-transform duration-300"
              showBackground
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
            دفعتي
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">
            {isLoginMode ? "سجل دخولك للمتابعة" : "إنشاء حساب طالب جديد"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  الاسم الكامل
                </label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition">
                  <FileText size={16} className="text-gray-400" />
                  <input
                    type="text"
                    className="flex-1 bg-transparent text-sm outline-none dark:text-white"
                    placeholder="الاسم الظاهر للطلاب"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  البريد الإلكتروني
                </label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition">
                  <AtSign size={16} className="text-gray-400" />
                  <input
                    type="email"
                    className="flex-1 bg-transparent text-sm outline-none dark:text-white"
                    placeholder="example@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              اسم المستخدم
            </label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition">
              <UserIcon size={16} className="text-gray-400" />
              <input
                type="text"
                className="flex-1 bg-transparent text-sm outline-none dark:text-white"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              كلمة المرور
            </label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition">
              <Lock size={16} className="text-gray-400" />
              <input
                type="password"
                className="flex-1 bg-transparent text-sm outline-none dark:text-white"
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs font-bold text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-primary/30 mt-4 flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {isLoginMode ? "تسجيل الدخول" : "إنشاء الحساب"}
                <ChevronLeft size={16} />
              </>
            )}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-slate-800 px-2 text-gray-400">
              أو عبر
            </span>
          </div>
        </div>

        {/* Google Login */}
        <button
          type="button"
          onClick={async () => {
            setIsLoading(true);
            setError("");
            try {
              const gUser = await loginWithGoogle();
              if (gUser) {
                onLogin(gUser);
              }
            } catch (err: any) {
              const code = err?.code || "";
              const msg = err?.message || "";
              if (
                code === "auth/popup-closed-by-user" ||
                msg.includes("popup-closed-by-user") ||
                code === "auth/cancelled-popup-request" ||
                msg.includes("cancelled-popup-request")
              ) {
                return;
              }
              console.error("Google Sign-In Error:", err);
              const currentHost = window.location.hostname;
              if (
                code === "auth/unauthorized-domain" ||
                msg.includes("unauthorized-domain")
              ) {
                setError(
                  `النطاق الحالي (${currentHost}) غير مضاف في مشروع Firebase. يرجى إضافته في Authentication > Settings > Authorized domains بدون https://`
                );
              } else if (
                code === "auth/operation-not-allowed" ||
                msg.includes("operation-not-allowed")
              ) {
                setError(
                  "تسجيل الدخول عبر Google غير مفعّل في Firebase Console (Authentication > Sign-in method > Google)."
                );
              } else {
                setError(
                  `تعذر تسجيل الدخول عبر Google (${code || "خطأ بالاتصال"}). تأكد من فتح الرابط في متصفح خارجي أو السماح بالنوافذ المنبثقة.`
                );
              }
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2 transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          تسجيل الدخول عبر Google
        </button>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError("");
            }}
            className="text-xs text-primary font-bold hover:underline"
          >
            {isLoginMode
              ? "طالب جديد؟ أنشئ حسابك الآن"
              : "لديك حساب بالفعل؟ سجل دخولك"}
          </button>
        </div>
      </div>
    </div>
  );
};
