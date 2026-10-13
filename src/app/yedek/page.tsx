"use client";

import { useState, useRef } from "react";
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  RefreshCw,
  HardDrive,
  ShieldAlert,
  ArrowRight,
  Boxes,
  Receipt,
  Layers,
} from "lucide-react";

export default function BackupRestorePage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<{
    totalProducts: number;
    totalSales: number;
    exportedAt?: string;
    app?: string;
  } | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Veritabanı Yedeğini İndir
  const handleDownloadBackup = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Yedek dosyası oluşturulamadı.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `esnafpos-veritabani-yedek-${today}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMessage({
        type: "success",
        text: "Veritabanı yedeği (.json) başarıyla indirildi. Dosyayı güvenli bir yerde saklayabilir veya başka bir cihaza yükleyebilirsiniz.",
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: err.message || "Yedek indirilirken bir hata meydana geldi.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Dosya Seçildiğinde İnceleme
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatusMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        let productsCount = 0;
        let salesCount = 0;

        if (Array.isArray(json)) {
          productsCount = json.length;
        } else if (json && typeof json === "object") {
          if (Array.isArray(json.products)) productsCount = json.products.length;
          if (Array.isArray(json.sales)) salesCount = json.sales.length;
        }

        setFilePreview({
          totalProducts: productsCount,
          totalSales: salesCount,
          exportedAt: json.exportedAt,
          app: json.app || "Bilinmeyen / Dış Kaynak",
        });
      } catch (err) {
        setStatusMessage({
          type: "error",
          text: "Seçilen dosya geçerli bir JSON formatında değil.",
        });
        setSelectedFile(null);
        setFilePreview(null);
      }
    };
    reader.readAsText(file);
  };

  // 2. Yedeği Geri Yükle
  const handleRestoreBackup = async () => {
    if (!selectedFile) {
      setStatusMessage({
        type: "error",
        text: "Lütfen önce yüklenecek bir JSON yedek dosyası seçin.",
      });
      return;
    }

    if (
      importMode === "replace" &&
      !confirm(
        "DİKKAT: Sıfırdan yükleme seçildi. Mevcut tüm ürün ve satış verileriniz silinip yedek dosyasındakiler yüklenecek. Devam etmek istiyor musunuz?"
      )
    ) {
      return;
    }

    setIsImporting(true);
    setStatusMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonContent = JSON.parse(event.target?.result as string);

          const res = await fetch("/api/backup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: importMode,
              backupData: jsonContent,
            }),
          });

          const result = await res.json();

          if (!res.ok) {
            throw new Error(result.error || "Geri yükleme başarısız oldu.");
          }

          setStatusMessage({
            type: "success",
            text: result.message,
          });

          // Formu sıfırla
          setSelectedFile(null);
          setFilePreview(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err: any) {
          setStatusMessage({
            type: "error",
            text: err.message || "Yedek işlenirken hata oluştu.",
          });
        } finally {
          setIsImporting(false);
        }
      };

      reader.readAsText(selectedFile);
    } catch (err: any) {
      setIsImporting(false);
      setStatusMessage({
        type: "error",
        text: err.message || "Dosya okunamadı.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Database className="w-7 h-7 text-emerald-400" />
          <span>Veritabanı Yedekleme & Geri Yükleme</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Verilerinizi tek tıkla cihazınıza indirin veya başka bir kullanıcının/cihazın yedeğini sisteme yükleyin
        </p>
      </div>

      {/* Durum Mesajı */}
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
          <span className="leading-relaxed">{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KART 1: YEDEK İNDİR (EXPORT) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                Veritabanını İndir (Yedek Al)
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Tüm kayıtlı ürünlerinizi, barkodlarını, alış & satış fiyatlarını, stok adetlerini ve geçmiş satış fişlerinizi tek bir JSON dosyasında bilgisayarınıza veya telefonunuza indirin.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ürünler, fiyatlar ve stok miktarları dahil</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Geçmiş satışlar ve kâr/zarar raporları dahil</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Standart JSON formatı ile başka programlara da aktarılabilir</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={isExporting}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2.5"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Yedek Hazırlanıyor...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Yedek Dosyasını İndir (.json)</span>
              </>
            )}
          </button>
        </div>

        {/* KART 2: YEDEĞİ GERİ YÜKLE (IMPORT) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                Yedeği Geri Yükle (Veritabanı Yükle)
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Daha önce aldığınız bir yedeği veya başka bir kullanıcının paylaştığı ürün listesi veritabanını sisteme kolayca yükleyin.
              </p>
            </div>
          </div>

          {/* Dosya Seçim Alanı */}
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              id="backup-file-input"
            />
            <label
              htmlFor="backup-file-input"
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 text-center block cursor-pointer bg-slate-950/50 transition active:scale-[0.99]"
            >
              <FileJson className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">
                {selectedFile ? selectedFile.name : "Bir .json Yedek Dosyası Seçin"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Dosyayı seçmek için buraya dokunun veya tıklayın
              </p>
            </label>

            {/* Dosya Önizlemesi */}
            {filePreview && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                <span className="font-bold text-emerald-300 block">
                  Dosya İçeriği Doğrulandı:
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-emerald-400" />
                    <span>Ürün Sayısı: <strong>{filePreview.totalProducts}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Satış Fişi: <strong>{filePreview.totalSales}</strong></span>
                  </div>
                </div>
                {filePreview.exportedAt && (
                  <p className="text-[11px] text-slate-400">
                    Oluşturulma: {new Date(filePreview.exportedAt).toLocaleString("tr-TR")}
                  </p>
                )}
              </div>
            )}

            {/* Geri Yükleme Modu Seçimi */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-slate-400 block">
                Yükleme Seçeneği:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode("merge")}
                  className={`p-3 rounded-2xl border text-left text-xs transition cursor-pointer ${
                    importMode === "merge"
                      ? "bg-emerald-500/20 border-emerald-500 text-white font-bold"
                      : "bg-slate-950/60 border-slate-800 text-slate-400"
                  }`}
                >
                  <span className="block font-bold">1. Birleştir & Güncelle</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Mevcut ürünleri korur, yeni olanları ekler (Tavsiye)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode("replace")}
                  className={`p-3 rounded-2xl border text-left text-xs transition cursor-pointer ${
                    importMode === "replace"
                      ? "bg-rose-500/20 border-rose-500 text-white font-bold"
                      : "bg-slate-950/60 border-slate-800 text-slate-400"
                  }`}
                >
                  <span className="block font-bold text-rose-300">2. Sıfırla & Yükle</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Mevcut veritabanını temizler, yedeği yükler
                  </span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRestoreBackup}
            disabled={!selectedFile || isImporting}
            className="w-full py-4 px-6 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-base transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2.5"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Veritabanına Aktarılıyor...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Yedeği Sisteme Yükle</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
