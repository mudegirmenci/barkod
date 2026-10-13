"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Barcode, ShieldCheck, ArrowRight, Store, AlertCircle } from "lucide-react";

function SignInContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10">
        {/* Header / Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Barcode className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <span>EsnafPOS</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PWA
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Barkodlu Hızlı Satış, Fiyat Araştırma & Stok Yönetimi
            </p>
          </div>
        </div>

        {/* Error notification if any */}
        {error && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-medium">Giriş Yapılamadı</p>
              <p className="text-xs text-rose-300/80 mt-0.5">
                {error === "OAuthSignin" || error === "OAuthCallback"
                  ? "Google ile oturum açarken bir sorun oluştu. Lütfen .env dosyasındaki Google kimlik bilgilerini kontrol edin."
                  : "Giriş işlemi sırasında beklenmedik bir hata oluştu."}
              </p>
            </div>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="space-y-2.5 py-2">
          <div className="flex items-center gap-3 text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <Store className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Kamera & Barkod Tabancası ile Hızlı Satış</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <span>Cimri, Trendyol & Akakçe Otomatik Fiyat Sorgulama</span>
          </div>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading || status === "loading"}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white text-slate-900 font-semibold hover:bg-slate-100 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-base"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 leading-relaxed">
            Güvenli kimlik doğrulama Google OAuth üzerinden sağlanır. Tüm esnaf verileriniz şifreli olarak saklanır.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Yükleniyor...</div>}>
      <SignInContent />
    </Suspense>
  );
}
