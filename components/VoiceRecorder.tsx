"use client";

import { useRef, useState } from "react";
import { Mic, Square, Trash2, Play, Pause } from "lucide-react";

export default function VoiceRecorder({
  onRecorded,
}: {
  onRecorded: (blob: File | null) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType === "audio/webm" ? "webm" : "m4a";
        const file = new File([blob], `voice-note.${ext}`, { type: mimeType });
        setPreviewUrl(URL.createObjectURL(blob));
        onRecorded(file);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Couldn't access the microphone — check your browser's permission for this site.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function discard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSeconds(0);
    onRecorded(null);
  }

  function togglePlayback() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div>
      <label className="label">Voice note</label>
      {error && <p className="text-red-600 text-xs mb-1">{error}</p>}

      {previewUrl ? (
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
          <button
            type="button"
            onClick={togglePlayback}
            className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0"
          >
            {playing ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
          </button>
          <audio
            ref={audioRef}
            src={previewUrl}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            className="hidden"
          />
          <span className="text-xs text-slate-500">{formatTime(seconds)} recorded</span>
          <button type="button" onClick={discard} className="ml-auto text-slate-400 hover:text-red-600">
            <Trash2 size={14} />
          </button>
        </div>
      ) : recording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium"
        >
          <Square size={13} className="fill-current" /> Stop ({formatTime(seconds)})
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 btn-ghost text-sm"
        >
          <Mic size={15} /> Record voice note
        </button>
      )}
    </div>
  );
}
