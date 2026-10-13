"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import BarcodeScanner from "@/components/scanner/BarcodeScanner";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Package,
  Receipt,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
} from "lucide-react";

interface CartItem {
  productId: string;
  barcode: string;
  name: string;
  salePrice: number;
  purchasePrice: number;
  stock: number;
  quantity: number;
  imageUrl?: string | null;
}

export default function PosPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [lastCompletedSale, setLastCompletedSale] = useState<{
    id: string;
    totalAmount: number;
    totalProfit: number;
    itemsCount: number;
  } | null>(null);

  // Ürün veritabanında bulunamazsa yönlendirme önerisi
  const [unfoundBarcode, setUnfoundBarcode] = useState<string | null>(null);

  // Barkod tarandığında veya girildiğinde çalışacak fonksiyon
  const handleBarcodeScanned = async (barcode: string) => {
    setErrorNotice(null);
    setUnfoundBarcode(null);
    setIsLoadingProduct(true);

    try {
      const res = await fetch(`/api/products/search?barcode=${encodeURIComponent(barcode)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ürün sorgulanamadı.");
      }

      if (data.exists && data.product) {
        const prod = data.product;

        // Sepete ekle veya miktarı 1 artır
        setCart((prevCart) => {
          const existingIndex = prevCart.findIndex((item) => item.productId === prod.id);

          if (existingIndex > -1) {
            const updated = [...prevCart];
            const currentQty = updated[existingIndex].quantity;

            // Stok kontrolü uyarısı
            if (currentQty + 1 > prod.stock) {
              setErrorNotice(
                `Dikkat: "${prod.name}" için mevcut stok (${prod.stock} adet) aşıldı.`
              );
            }

            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: currentQty + 1,
            };
            return updated;
          } else {
            return [
              ...prevCart,
              {
                productId: prod.id,
                barcode: prod.barcode,
                name: prod.name,
                salePrice: prod.salePrice,
                purchasePrice: prod.purchasePrice,
                stock: prod.stock,
                quantity: 1,
                imageUrl: prod.imageUrl,
              },
            ];
          }
        });
      } else {
        // Ürün veritabanında yok! Esnafa ekleme sayfasına gitmesi için bildirim ver
        setUnfoundBarcode(barcode);
        setErrorNotice(
          `Barkod (${barcode}) veritabanında bulunamadı. İnternetten fiyat araştırıp yeni ürün olarak ekleyebilirsiniz.`
        );
      }
    } catch (err: any) {
      console.error(err);
      setErrorNotice(err.message || "Barkod işlenirken hata oluştu.");
    } finally {
      setIsLoadingProduct(false);
    }
  };

  // Miktar artırma
  const incrementQuantity = (productId: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Miktar azaltma
  const decrementQuantity = (productId: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Sepetten silme
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Sepeti boşalt
  const clearCart = () => {
    setCart([]);
    setErrorNotice(null);
    setUnfoundBarcode(null);
  };

  // Toplam Tutar ve Toplam Kâr
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.salePrice * item.quantity,
    0
  );

  const totalProfit = cart.reduce(
    (sum, item) => sum + (item.salePrice - item.purchasePrice) * item.quantity,
    0
  );

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // SATIŞI TAMAMLA (Prisma Transaction API Çağrısı)
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    setIsSubmittingSale(true);
    setErrorNotice(null);

    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          salePrice: item.salePrice,
        })),
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Satış tamamlanamadı.");
      }

      // Başarılı satış
      setLastCompletedSale({
        id: data.sale.id,
        totalAmount: data.sale.totalAmount,
        totalProfit: data.sale.totalProfit,
        itemsCount: totalItemsCount,
      });

      // Sepeti temizle
      setCart([]);
    } catch (err: any) {
      console.error(err);
      setErrorNotice(err.message || "Satış kaydedilirken hata oluştu.");
    } finally {
      setIsSubmittingSale(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Hızlı Satış & Kasa</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              POS
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Kamera veya barkod tabancası ile peş peşe okutun, anında sepete ekleyin
          </p>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="self-start sm:self-auto text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            Sepeti Temizle
          </button>
        )}
      </div>

      {/* 1. BARKOD OKUYUCU BİLEŞENİ */}
      <BarcodeScanner onScan={handleBarcodeScanned} />

      {/* Yükleniyor Göstergesi */}
      {isLoadingProduct && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Barkod sorgulanıyor ve sepete işleniyor...</span>
        </div>
      )}

      {/* Hata / Bilgilendirme Bildirimi */}
      {errorNotice && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
            <span>{errorNotice}</span>
          </div>
          {unfoundBarcode && (
            <Link
              href={`/urun-ara?barcode=${encodeURIComponent(unfoundBarcode)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition flex-shrink-0 self-start sm:self-auto"
            >
              <span>İnternette Ara & Ekle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* BAŞARILI SATIŞ KUTUSU */}
      {lastCompletedSale && (
        <div className="p-5 rounded-3xl bg-emerald-500/15 border border-emerald-500/40 text-white shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500 text-slate-950 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Satış Başarıyla Tamamlandı!
                </h3>
                <p className="text-xs text-emerald-300/80">
                  Fiş No: #{lastCompletedSale.id.slice(-6)} • {lastCompletedSale.itemsCount} Ürün
                </p>
              </div>
            </div>
            <button
              onClick={() => setLastCompletedSale(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Kapat
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-500/20 grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-slate-300">Tahsil Edilen Tutar</span>
              <p className="text-2xl font-black text-white">
                ₺{lastCompletedSale.totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-300">Elde Edilen Net Kâr</span>
              <p className="text-2xl font-black text-emerald-400">
                +₺{lastCompletedSale.totalProfit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. SEPET VE ÖZET ALANI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SEPET ÜRÜN LİSTESİ (2 Kolon) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <span>Sepetteki Ürünler</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {cart.length} Kalem
              </span>
            </h2>
          </div>

          {cart.length === 0 ? (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-bold text-white">Sepetiniz Boş</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Ürün eklemek için yukarıdaki kamerayı açın, barkod tabancasını okutun veya barkod numarasını yazın.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cart.map((item) => {
                const lineTotal = item.salePrice * item.quantity;
                const lineProfit = (item.salePrice - item.purchasePrice) * item.quantity;

                return (
                  <div
                    key={item.productId}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md transition"
                  >
                    {/* Ürün Bilgisi */}
                    <div className="flex items-center gap-3 min-w-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {item.barcode} • Stok: {item.stock}
                        </p>
                        <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                          ₺{item.salePrice.toFixed(2)} / adet
                        </p>
                      </div>
                    </div>

                    {/* Miktar Kontrolleri ve Satır Tutarı */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/80">
                      {/* +/- Butonları (Kasada tek elle rahat tıklanabilir) */}
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => decrementQuantity(item.productId)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white active:scale-95 transition cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => incrementQuantity(item.productId)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white active:scale-95 transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Tutar & Sil */}
                      <div className="text-right min-w-[85px]">
                        <p className="text-base font-black text-white">
                          ₺{lineTotal.toFixed(2)}
                        </p>
                        <p className="text-[11px] font-semibold text-emerald-400">
                          +₺{lineProfit.toFixed(2)} kâr
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        title="Ürünü Çıkar"
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SATIŞ ÖZETİ VE TAMAMLAMA KARTI (1 Kolon) */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl sticky top-20 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <span>Kasa Satış Özeti</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span>Toplam Kalem Çeşidi</span>
                <span className="font-semibold text-white">{cart.length} Kalem</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Toplam Ürün Adedi</span>
                <span className="font-semibold text-white">{totalItemsCount} Adet</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Tahmini Net Kâr</span>
                <span className="font-semibold text-emerald-400">
                  +₺{totalProfit.toFixed(2)}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-baseline justify-between">
                <span className="text-base font-bold text-white">Genel Toplam</span>
                <span className="text-3xl font-black text-white tracking-tight text-emerald-400">
                  ₺{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* SATIŞI TAMAMLA BÜYÜK BUTONU */}
            <button
              type="button"
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || isSubmittingSale}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-lg transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2.5"
            >
              {isSubmittingSale ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>İşleniyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Satışı Tamamla</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-400 leading-tight">
              "Satışı Tamamla" butonuna basıldığında stoklar otomatik düşer ve kâr/zarar raporuna işlenir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
