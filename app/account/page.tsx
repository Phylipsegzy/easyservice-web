"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useLanguage } from "@/lib/i18n";
import { enablePush, disablePush, getPushPermissionState, isPushSubscribed } from "@/lib/push";
import { isPlatformAuthenticatorAvailable, createCredential } from "@/lib/webauthn";
import { Bell, BellOff, Fingerprint, Trash2 } from "lucide-react";

export default function AccountPage() {
  const { lang, setLang, t } = useLanguage();
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

  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricCredentials, setBiometricCredentials] = useState<any[]>([]);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [biometricError, setBiometricError] = useState("");

  function loadBiometricCredentials() {
    api.webauthnCredentials().then((res) => setBiometricCredentials(res.credentials)).catch(() => {});
  }

  useEffect(() => {
    getPushPermissionState().then(setPushState);
    isPushSubscribed().then(setPushSubscribed);
    api.me().then((res) => setProfile(res.user)).catch(() => {});
    api.getAccountStats().then((res) => setStats(res.stats)).catch(() => {});
    isPlatformAuthenticatorAvailable().then(setBiometricSupported);
    loadBiometricCredentials();
  }, []);

  async function handleEnableBiometric() {
    setBiometricError("");
    setBiometricBusy(true);
    try {
      const optionsRes = await api.webauthnRegisterOptions();
      const credential = await createCredential(optionsRes.options);
      const deviceName = /iphone|ipad/i.test(navigator.userAgent)
        ? "iPhone/iPad"
        : /android/i.test(navigator.userAgent)
        ? "Android device"
        : "This device";
      await api.webauthnRegister(credential, deviceName);
      loadBiometricCredentials();
    } catch (err: any) {
      if (err?.name !== "NotAllowedError") {
        setBiometricError(err.message || "Couldn't enable biometric login on this device.");
      }
    } finally {
      setBiometricBusy(false);
    }
  }

  async function handleRemoveBiometric(id: number) {
    if (!window.confirm("Turn off biometric login for this device?")) return;
    await api.webauthnDeleteCredential(id);
    loadBiometricCredentials();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirm) {
      setError(t("passwords_no_match"));
      return;
    }
    setSubmitting(true);
    try {
      await api.changeOwnPassword(currentPassword, password);
      setSuccess(t("password_updated"));
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
    <AppShell title={t("my_account")} subtitle={t("account_subtitle")}>
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
              <div className="text-[11px] font-semibold uppercase text-slate-400">{t("role")}</div>
              <div className="font-medium capitalize">{profile.role}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">{t("country")}</div>
              <div className="font-medium">{profile.location || "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">{t("email")}</div>
              <div className="font-medium truncate">{profile.email || "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">{t("wallet_balance")}</div>
              <div className="font-medium">{Number(profile.wallet || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3 max-w-sm mb-6">
          <div className="stat-card">
            <div className="stat-label">{t("invoices_generated")}</div>
            <div className="stat-value">{stats.total_generated}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t("this_month")}</div>
            <div className="stat-value">{stats.this_month_generated}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t("total_amount_sent")}</div>
            <div className="stat-value">{Number(stats.total_amount_sent).toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t("transfers_awaiting_you")}</div>
            <div className="stat-value">{stats.pending_transfers_for_me}</div>
          </div>
        </div>
      )}

      <div className="card max-w-sm mb-6">
        <label className="label">{t("language_label")} / اللغة</label>
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
        <label className="label">{t("push_notifications")}</label>
        {pushState === "unsupported" ? (
          <p className="text-sm text-slate-400">{t("push_unsupported")}</p>
        ) : pushState === "denied" ? (
          <p className="text-sm text-slate-400">
            {t("push_denied")}
          </p>
        ) : pushSubscribed ? (
          <div>
            <p className="text-sm text-emerald-600 flex items-center gap-1.5 mb-3">
              <Bell size={15} /> {t("push_enabled_device")}
            </p>
            <button onClick={handleDisablePush} disabled={pushBusy} className="btn-outline flex items-center gap-1.5">
              <BellOff size={15} /> {pushBusy ? "..." : t("turn_off")}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-500 mb-3">
              {t("push_promo")}
            </p>
            <button onClick={handleEnablePush} disabled={pushBusy} className="btn flex items-center gap-1.5">
              <Bell size={15} /> {pushBusy ? t("enabling") : t("enable_notifications")}
            </button>
          </div>
        )}
        {pushError && <p className="text-red-600 text-xs mt-2">{pushError}</p>}
      </div>

      <div className="card max-w-sm mb-6">
        <label className="label">App lock</label>
        {!biometricSupported ? (
          <p className="text-sm text-slate-400">Not available on this device/browser.</p>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-3">
              Once enabled, returning to EasyService on this device after a short while away will
              ask for Face ID, Touch ID, or your fingerprint before showing anything — with your
              password as a fallback if that ever fails. This only applies to this specific device —
              enable it separately on any other device you use.
            </p>
            <button onClick={handleEnableBiometric} disabled={biometricBusy} className="btn flex items-center gap-1.5 mb-3">
              <Fingerprint size={15} /> {biometricBusy ? "..." : "Enable on this device"}
            </button>
            {biometricError && <p className="text-red-600 text-xs mb-3">{biometricError}</p>}

            {biometricCredentials.length > 0 && (
              <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold uppercase text-slate-400">Enabled devices</p>
                {biometricCredentials.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{c.device_name || "Unnamed device"}</span>
                      <span className="text-xs text-slate-400 block">
                        {c.last_used_at ? `Last used ${new Date(c.last_used_at).toLocaleDateString()}` : "Never used yet"}
                      </span>
                    </div>
                    <button onClick={() => handleRemoveBiometric(c.id)} className="text-slate-400 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-4 max-w-sm">
        <div>
          <label className="label">{t("current_password")}</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="input w-full" />
        </div>
        <div>
          <label className="label">{t("new_password")}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="input w-full" />
        </div>
        <div>
          <label className="label">{t("confirm_new_password")}</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} className="input w-full" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-emerald-600 text-sm">{success}</p>}
        <button type="submit" disabled={submitting} className="btn">
          {submitting ? t("updating") : t("update_password")}
        </button>
      </form>
    </AppShell>
  );
}
