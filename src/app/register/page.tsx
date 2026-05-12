"use client";

import { useState, useEffect } from "react";
import { Camera } from "@/components/camera";
import { loadFaceApiModels, detectFace } from "@/lib/face-api-loader";

export default function RegisterPage() {
  const [modelsReady, setModelsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [step, setStep] = useState<"form" | "capture" | "done">("form");
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [loadingProgress, setLoadingProgress] = useState("Memuat model AI...");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        if (!cancelled) setLoadingProgress("Memuat model deteksi wajah...");
        await loadFaceApiModels();
        if (!cancelled) setModelsReady(true);
      } catch {
        if (!cancelled) {
          setResult({
            type: "error",
            message: "Gagal memuat model. Silakan refresh halaman.",
          });
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !studentId.trim()) return;
    setStep("capture");
    setResult(null);
  };

  const handleCapture = async (video: HTMLVideoElement) => {
    setIsProcessing(true);
    setResult(null);

    try {
      const descriptor = await detectFace(video);
      if (!descriptor) {
        setResult({
          type: "error",
          message: "Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.",
        });
        setIsProcessing(false);
        return;
      }

      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          studentId: studentId.trim(),
          faceDescriptor: Array.from(descriptor),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          type: "success",
          message: `${name} berhasil didaftarkan!`,
        });
        setStep("done");
      } else {
        setResult({ type: "error", message: data.error });
      }
    } catch {
      setResult({
        type: "error",
        message: "Terjadi kesalahan. Silakan coba lagi.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setName("");
    setStudentId("");
    setStep("form");
    setResult(null);
  };

  if (!modelsReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-muted text-sm">{loadingProgress}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">Pendaftaran Mahasiswa</h1>
        <p className="text-muted text-sm mt-1">
          {step === "form"
            ? "Isi data diri Anda"
            : step === "capture"
            ? "Ambil foto wajah Anda"
            : "Pendaftaran selesai"}
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {["Data", "Foto", "Selesai"].map((label, i) => {
          const stepIndex =
            step === "form" ? 0 : step === "capture" ? 1 : 2;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= stepIndex
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs ${
                  i <= stepIndex ? "text-primary font-medium" : "text-gray-400"
                }`}
              >
                {label}
              </span>
              {i < 2 && (
                <div
                  className={`w-8 h-0.5 ${
                    i < stepIndex ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {step === "form" && (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium mb-1.5"
            >
              Nama Lengkap
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              required
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label
              htmlFor="studentId"
              className="block text-sm font-medium mb-1.5"
            >
              NIM (Nomor Induk Mahasiswa)
            </label>
            <input
              id="studentId"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Masukkan NIM"
              required
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-primary text-white rounded-xl font-medium active:bg-primary-dark transition-colors"
          >
            Lanjut ke Foto Wajah
          </button>
        </form>
      )}

      {step === "capture" && (
        <div>
          <Camera onCapture={handleCapture} isProcessing={isProcessing} />
          {result && (
            <div
              className={`mt-4 rounded-xl p-4 text-center text-sm font-medium ${
                result.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {result.message}
            </div>
          )}
          <button
            onClick={() => setStep("form")}
            className="w-full mt-3 py-2.5 text-muted text-sm font-medium"
          >
            Kembali
          </button>
        </div>
      )}

      {step === "done" && result?.type === "success" && (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-success">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-success">Berhasil!</p>
            <p className="text-muted text-sm mt-1">{result.message}</p>
          </div>
          <button
            onClick={handleReset}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium active:bg-primary-dark transition-colors"
          >
            Daftarkan Mahasiswa Lain
          </button>
        </div>
      )}
    </div>
  );
}
