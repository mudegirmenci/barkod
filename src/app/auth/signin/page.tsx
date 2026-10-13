"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import {
  Store,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";

const REQUIRED_CODE = "mustafadegirmenci";

function SignInContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError = searchParams.get("error");

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);

  // Form Verileri
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

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
        "Google ile ilk kez kayıt olurken 'mustafadegirmenci' davet kodunu girmelisiniz. Lütfen 'Kayıt Ol' sekmesinden kodu girerek devam edin."
      );
      setActiveTab("register");
    } else if (urlError === "CredentialsSignin") {
      setErrorMessage("E-posta adresi veya şifre hatalı.");
    } else if (urlError) {
      setErrorMessage("Giriş sırasında bir hata oluştu.");
    }
  }, [urlError]);

  // Giriş Yap
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setErrorMessage("Giriş yapılırken bir hata oluştu.");
      setIsLoading(false);
    }
  };

  // Yeni Kayıt Ol (Zorunlu Davet Kodu: mustafadegirmenci)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanCode = inviteCode.trim().toLowerCase();
    if (cleanCode !== REQUIRED_CODE.toLowerCase()) {
      setErrorMessage(
        "Üyelik işlemi durduruldu: Geçerli davet kodunu ('mustafadegirmenci') girmelisiniz."
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          inviteCode: cleanCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Kayıt işlemi başarısız.");
      }

      setSuccessMessage("Hesabınız oluşturuldu! Oturum açılıyor...");

      const loginRes = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
        callbackUrl,
      });

      if (!loginRes?.error) {
        router.push(callbackUrl);
      } else {
        setActiveTab("login");
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Kayıt oluşturulurken bir sorun oluştu.");
      setIsLoading(false);
    }
  };

  // Google ile Giriş / Kayıt
  const handleGoogleAuth = async () => {
    setErrorMessage(null);

    // Eğer kullanıcı Kayıt Ol sekmesindeyse veya davet kodu kutusuna bir şey yazdıysa
    if (activeTab === "register") {
      const cleanCode = inviteCode.trim().toLowerCase();
      if (cleanCode !== REQUIRED_CODE.toLowerCase()) {
        setErrorMessage(
          "Google ile yeni kayıt oluşturmak için lütfen Davet Kodu alanına 'mustafadegirmenci' yazınız."
        );
        return;
      }
      document.cookie = `invite_code=${encodeURIComponent(
        cleanCode
      )}; path=/; max-age=600; SameSite=Lax`;
    }

    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setIsLoading(false);
      setErrorMessage("Google ile bağlantı kurulamadı.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[420px] bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Logo & Başlık */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20 mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            EsnafPOS Giriş
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Barkodlu Satış, Fiyat Araştırma & Stok Yönetimi
          </p>
        </div>

        {/* Sekme Değiştirici (Pill Tabs) */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "login"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "register"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Yeni Kayıt
          </button>
        </div>

        {/* Hata / Başarı Bildirimi */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Google ile Giriş Butonu */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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
          <span>
            {activeTab === "register" ? "Google ile Kayıt Ol" : "Google ile Giriş Yap"}
          </span>
        </button>

        {/* Veya Ayracı */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-slate-900 px-3 text-slate-500 font-medium">
              veya e-posta ile
            </span>
          </div>
        </div>

        {/* FORM: GİRİŞ YAP VEYA KAYIT OL */}
        <form
          onSubmit={activeTab === "login" ? handleLogin : handleRegister}
          className="space-y-3.5"
        >
          {/* Ad Soyad (Sadece Kayıt Olurken) */}
          {activeTab === "register" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ad Soyad / İşletme Adı
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mustafa Değirmenci"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
          )}

          {/* E-posta */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              E-posta Adresi
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="esnaf@ornek.com"
                className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Şifre */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Şifre
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Zorunlu Davet Kodu (Sadece Kayıt Olurken) */}
          {activeTab === "register" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-emerald-400">
                  Davet Kodu (Zorunlu)
                </label>
                <span className="text-[10px] text-slate-500">
                  Kod: mustafadegirmenci
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="mustafadegirmenci"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-sm font-mono text-emerald-300 placeholder-emerald-500/30 focus:outline-none focus:border-emerald-400 transition"
                />
              </div>
            </div>
          )}

          {/* Gönder Butonu */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {activeTab === "login" ? "Giriş Yap" : "Hesap Oluştur"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center text-slate-500 text-sm">
          Yükleniyor...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
