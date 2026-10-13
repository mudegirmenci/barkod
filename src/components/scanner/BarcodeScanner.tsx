"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, CameraOff, RefreshCw, Volume2, VolumeX, Keyboard } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  autoCloseOnScan?: boolean;
}

export default function BarcodeScanner({
  onScan,
  autoCloseOnScan = false,
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualInput, setManualInput] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "html5-barcode-scanner";

  // Bip sesi çalma (barkod okunduğunda kasada esnafa net sesli geri bildirim)
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, audioCtx.currentTime); // 1.8 kHz net kasa bipi
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext engellendiyse sessizce geç
    }
  };

  const handleBarcodeDetected = (decodedText: string) => {
    const trimmed = decodedText.trim();
    if (!trimmed) return;
    playBeep();
    onScan(trimmed);
    if (autoCloseOnScan) {
      stopScanner();
    }
  };

  const startScanner = async () => {
    setErrorMessage(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
      }

      await scannerRef.current.start(
        { facingMode: "environment" }, // Arka kamera
        {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleBarcodeDetected(decodedText);
        },
        () => {
          // Tarama devam ederkenki her kare - hata basmaya gerek yok
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error("Kamera başlatılamadı:", err);
      setErrorMessage(
        "Kamera açılamadı. Lütfen kamera izni verdiğinizden ve HTTPS kullandığınızdan emin olun."
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Kamera durdurulurken hata:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleBarcodeDetected(manualInput.trim());
      setManualInput("");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
      {/* Üst Butonlar ve Kontroller */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={isScanning ? stopScanner : startScanner}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer ${
              isScanning
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
            }`}
          >
            {isScanning ? (
              <>
                <CameraOff className="w-4 h-4" />
                <span>Kamerayı Kapat</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Kamerayla Barkod Oku</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Sesi Kapat" : "Sesi Aç"}
            className="p-2.5 rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
          Barkod Tabancası & Kamera Uyumlu
        </span>
      </div>

      {/* Kamera Tarama Alanı */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 transition-all ${
          isScanning ? "block min-h-[280px]" : "hidden"
        }`}
      >
        <div id={scannerContainerId} className="w-full" />
        {isScanning && (
          <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
            <span className="inline-block bg-slate-900/90 text-emerald-400 text-xs px-3 py-1 rounded-full border border-emerald-500/30">
              Barkodu kırmızı/yeşil çerçeveye hizalayın
            </span>
          </div>
        )}
      </div>

      {/* Hata Mesajı */}
      {errorMessage && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={startScanner}
            className="flex items-center gap-1 text-rose-300 font-medium hover:underline ml-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tekrar Dene
          </button>
        </div>
      )}

      {/* Barkod Tabancası / Klavye ile Hızlı Giriş */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Keyboard className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Barkod numarasını yazın veya tabancayla okutun..."
            className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl text-sm transition-all shadow-md active:scale-95 cursor-pointer flex-shrink-0"
        >
          Okut / Ekle
        </button>
      </form>
    </div>
  );
}
