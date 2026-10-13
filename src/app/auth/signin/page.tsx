"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import {
  Barcode,
  ShieldCheck,
  ArrowRight,
  Store,
  AlertCircle,
  KeyRound,
  UserPlus,
  LogIn,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Sparkles,
} from "lucide-react";

const REQUIRED_CODE = "mustafadegirmenci";

function SignInContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError = searchParams.get("error");

  // Sekme: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerInviteCode, setRegisterInviteCode] = useState("");

  const [googleInviteCode, setGoogleInviteCode] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  useEffect(() => {
    if (urlError === "InvalidInviteCode") {
      setErrorMessage(
        "Google ile ilk kez kayıt olurken 'mustafadegirmenci' davet kodunu girmelisiniz."
      );
    } else if (urlError === "CredentialsSignin") {
      setErrorMessage("E-posta adresi veya şifre hatalı.");
    } else if (urlError) {
      setErrorMessage("Oturum açma sırasında bir hata oluştu.");
    }
  }, [urlError]);

  // NORMAL E-POSTA & ŞİFRE İLE GİRİŞ
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: loginEmail,
        password: loginPassword,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
      }
    } catch (err: any) {
      setErrorMessage("Giriş yapılırken bir sorun oluştu.");
      setIsLoading(false);
    }
  };

  // NORMAL YENİ HESAP KAYDI (ZORUNLU DAVET KODU)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // İŞ KURALI: mustafadegirmenci davet kodu girilmesi zorunludur!
    const cleanInvite = registerInviteCode.trim().toLowerCase();
    if (cleanInvite !== REQUIRED_CODE.toLowerCase()) {
      setErrorMessage(
        "Kayıt işlemi ilerlemedi: Lütfen geçerli davet kodunu ('mustafadegirmenci') giriniz."
      );
      return;
    }

    if (registerPassword.length < 6) {
      setErrorMessage("Şifreniz en az 6 karakter olmalıdır.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
          inviteCode: registerInviteCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Kayıt oluşturulamadı.");
      }

      setSuccessMessage("Hesabınız başarıyla oluşturuldu! Otomatik giriş yapılıyor...");

      // Otomatik giriş yap
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: registerEmail,
        password: registerPassword,
        callbackUrl,
      });

      if (!loginRes?.error) {
        router.push(callbackUrl);
      } else {
        setActiveTab("login");
        setLoginEmail(registerEmail);
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Kayıt sırasında bir hata oluştu.");
      setIsLoading(false);
    }
  };

  // GOOGLE / GMAIL İLE GİRİŞ & KAYIT (DAVET KODU ŞARTLI)
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);

    // Davet kodunu çerez olarak kaydet (Google OAuth dönüşünde backend kontrol edecek)
    const cleanGoogleCode = googleInviteCode.trim().toLowerCase();

    // Kullanıcıya davet kodunu girmesini hatırlat
    if (cleanGoogleCode !== REQUIRED_CODE.toLowerCase()) {
      setErrorMessage(
        "Google / Gmail ile giriş/kayıt yapabilmek için lütfen 'mustafadegirmenci' davet kodunu giriniz."
      );
      return;
    }

    // Çereze yaz
    document.cookie = `invite_code=${encodeURIComponent(
      cleanGoogleCode
    )}; path=/; max-age=600; SameSite=Lax`;

    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white py-12">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl relative z-10">
        {/* Header / Brand */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Barcode className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>EsnafPOS</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Barkodlu Hızlı Satış, Fiyat Araştırma & Stok Yönetimi
            </p>
          </div>
        </div>

        {/* SEKME DEĞİŞTİRİCİ: GİRİŞ YAP / KAYIT OL */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "login"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Giriş Yap</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "register"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Yeni Kayıt</span>
          </button>
        </div>

        {/* Hata ve Başarı Bildirimleri */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* 1. GİRİŞ YAP FORMU */}
        {activeTab === "login" && (
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-posta Adresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ornek@esnaf.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. YENİ KAYIT OL FORMU (ZORUNLU DAVET KODU) */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ad Soyad / İşletme Adı
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Örn: Mustafa Değirmenci"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                E-posta Adresi *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="ornek@esnaf.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Şifre * (En az 6 karakter)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* ZORUNLU DAVET KODU ALANI */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
              <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Zorunlu Davet Kodu *</span>
              </label>
              <input
                type="text"
                required
                value={registerInviteCode}
                onChange={(e) => setRegisterInviteCode(e.target.value)}
                placeholder="mustafadegirmenci"
                className="w-full px-4 py-2.5 bg-slate-950 border border-amber-500/50 rounded-xl text-white placeholder-amber-500/40 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <p className="text-[11px] text-amber-300/80 leading-tight">
                Üyeliğin ilerlemesi için geçerli davet kodunu (<strong>mustafadegirmenci</strong>) girmeniz şarttır.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Kayıt Ol ve Giriş Yap</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* AYIRICI VE GOOGLE / GMAIL İLE GİRİŞ */}
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          <div className="text-center">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Veya Google / Gmail ile
            </span>
          </div>

          {/* Google Davet Kodu Giriş Kutusu */}
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={googleInviteCode}
                onChange={(e) => setGoogleInviteCode(e.target.value)}
                placeholder="Google davet kodu: mustafadegirmenci"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all shadow active:scale-[0.98] cursor-pointer disabled:opacity-60"
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
              <span>Google ile Giriş Yap</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
          Yükleniyor...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
