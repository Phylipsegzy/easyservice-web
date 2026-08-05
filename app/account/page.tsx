"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useLanguage } from "@/lib/i18n";
import { enablePush, disablePush, getPushPermissionState, isPushSubscribed } from "@/lib/push";
import { Bell, BellOff } from "lucide-react";

export default function AccountPage() {
  const { lang, setLang } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingLang, setSavingLang] = useState(false);

  const [pushState, setPushState] = useState<NotificationPermission | "unsupported">("default");
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");

  useEffect(() => {
    getPushPermissionState().then(setPushState);
    isPushSubscribed().then(setPushSubscribed);
    api.me().then((res) => setProfile(res.user)).catch(() => {});
    api.getAccountStats().then((res) => setStats(res.stats)).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await api.changeOwnPassword(currentPassword, password);
      setSuccess("Password updated.");
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLanguageChange(next: "en" | "ar") {
    setSavingLang(true);
    setLang(next); // apply immediately (RTL flips right away)
    try {
      await api.changeLanguage(next);
    } catch {
      // language still applied locally even if the save fails silently
    } finally {
      setSavingLang(false);
    }
  }

  async function handleEnablePush() {
    setPushBusy(true);
    setPushError("");
    const res = await enablePush();
    if (res.ok) {
      setPushState("granted");
      setPushSubscribed(true);
    } else {
      setPushError(res.error || "Could not enable push notifications.");
      setPushState(await getPushPermissionState());
      setPushSubscribed(await isPushSubscribed());
    }
    setPushBusy(false);
  }

  async function handleDisablePush() {
    setPushBusy(true);
    await disablePush();
    setPushState(await getPushPermissionState());
    setPushSubscribed(await isPushSubscribed());
    setPushBusy(false);
  }

  return (
    <AppShell title="My Account" subtitle="Preferences and password">
      {profile && (
        <div className="card max-w-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {profile.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <div className="font-semibold text-slate-900">{profile.name}</div>
              <div className="text-xs text-slate-400">@{profile.username}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Role</div>
              <div className="font-medium capitalize">{profile.role}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Country</div>
              <div className="font-medium">{profile.location || "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Email</div>
              <div className="font-medium truncate">{profile.email || "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Wallet balance</div>
              <div className="font-medium">{Number(profile.wallet || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3 max-w-sm mb-6">
          <div className="stat-card">
            <div className="stat-label">Invoices generated</div>
            <div className="stat-value">{stats.total_generated}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">This month</div>
            <div className="stat-value">{stats.this_month_generated}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total amount sent</div>
            <div className="stat-value">{Number(stats.total_amount_sent).toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Transfers awaiting you</div>
            <div className="stat-value">{stats.pending_transfers_for_me}</div>
          </div>
        </div>
      )}

      <div className="card max-w-sm mb-6">
        <label className="label">Language / اللغة</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleLanguageChange("en")}
            disabled={savingLang}
            className={lang === "en" ? "btn" : "btn-outline"}
          >
            English
          </button>
          <button
            onClick={() => handleLanguageChange("ar")}
            disabled={savingLang}
            className={lang === "ar" ? "btn" : "btn-outline"}
          >
            العربية
          </button>
        </div>
      </div>

      <div className="card max-w-sm mb-6">
        <label className="label">Push notifications</label>
        {pushState === "unsupported" ? (
          <p className="text-sm text-slate-400">Not supported on this browser/device.</p>
        ) : pushState === "denied" ? (
          <p className="text-sm text-slate-400">
            Blocked in your browser settings. Enable notifications for this site in your browser to turn this back on.
          </p>
        ) : pushSubscribed ? (
          <div>
            <p className="text-sm text-emerald-600 flex items-center gap-1.5 mb-3">
              <Bell size={15} /> Enabled on this device
            </p>
            <button onClick={handleDisablePush} disabled={pushBusy} className="btn-outline flex items-center gap-1.5">
              <BellOff size={15} /> {pushBusy ? "..." : "Turn off"}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-500 mb-3">
              Get notified even when EasyService isn't open — new invoices, transfers, and payment updates.
            </p>
            <button onClick={handleEnablePush} disabled={pushBusy} className="btn flex items-center gap-1.5">
              <Bell size={15} /> {pushBusy ? "Enabling..." : "Enable notifications"}
            </button>
          </div>
        )}
        {pushError && <p className="text-red-600 text-xs mt-2">{pushError}</p>}
      </div>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-4 max-w-sm">
        <div>
          <label className="label">Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="input w-full" />
        </div>
        <div>
          <label className="label">New password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="input w-full" />
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} className="input w-full" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-emerald-600 text-sm">{success}</p>}
        <button type="submit" disabled={submitting} className="btn">
          {submitting ? "Updating..." : "Update password"}
        </button>
      </form>
    </AppShell>
  );
}
