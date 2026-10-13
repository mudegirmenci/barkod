"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Boxes,
  Search,
  AlertTriangle,
  PackagePlus,
  Edit3,
  Trash2,
  RefreshCw,
  ExternalLink,
  CheckCircle,
} from "lucide-react";

interface Product {
  id: string;
  barcode: string;
  name: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  imageUrl?: string | null;
  updatedAt: string;
}

function ProductsListContent() {
  const searchParams = useSearchParams();
  const initialCritical = searchParams.get("critical") === "true";

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(initialCritical);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/products", window.location.origin);
      if (searchTerm) url.searchParams.set("search", searchTerm);
      if (criticalOnly) url.searchParams.set("criticalOnly", "true");

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [criticalOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" ürününü silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setDeleteMessage(`"${name}" silindi.`);
        fetchProducts();
        setTimeout(() => setDeleteMessage(null), 3000);
      } else {
        alert(data.error || "Ürün silinemedi.");
      }
    } catch {
      alert("Silme işlemi başarısız.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Başlık ve Ürün Ekle Butonu */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Stok ve Ürün Listesi</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {products.length} Ürün
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Depodaki ve raftaki tüm kayıtlı ürünlerinizi inceleyin ve yönetin
          </p>
        </div>

        <Link
          href="/urun-ara"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition self-start sm:self-auto cursor-pointer"
        >
          <PackagePlus className="w-4 h-4" />
          <span>Yeni Ürün Ekle</span>
        </Link>
      </div>

      {/* Arama ve Filtre Çubuğu */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ürün adı veya barkod ile arayın..."
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-2xl text-sm transition active:scale-95 cursor-pointer"
          >
            Ara
          </button>
        </form>

        {/* Kritik Stok Filtre Butonu */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setCriticalOnly(!criticalOnly)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              criticalOnly
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Sadece Kritik Stokları Göster (≤ 10)</span>
          </button>
        </div>
      </div>

      {deleteMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
          {deleteMessage}
        </div>
      )}

      {/* Ürün Listesi Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Ürünler yükleniyor...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <Boxes className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Eşleşen Ürün Bulunamadı</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Arama kriterlerinizi değiştirebilir veya yeni ürün eklemek için barkod okutabilirsiniz.
          </p>
          <Link
            href="/urun-ara"
            className="inline-block mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
          >
            Hemen Ürün Ekle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const isCritical = product.stock <= 10;
            const unitProfit = product.salePrice - product.purchasePrice;

            return (
              <div
                key={product.id}
                className={`bg-slate-900 border rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-lg transition ${
                  isCritical
                    ? "border-rose-500/40 bg-gradient-to-b from-slate-900 to-rose-950/10"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Üst Kısım: Resim & Temel Bilgi */}
                <div className="flex items-start gap-3.5">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 flex-shrink-0">
                      <Boxes className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-slate-400 truncate">
                        {product.barcode}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isCritical
                            ? "bg-rose-500 text-white animate-pulse"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {product.stock} Adet
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-1 line-clamp-2">
                      {product.name}
                    </h3>
                  </div>
                </div>

                {/* Orta Kısım: Fiyat & Kâr Tablosu */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Alış</span>
                    <span className="text-xs font-bold text-slate-300">
                      ₺{product.purchasePrice.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Satış</span>
                    <span className="text-xs font-extrabold text-white">
                      ₺{product.salePrice.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 block">Kâr</span>
                    <span className="text-xs font-bold text-emerald-400">
                      +₺{unitProfit.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Alt Butonlar */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  <Link
                    href={`/urun-ara?barcode=${encodeURIComponent(product.barcode)}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Fiyat/Stok Güncelle</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(product.id, product.name)}
                    title="Ürünü Sil"
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-slate-500">Yükleniyor...</div>}>
      <ProductsListContent />
    </Suspense>
  );
}
