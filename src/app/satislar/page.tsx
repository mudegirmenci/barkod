"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  ShoppingCart,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

interface SaleItem {
  id: string;
  quantity: number;
  salePrice: number;
  purchasePrice: number;
  product: {
    id: string;
    name: string;
    barcode: string;
    imageUrl?: string | null;
  };
}

interface Sale {
  id: string;
  totalAmount: number;
  totalProfit: number;
  createdAt: string;
  items: SaleItem[];
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sales?limit=100");
      const data = await res.json();
      if (data.success) {
        setSales(data.sales);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.totalProfit, 0);

  const toggleExpand = (id: string) => {
    setExpandedSaleId(expandedSaleId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Başlık ve Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Satış Fişleri & Raporlar</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {sales.length} Fiş
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kasada tamamlanan tüm geçmiş satış fişleri ve kalem bazlı kâr dökümü
          </p>
        </div>

        <button
          onClick={fetchSales}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-800 transition active:scale-95 cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Yenile</span>
        </button>
      </div>

      {/* Toplam Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-emerald-400" />
            Toplam Satış Cirosu
          </span>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">
            ₺{totalRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">Son 100 fişin toplam cirosu</p>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-5 shadow-lg bg-gradient-to-b from-slate-900 to-emerald-950/20">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Toplam Net Kâr
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
            ₺{totalProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Satılan ürünlerin alış maliyeti düşülmüş net kazancı
          </p>
        </div>
      </div>

      {/* Fişler Listesi */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Satış fişleri yükleniyor...</span>
        </div>
      ) : sales.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Henüz Satış Kaydı Yok</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hızlı satış ekranına giderek barkod okutup ilk satışı tamamlayabilirsiniz.
          </p>
          <Link
            href="/pos"
            className="inline-flex items-center gap-1.5 mt-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
          >
            <span>Kasaya Git</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => {
            const isExpanded = expandedSaleId === sale.id;
            const date = new Date(sale.createdAt);
            const totalItemsCount = sale.items.reduce((s, i) => s + i.quantity, 0);

            return (
              <div
                key={sale.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-lg transition"
              >
                {/* Fiş Başlığı / Ana Satır */}
                <div
                  onClick={() => toggleExpand(sale.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">
                          Fiş #{sale.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                          {totalItemsCount} Ürün
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {date.toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          • {date.toLocaleDateString("tr-TR")}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    <div className="text-left sm:text-right">
                      <p className="text-base sm:text-lg font-black text-white">
                        ₺{sale.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-xs font-bold text-emerald-400">
                        +₺{sale.totalProfit.toFixed(2)} kâr
                      </p>
                    </div>

                    <div className="p-1.5 rounded-xl bg-slate-800 text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Fiş Detayı (Satılan Kalemler) */}
                {isExpanded && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-slate-800/80 bg-slate-950/50 space-y-2.5 animate-in fade-in duration-200">
                    <span className="text-xs font-bold text-slate-400 block pt-2">
                      Fiş Kalemleri:
                    </span>
                    {sale.items.map((item) => {
                      const lineTotal = item.salePrice * item.quantity;
                      const lineProfit =
                        (item.salePrice - item.purchasePrice) * item.quantity;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-white truncate">
                              {item.product.name}
                            </p>
                            <p className="text-slate-500 font-mono text-[10px]">
                              {item.product.barcode} • {item.quantity} Adet x ₺
                              {item.salePrice.toFixed(2)}
                            </p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-white">
                              ₺{lineTotal.toFixed(2)}
                            </p>
                            <p className="text-emerald-400 font-semibold text-[10px]">
                              +₺{lineProfit.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
