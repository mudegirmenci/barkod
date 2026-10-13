"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BarcodeScanner from "@/components/scanner/BarcodeScanner";
import {
  ScanBarcode,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit3,
  ExternalLink,
  Save,
  Boxes,
  TrendingUp,
  Tag,
  DollarSign,
  Package,
} from "lucide-react";

interface ScrapedPrice {
  market: string;
  price: number;
  url?: string;
}

interface ProductData {
  id?: string;
  barcode: string;
  name: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  imageUrl?: string | null;
}

function ProductSearchContent() {
  const searchParams = useSearchParams();
  const initialBarcode = searchParams.get("barcode") || "";

  const [barcode, setBarcode] = useState(initialBarcode);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScrapingAgain, setIsScrapingAgain] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Veritabanında varsa
  const [dbProduct, setDbProduct] = useState<ProductData | null>(null);

  // İnternetten çekilen 5 fiyat ve ürün bilgisi
  const [scrapedData, setScrapedData] = useState<{
    name: string;
    imageUrl: string;
    prices: ScrapedPrice[];
  } | null>(null);

  // Form alanları (yeni ürün veya güncelleme için)
  const [formData, setFormData] = useState<{
    name: string;
    purchasePrice: string;
    salePrice: string;
    stock: string;
    imageUrl: string;
  }>({
    name: "",
    purchasePrice: "",
    salePrice: "",
    stock: "500", // Varsayılan kural: 500
    imageUrl: "",
  });

  // Güncelleme modu: 'manuel' veya 'internet'
  const [updateMode, setUpdateMode] = useState<"none" | "manual" | "internet">("none");

  // Arama fonksiyonu
  const executeSearch = async (targetBarcode: string) => {
    if (!targetBarcode.trim()) return;

    setIsSearching(true);
    setStatusMessage(null);
    setDbProduct(null);
    setScrapedData(null);
    setUpdateMode("none");

    try {
      const res = await fetch(
        `/api/products/search?barcode=${encodeURIComponent(targetBarcode.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Arama sırasında bir hata oluştu.");
      }

      setBarcode(targetBarcode.trim());

      if (data.exists && data.product) {
        // ÜRÜN VERİTABANINDA VAR
        setDbProduct(data.product);
        setFormData({
          name: data.product.name,
          purchasePrice: data.product.purchasePrice.toString(),
          salePrice: data.product.salePrice.toString(),
          stock: data.product.stock.toString(),
          imageUrl: data.product.imageUrl || "",
        });
        setStatusMessage({
          type: "info",
          text: `"${data.product.name}" veritabanınızda kayıtlı. Aşağıdan güncelleyebilir veya stok durumunu görebilirsiniz.`,
        });
      } else if (data.scraped) {
        // ÜRÜN VERİTABANINDA YOK -> İnternetten bulunan 5 fiyat getirildi
        setScrapedData(data.scraped);

        // Varsayılan olarak en yüksek fiyatı veya ortalamayı seç
        const suggestedSalePrice =
          data.scraped.prices.length > 0 ? data.scraped.prices[0].price : 50;

        // Tahmini alış fiyatı (esnafın değiştirmesi için)
        const suggestedPurchase = Math.round(suggestedSalePrice * 0.75 * 100) / 100;

        setFormData({
          name: data.scraped.name,
          purchasePrice: suggestedPurchase.toString(),
          salePrice: suggestedSalePrice.toString(),
          stock: "500", // İş Kuralı: Stok varsayılan 500 gelecek
          imageUrl: data.scraped.imageUrl,
        });

        setStatusMessage({
          type: "info",
          text: `Ürün veritabanında bulunamadı. Türkiye pazar yerlerinden (Cimri, Akakçe, Trendyol vb.) en güncel 5 fiyat çekildi.`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: err.message || "Arama başarısız oldu.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialBarcode) {
      executeSearch(initialBarcode);
    }
  }, [initialBarcode]);

  // İnternette Tekrar Ara (Kayıtlı ürün güncellemesi için)
  const handleScrapeAgain = async () => {
    if (!barcode) return;
    setIsScrapingAgain(true);
    setStatusMessage(null);

    try {
      const res = await fetch(
        `/api/products/scrape?barcode=${encodeURIComponent(barcode)}&query=${encodeURIComponent(
          formData.name
        )}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Fiyatlar çekilemedi.");

      setScrapedData(data.data);
      setUpdateMode("internet");
      setStatusMessage({
        type: "success",
        text: "Pazar yerlerinden en güncel 5 fiyat çekildi. Uygulamak istediğiniz fiyata tıklayın.",
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: "İnternetten fiyatlar çekilirken bir sorun oluştu.",
      });
    } finally {
      setIsScrapingAgain(false);
    }
  };

  // Ürünü Kaydet / Güncelle
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim() || !formData.name.trim()) {
      setStatusMessage({
        type: "error",
        text: "Barkod ve ürün adı zorunludur.",
      });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const payload = {
        barcode: barcode.trim(),
        name: formData.name.trim(),
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        salePrice: parseFloat(formData.salePrice) || 0,
        stock: parseInt(formData.stock, 10) || 500,
        imageUrl: formData.imageUrl.trim() || null,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ürün kaydedilemedi.");
      }

      setDbProduct(data.product);
      setUpdateMode("none");
      setStatusMessage({
        type: "success",
        text: `"${data.product.name}" başarıyla veritabanına kaydedildi! Artık POS ekranında barkod okutularak satılabilir.`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: err.message || "Kaydetme sırasında bir hata oluştu.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentPurchase = parseFloat(formData.purchasePrice) || 0;
  const currentSale = parseFloat(formData.salePrice) || 0;
  const unitProfit = currentSale - currentPurchase;
  const marginPercent =
    currentSale > 0 ? Math.round((unitProfit / currentSale) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Sayfa Başlığı */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>Ürün Sorgula, Fiyat Ara & Ekle</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Fiyat Robotu
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Barkodu okutun. Veritabanında yoksa Akakçe, Cimri, Trendyol pazar yerlerinden otomatik 5 fiyat çekilir.
        </p>
      </div>

      {/* Barkod Okuyucu / Tarayıcı */}
      <BarcodeScanner onScan={executeSearch} />

      {/* Durum / Bildirim Mesajı */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-sm flex items-start gap-3 animate-in fade-in duration-200 ${
            statusMessage.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-200"
              : statusMessage.type === "error"
              ? "bg-rose-500/15 border border-rose-500/30 text-rose-200"
              : "bg-blue-500/15 border border-blue-500/30 text-blue-200"
          }`}
        >
          {statusMessage.type === "success" && (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
          )}
          {statusMessage.type === "error" && (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
          )}
          {statusMessage.type === "info" && (
            <Sparkles className="w-5 h-5 flex-shrink-0 text-blue-400 mt-0.5" />
          )}
          <span className="leading-relaxed">{statusMessage.text}</span>
        </div>
      )}

      {/* Arama Devam Ediyor */}
      {isSearching && (
        <div className="py-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-white">İnternet Pazar Yerleri Taranıyor...</p>
          <p className="text-xs text-slate-400">
            Cimri, Trendyol, Hepsiburada, Akakçe ve PttAVM fiyatları taranıyor.
          </p>
        </div>
      )}

      {/* DURUM 1: ÜRÜN VERİTABANINDA MEVCUT (Kayıtlı Ürün Ekranı) */}
      {!isSearching && dbProduct && updateMode === "none" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-4">
              {dbProduct.imageUrl ? (
                <img
                  src={dbProduct.imageUrl}
                  alt={dbProduct.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-700 flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <Package className="w-8 h-8" />
                </div>
              )}
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Kayıtlı Ürün
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-white mt-1">
                  {dbProduct.name}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Barkod: {dbProduct.barcode}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-black px-3 py-1.5 rounded-xl ${
                  dbProduct.stock <= 10
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-slate-800 text-slate-200"
                }`}
              >
                Mevcut Stok: {dbProduct.stock} Adet
              </span>
            </div>
          </div>

          {/* Fiyat ve Kâr Bilgileri */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Alış Fiyatı</span>
              <p className="text-xl font-black text-white mt-1">
                ₺{dbProduct.purchasePrice.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Satış Fiyatı</span>
              <p className="text-xl font-black text-emerald-400 mt-1">
                ₺{dbProduct.salePrice.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Birim Kâr</span>
              <p className="text-xl font-black text-emerald-400 mt-1">
                +₺{(dbProduct.salePrice - dbProduct.purchasePrice).toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Kâr Marjı</span>
              <p className="text-xl font-black text-teal-400 mt-1">
                %{dbProduct.salePrice > 0 ? Math.round(((dbProduct.salePrice - dbProduct.purchasePrice) / dbProduct.salePrice) * 100) : 0}
              </p>
            </div>
          </div>

          {/* İŞ KURALI 4: Fiyat/Stok Güncelle Butonları */}
          <div className="pt-2">
            <h3 className="text-sm font-bold text-white mb-3">Fiyat ve Stok Güncelleme</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUpdateMode("manual")}
                className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition active:scale-95 cursor-pointer"
              >
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <span>Manuel Güncelle (Elle Düzenle)</span>
              </button>

              <button
                type="button"
                onClick={handleScrapeAgain}
                disabled={isScrapingAgain}
                className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-sm border border-emerald-500/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-emerald-400 ${isScrapingAgain ? "animate-spin" : ""}`} />
                <span>İnternette Tekrar Ara (Güncel 5 Fiyat)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DURUM 2: YENİ ÜRÜN VEYA GÜNCELLEME FORMU (İnternetten 5 Fiyat Dahil) */}
      {!isSearching && (scrapedData || updateMode !== "none") && (
        <form onSubmit={handleSaveProduct} className="space-y-6">
          {/* İNTERNETTEN ÇEKİLEN 5 FİYAT KARTLARI (En yüksekten en düşüğe sıralı) */}
          {scrapedData && scrapedData.prices.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <span>Türkiye Pazar Yerleri Fiyatları (En Yüksekten En Düşüğe)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bir satış fiyatı seçmek için kutuya tıklayın
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full self-start sm:self-auto">
                  5 Fiyat Karşılaştırması
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {scrapedData.prices.map((p, idx) => {
                  const isSelected = parseFloat(formData.salePrice) === p.price;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, salePrice: p.price.toString() }))}
                      className={`p-3.5 rounded-2xl text-left border transition cursor-pointer relative ${
                        isSelected
                          ? "bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-[1.02]"
                          : "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">
                          {p.market}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-lg font-black text-white mt-1.5">
                        ₺{p.price.toFixed(2)}
                      </p>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {isSelected ? "Seçildi" : "Bu Fiyatı Seç"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* DÜZENLEME VE KAYDETME FORMU */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-emerald-400" />
              <span>Ürün ve Fiyat Bilgileri</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Barkod (Salt Okunur) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Barkod Numarası
                </label>
                <input
                  type="text"
                  value={barcode}
                  readOnly
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 font-mono text-sm cursor-not-allowed"
                />
              </div>

              {/* Ürün Adı */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Çaykur Rize Çayı 500 gr"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Alış Fiyatı (purchasePrice) - Kâr hesabı için zorunlu kural */}
              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1.5">
                  Alış Fiyatı (₺) * (Kâr Hesabı İçin)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-emerald-500/40 text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Satış Fiyatı (salePrice) - 5 fiyattan biri veya manuel */}
              <div>
                <label className="block text-xs font-semibold text-teal-300 mb-1.5">
                  Satış Fiyatı (₺) * (Yukarıdan Seçebilir veya Elle Yazabilirsiniz)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-teal-500/40 text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Stok Miktarı - Varsayılan 500, değiştirilebilir */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Stok Miktarı (Adet) * (Varsayılan: 500)
                </label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="500"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Ürün Görsel URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Ürün Görsel Linki (Opsiyonel)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Anlık Kâr Önizleme Çubuğu */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-emerald-300">
                Hesaplanan Birim Net Kâr:
              </span>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-white">
                  +₺{unitProfit.toFixed(2)}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                  %{marginPercent} Kâr Marjı
                </span>
              </div>
            </div>

            {/* Kaydet Butonu */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>
                      {dbProduct ? "Değişiklikleri Kaydet" : "Ürünü Veritabanına Ekle"}
                    </span>
                  </>
                )}
              </button>

              {dbProduct && updateMode !== "none" && (
                <button
                  type="button"
                  onClick={() => setUpdateMode("none")}
                  className="px-5 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition cursor-pointer"
                >
                  Vazgeç
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ProductSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-slate-400">Yükleniyor...</div>
      }
    >
      <ProductSearchContent />
    </Suspense>
  );
}
