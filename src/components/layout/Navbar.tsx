"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingCart,
  ScanBarcode,
  Boxes,
  Receipt,
  LogOut,
  Store,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Giriş sayfasında navbar gösterilmez
  if (pathname === "/auth/signin") return null;

  const navItems = [
    {
      label: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      label: "Satış Yap",
      href: "/pos",
      icon: ShoppingCart,
      highlight: true,
    },
    {
      label: "Ürün Bul/Ekle",
      href: "/urun-ara",
      icon: ScanBarcode,
    },
    {
      label: "Stok Listesi",
      href: "/urunler",
      icon: Boxes,
    },
    {
      label: "Geçmiş",
      href: "/satislar",
      icon: Receipt,
    },
  ];

  return (
    <>
      {/* Üst Bar (Desktop & Mobile Header) */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                EsnafPOS
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                  PRO
                </span>
              </span>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Hızlı Satış, Fiyat Araştırma & Stok
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  } ${item.highlight ? "font-semibold" : ""}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile & Sign out */}
          <div className="flex items-center gap-3">
            {session?.user && (
              <div className="flex items-center gap-2.5">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "Kullanıcı"}
                    className="w-8 h-8 rounded-full border border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
                    {session.user.name ? session.user.name.charAt(0) : "E"}
                  </div>
                )}
                <div className="hidden lg:block text-left text-xs">
                  <p className="font-medium text-white truncate max-w-[120px]">
                    {session.user.name || "Esnaf"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {session.user.email}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              title="Çıkış Yap"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/20 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Tek elle kullanım için optimize) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 pb-safe">
        <nav className="grid grid-cols-5 h-16 items-center px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 transition-all ${
                  isActive
                    ? "text-emerald-400 font-bold scale-105"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition ${
                    isActive ? "bg-emerald-500/20" : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[62px]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
