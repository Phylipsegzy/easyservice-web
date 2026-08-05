"use client";

import { useState } from "react";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";

export default function DownloadPngButton({
  targetId,
  filename,
}: {
  targetId: string;
  filename: string;
}) {
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    const target = document.getElementById(targetId);
    if (!target) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      }, "image/png");
    } catch {
      alert("Could not generate the image. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button onClick={handleDownload} disabled={generating} className="btn flex items-center gap-2 justify-center">
      <Download size={16} /> {generating ? "Generating..." : "Download PNG"}
    </button>
  );
}
