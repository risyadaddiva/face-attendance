"use client";

import { useRef, useState, useEffect } from "react";

interface CameraProps {
  onCapture: (video: HTMLVideoElement) => void;
  isProcessing: boolean;
  children?: React.ReactNode;
}

export function Camera({ onCapture, isProcessing, children }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        streamRef.current = mediaStream;
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException) {
          if (err.name === "NotAllowedError") {
            setError("Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.");
          } else if (err.name === "NotFoundError") {
            setError("Kamera tidak ditemukan. Pastikan perangkat Anda memiliki kamera.");
          } else {
            setError(`Error kamera: ${err.message}`);
          }
        } else {
          setError("Gagal mengakses kamera. Silakan coba lagi.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    initCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      .then((mediaStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        streamRef.current = mediaStream;
        setIsLoading(false);
      })
      .catch(() => {
        setError("Gagal mengakses kamera. Silakan coba lagi.");
        setIsLoading(false);
      });
  };

  const handleCapture = () => {
    if (videoRef.current && !isProcessing) {
      onCapture(videoRef.current);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-2xl border border-red-200">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-danger mb-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <p className="text-danger text-center text-sm mb-4">{error}</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium active:bg-primary-dark transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-white/70 text-sm">Memuat kamera...</p>
            </div>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedData={() => setIsLoading(false)}
          className="w-full h-full object-cover -scale-x-100"
        />
        <div className="absolute inset-0 border-2 border-white/20 rounded-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/40 rounded-full pointer-events-none" />
      </div>

      {children}

      <button
        onClick={handleCapture}
        disabled={isProcessing || isLoading}
        className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
