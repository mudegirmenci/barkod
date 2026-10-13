"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  RefreshCw,
  Volume2,
  VolumeX,
  Keyboard,
  Smartphone,
  Maximize2,
  Minimize2,
  SwitchCamera,
  X,
  Zap,
} from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  autoCloseOnScan?: boolean;
  buttonLabel?: string;
}

export default function BarcodeScanner({
  onScan,
  autoCloseOnScan = false,
  buttonLabel = "Telefon Kamerası ile Barkod Oku",
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isFullScreenModal, setIsFullScreenModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualInput, setManualInput] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "html5-barcode-scanner-box";

  // Bip sesi çalma (barkod okunduğunda kasada esnafa net sesli geri bildirim)
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1850, audioCtx.currentTime); // 1.85 kHz kasa bipi
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
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
    setLastScannedBarcode(trimmed);
    playBeep();
    onScan(trimmed);

    if (autoCloseOnScan) {
      stopScanner();
      setIsFullScreenModal(false);
    }
  };

  const startScanner = async (targetFacingMode = facingMode) => {
    setErrorMessage(null);
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

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
        { facingMode: targetFacingMode },
        {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleBarcodeDetected(decodedText);
        },
        () => {
          // Tarama döngüsü
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error("Kamera başlatılamadı:", err);
      setErrorMessage(
        "Kamera açılamadı. Lütfen telefon tarayıcınızdan kamera izni verdiğinizden emin olun (HTTPS veya localhost gereklidir)."
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Kamera durdurulurken hata:", err);
      }
    }
    setIsScanning(false);
  };

  const toggleCameraFacing = async () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    if (isScanning) {
      await startScanner(nextMode);
    }
  };

  const openMobileCameraModal = () => {
    setIsFullScreenModal(true);
    setTimeout(() => {
      startScanner();
    }, 150);
  };

  const closeMobileCameraModal = () => {
    stopScanner();
    setIsFullScreenModal(false);
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
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        {/* MOBİL VE MASAÜSTÜ İÇİN BÜYÜK KAMERA AÇMA BUTONLARI */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* 1. Telefon Kamerası Butonu */}
            <button
              type="button"
              onClick={isScanning ? stopScanner : () => startScanner()}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                isScanning
                  ? "bg-rose-500 hover:bg-rose-600 text-white"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
              }`}
            >
              {isScanning ? (
                <>
                  <CameraOff className="w-4 h-4" />
                  <span>Kamerayı Kapat</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-5 h-5" />
                  <span>{buttonLabel}</span>
                </>
              )}
            </button>

            {/* Kamera Yönü Değiştir (Ön / Arka) */}
            {isScanning && (
              <button
                type="button"
                onClick={toggleCameraFacing}
                title="Kamerayı Değiştir (Ön/Arka)"
                className="p-3 rounded-2xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition cursor-pointer active:scale-95"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}

            {/* Ses Aç/Kapa */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Sesi Kapat" : "Sesi Aç"}
              className="p-3 rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer active:scale-95"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-400">
            <span className="hidden sm:inline-block">
              {facingMode === "environment" ? "📷 Arka Kamera Aktif" : "🤳 Ön Kamera Aktif"}
            </span>
          </div>
        </div>

        {/* KAMERA VİEWPORT ALANI (İç içe gömülü) */}
        <div
          className={`relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 transition-all ${
            isScanning ? "block min-h-[290px]" : "hidden"
          }`}
        >
          <div id={scannerContainerId} className="w-full" />
          {isScanning && (
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="bg-slate-900/90 text-emerald-400 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Telefon Kamerası Barkod Arıyor
              </span>

              {lastScannedBarcode && (
                <span className="bg-emerald-500 text-slate-950 text-[11px] font-black px-2.5 py-1 rounded-full shadow-lg">
                  Okundu: {lastScannedBarcode}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hata Bildirimi */}
        {errorMessage && (
          <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => startScanner()}
              className="flex items-center gap-1 text-rose-400 font-bold hover:underline ml-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Tekrar Dene
            </button>
          </div>
        )}

        {/* BARKOD TABANCASI / KLAVYE GİRİŞ ALANI */}
        <form onSubmit={handleManualSubmit} className="flex gap-2 pt-1">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Keyboard className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Barkod no yazın veya barkod tabancası ile okutun..."
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md active:scale-95 cursor-pointer flex-shrink-0"
          >
            Okut / Bul
          </button>
        </form>
      </div>
    </>
  );
}
