"use client";

import { useEffect, useState, useRef } from "react";
import { api, getToken } from "@/lib/api";
import { unlockWithBiometric } from "@/lib/webauthn";
import { Fingerprint, Lock } from "lucide-react";

const GRACE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const LAST_UNLOCK_KEY = "es_lock_last_unlock";

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

export default function AppLock({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [checked, setChecked] = useState(false); // avoids a flash of content before the first check completes
  const [credentialIds, setCredentialIds] = useState<string[]>([]);
  const [unlocking, setUnlocking] = useState(false);
  const [showPasswordFallback, setShowPasswordFallback] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const attemptedAutoUnlock = useRef(false);

  function markUnlocked() {
    localStorage.setItem(LAST_UNLOCK_KEY, String(Date.now()));
    setLocked(false);
    setShowPasswordFallback(false);
    setPassword("");
    setError("");
  }

  async function checkLockState() {
    if (!isMobileDevice()) {
      // Desktop browsers don't have the same "someone else could pick this up"
      // threat model a phone does, and tab-switching (or even opening a file
      // picker, which also fires a visibility change) made this actively
      // disruptive there rather than protective.
      setLocked(false);
      setChecked(true);
      return;
    }

    if (!getToken()) {
      // Not logged in at all — nothing to lock, login page handles itself.
      setLocked(false);
      setChecked(true);
      return;
    }

    const lastUnlock = Number(localStorage.getItem(LAST_UNLOCK_KEY) || 0);
    if (Date.now() - lastUnlock < GRACE_WINDOW_MS) {
      setLocked(false);
      setChecked(true);
      return;
    }

    try {
      const res = await api.webauthnCredentials();
      const ids = (res.credentials || []).map((c: any) => c.credential_id).filter(Boolean);
      setCredentialIds(ids);
      // No biometric enabled on this device at all — nothing to lock with,
      // don't trap someone with no way to unlock.
      setLocked(ids.length > 0);
    } catch {
      setLocked(false);
    } finally {
      setChecked(true);
    }
  }

  useEffect(() => {
    checkLockState();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        attemptedAutoUnlock.current = false;
        checkLockState();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUnlockAttempt() {
    setError("");
    setUnlocking(true);
    try {
      const success = await unlockWithBiometric(credentialIds);
      if (success) {
        markUnlocked();
      } else {
        setShowPasswordFallback(true);
      }
    } finally {
      setUnlocking(false);
    }
  }

  // Try once automatically when the lock screen first appears — some
  // browsers/PWA contexts allow this without a tap; if not, the button
  // below still works as the real trigger.
  useEffect(() => {
    if (locked && checked && !attemptedAutoUnlock.current) {
      attemptedAutoUnlock.current = true;
      handleUnlockAttempt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, checked]);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setUnlocking(true);
    try {
      await api.verifyPassword(password);
      markUnlocked();
    } catch (err: any) {
      setError(err.message || "Incorrect password");
    } finally {
      setUnlocking(false);
    }
  }

  if (!checked) return null; // avoid a flash of real content before the first check resolves

  if (!locked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-teal-200">
          <Lock size={26} className="text-white" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 mb-1">EasyService is locked</h1>
        <p className="text-sm text-slate-500 mb-6">Verify it's you to continue</p>

        {!showPasswordFallback ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUnlockAttempt}
              disabled={unlocking}
              className="btn w-full py-3 flex items-center justify-center gap-2"
            >
              <Fingerprint size={18} /> {unlocking ? "Verifying..." : "Unlock with Face ID / Fingerprint"}
            </button>
            <button
              onClick={() => setShowPasswordFallback(true)}
              className="text-sm text-slate-400 underline"
            >
              Use password instead
            </button>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="card flex flex-col gap-3 text-left">
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                autoFocus
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={unlocking} className="btn w-full py-3">
              {unlocking ? "Checking..." : "Unlock"}
            </button>
            <button type="button" onClick={() => setShowPasswordFallback(false)} className="text-sm text-slate-400 underline">
              Try Face ID / Fingerprint instead
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
