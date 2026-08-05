"use client";

import { useEffect, useState } from "react";
import html2canvas from "html2canvas-pro";
import { Download, Share2 } from "lucide-react";

async function captureCanvas(targetId: string) {
  const target = document.getElementById(targetId);
  if (!target) throw new Error("Receipt not ready yet");
  return html2canvas(target, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not generate image"))), "image/png");
  });
}

export default function ReceiptActions({
  targetId,
  filename,
  shareTitle = "EasyService Receipt",
}: {
  targetId: string;
  filename: string;
  shareTitle?: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  // Starts false on both server and first client render (they must match), then
  // flips on after mount if the real browser supports it — same fix pattern as
  // the push-notification hydration issue.
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  async function handleDownload() {
    setDownloading(true);
    try {
      const canvas = await captureCanvas(targetId);
      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch {
      alert("Could not generate the image. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    setSharing(true);
    try {
      const canvas = await captureCanvas(targetId);
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: shareTitle });
      } else {
        // No file-sharing support — fall back to a plain download instead.
        await handleDownload();
      }
    } catch (err: any) {
      // AbortError just means the user cancelled the native share sheet — not a real error.
      if (err?.name !== "AbortError") alert("Could not share the receipt. Try downloading instead.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex gap-3">
      <button onClick={handleDownload} disabled={downloading} className="btn flex-1 flex items-center gap-2 justify-center">
        <Download size={16} /> {downloading ? "Generating..." : "Download"}
      </button>
      {canShare && (
        <button onClick={handleShare} disabled={sharing} className="btn-outline flex-1 flex items-center gap-2 justify-center">
          <Share2 size={16} /> {sharing ? "Preparing..." : "Share"}
        </button>
      )}
    </div>
  );
}
