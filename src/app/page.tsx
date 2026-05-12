"use client";

import { useState, useEffect } from "react";
import { Camera } from "@/components/camera";
import { loadFaceApiModels, detectFace, computeDistance } from "@/lib/face-api-loader";

interface StudentDescriptor {
  id: string;
  name: string;
  studentId: string;
  faceDescriptor: string;
}

const MATCH_THRESHOLD = 0.6;

export default function AttendancePage() {
  const [modelsReady, setModelsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [students, setStudents] = useState<StudentDescriptor[]>([]);
  const [result, setResult] = useState<{
    type: "success" | "error" | "warning";
    message: string;
    name?: string;
  } | null>(null);
  const [loadingProgress, setLoadingProgress] = useState("Memuat model AI...");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        if (!cancelled) setLoadingProgress("Memuat model deteksi wajah...");
        await loadFaceApiModels();
        if (!cancelled) setLoadingProgress("Mengambil data mahasiswa...");
        const res = await fetch("/api/students");
        const data = await res.json();
        if (!cancelled) {
          setStudents(data);
          setModelsReady(true);
        }
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

  const handleCapture = async (video: HTMLVideoElement) => {
    setIsProcessing(true);
    setResult(null);

    try {
      const descriptor = await detectFace(video);
      if (!descriptor) {
        setResult({
          type: "warning",
          message: "Wajah tidak terdeteksi. Pastikan wajah Anda terlihat jelas di kamera.",
        });
        setIsProcessing(false);
        return;
      }

      if (students.length === 0) {
        setResult({
          type: "error",
          message: "Belum ada mahasiswa terdaftar. Silakan daftar terlebih dahulu.",
        });
        setIsProcessing(false);
        return;
      }

      let bestMatch: { student: StudentDescriptor; distance: number } | null = null;

      for (const student of students) {
        const storedDescriptor = new Float32Array(
          JSON.parse(student.faceDescriptor)
        );
        const distance = computeDistance(descriptor, storedDescriptor);

        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = { student, distance };
        }
      }

      if (bestMatch && bestMatch.distance < MATCH_THRESHOLD) {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: bestMatch.student.id }),
        });

        const data = await res.json();

        if (res.status === 409) {
          setResult({
            type: "warning",
            message: data.error,
            name: bestMatch.student.name,
          });
        } else if (res.ok) {
          setResult({
            type: "success",
            message: "Absensi berhasil dicatat!",
            name: bestMatch.student.name,
          });
        } else {
          setResult({ type: "error", message: data.error });
        }
      } else {
        setResult({
          type: "error",
          message: "Wajah tidak dikenali. Pastikan Anda sudah mendaftar.",
        });
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
        <h1 className="text-xl font-bold">Absensi Wajah</h1>
        <p className="text-muted text-sm mt-1">
          Arahkan wajah Anda ke kamera, lalu tekan tombol
        </p>
      </div>

      <Camera onCapture={handleCapture} isProcessing={isProcessing}>
        {result && (
          <div
            className={`w-full max-w-sm rounded-xl p-4 text-center text-sm font-medium ${
              result.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : result.type === "warning"
                ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {result.name && (
              <p className="font-bold text-base mb-1">{result.name}</p>
            )}
            <p>{result.message}</p>
          </div>
        )}
      </Camera>
    </div>
  );
}
