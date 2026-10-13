"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  ScanBarcode,
  PackageCheck,
  Calendar,
  Clock,
  ArrowRight,
  Boxes,
  RefreshCw,
  ReceiptText,
  Database,
} from "lucide-react";

interface DashboardData {
  metrics: {
    daily: {
      revenue: number;
      profit: number;
      count: number;
    };
    weekly: {
      revenue: number;
      profit: number;
      count: number;
    };
    totalProducts: number;
  };
  criticalStockProducts: Array<{
    id: string;
    name: string;
    barcode: string;
    stock: number;
    salePrice: number;
    purchasePrice: number;
    imageUrl?: string | null;
  }>;
  recentSales: Array<{
    id: string;
    totalAmount: number;
    totalProfit: number;
    createdAt: string;
    items: Array<{
      quantity: number;
      product: {
        name: string;
        barcode: string;
      };
    }>;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Veriler alınamadı.");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError("Dashboard verileri yüklenirken bir sorun oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Üst Karşılama ve Hızlı Kısayollar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Esnaf Kontrol Paneli
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Günün satışları, kritik stoklar ve kâr/ciro analizi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/yedek"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-teal-400 text-xs font-semibold hover:bg-slate-800 transition active:scale-95 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Yedek Al/Yükle</span>
          </Link>

          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* TEK ELLE KULLANIMA UYGUN BÜYÜK MOBİL EYLEM BUTONLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Link
          href="/pos"
          className="group relative overflow-hidden flex items-center justify-between p-5 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/20 active:scale-[0.98] transition cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-100 font-bold">
                Kasaya Geç
              </span>
              <h2 className="text-xl font-black text-white">Hızlı Satış Yap</h2>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-white/80 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          href="/urun-ara"
          className="group relative overflow-hidden flex items-center justify-between p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white shadow-lg active:scale-[0.98] transition cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-800 text-emerald-400 border border-slate-700">
              <ScanBarcode className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Fiyat & Stok
              </span>
              <h2 className="text-xl font-black text-white">Barkod Okut / Ekle</h2>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-400 group-hover:translate-x-1 transition" />
        </Link>
      </div>

      {/* SATIŞ VE KÂR ÖZETİ METRİK KARTLARI (GÜNLÜK & HAFTALIK) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Günlük Ciro */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Bugün Toplam Ciro
            </span>
            <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {data?.metrics.daily.count || 0} Satış
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ₺{data ? data.metrics.daily.revenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Bugün kasaya giren brüt tutar</p>
          </div>
        </div>

        {/* Günlük Kâr */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Bugün Net Kâr
            </span>
            <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Kazanç
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              ₺{data ? data.metrics.daily.profit.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Alış & satış fiyatı net kârı</p>
          </div>
        </div>

        {/* Haftalık Ciro */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-400" /> Haftalık Ciro
            </span>
            <span className="text-[11px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full">
              {data?.metrics.weekly.count || 0} Satış
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ₺{data ? data.metrics.weekly.revenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Son 7 günlük brüt ciro</p>
          </div>
        </div>

        {/* Haftalık Kâr */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" /> Haftalık Net Kâr
            </span>
            <span className="text-[11px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
              7 Günlük
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-teal-400 tracking-tight">
              ₺{data ? data.metrics.weekly.profit.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Haftalık toplam kâr miktarı</p>
          </div>
        </div>
      </div>

      {/* 2 SÜTUN: KRİTİK STOK UYARILARI & SON SATIŞLAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KRİTİK STOK UYARILARI (Stok <= 10 Kırmızı Uyarı Listesi) */}
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Kritik Stok Uyarıları
                  {data && data.criticalStockProducts.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                      {data.criticalStockProducts.length}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-rose-300/80">
                  Stok miktarı 10 veya altında kalan ürünler
                </p>
              </div>
            </div>
            <Link
              href="/urunler?critical=true"
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:underline"
            >
              Tümünü Gör
            </Link>
          </div>

          <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                Yükleniyor...
              </div>
            ) : !data || data.criticalStockProducts.length === 0 ? (
              <div className="py-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80 p-6 space-y-2">
                <PackageCheck className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold text-white">Harika! Kritik stokta ürün yok.</p>
                <p className="text-xs text-slate-400">
                  Tüm ürünlerinizin stok miktarı 10 adedin üzerinde.
                </p>
              </div>
            ) : (
              data.criticalStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <Boxes className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {product.barcode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 text-right">
                    <div>
                      <span className="inline-block text-xs font-black px-2.5 py-1 rounded-xl bg-rose-600 text-white shadow-sm">
                        {product.stock} Adet Kaldı
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Satış: ₺{product.salePrice.toFixed(2)}
                      </p>
                    </div>
                    <Link
                      href={`/urun-ara?barcode=${product.barcode}`}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    >
                      Güncelle
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SON SATIŞLAR LİSTESİ */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Son Satış Fişleri</h3>
                <p className="text-xs text-slate-400">Kasadan çıkan son fişler</p>
              </div>
            </div>
            <Link
              href="/satislar"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              Geçmişi Gör
            </Link>
          </div>

          <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                Yükleniyor...
              </div>
            ) : !data || data.recentSales.length === 0 ? (
              <div className="py-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80 p-6 space-y-2">
                <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-white">Henüz satış yapılmadı</p>
                <p className="text-xs text-slate-400">
                  Satış ekranına giderek barkod okutmaya başlayın.
                </p>
              </div>
            ) : (
              data.recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-semibold text-white truncate">
                      {sale.items.map((i) => `${i.product.name} (x${i.quantity})`).join(", ")}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(sale.createdAt).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      - {new Date(sale.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-extrabold text-white">
                      ₺{sale.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-xs font-semibold text-emerald-400">
                      +₺{sale.totalProfit.toFixed(2)} kâr
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
