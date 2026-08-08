"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { isPlatformAuthenticatorAvailable, getCredential } from "@/lib/webauthn";
import { Fingerprint } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { lang, dir, setLang, t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [platformSupported, setPlatformSupported] = useState(false);

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setPlatformSupported);
  }, []);

  // Debounced check — once someone's typed a plausible username, ask the
  // server (harmlessly, no auth needed) whether THIS device has biometric
  // login enabled for THAT account. Empty result for an unknown username is
  // deliberate — never reveals whether an account exists.
  useEffect(() => {
    if (!platformSupported || username.trim().length < 2) {
      setBiometricAvailable(false);
      return;
    }
    const timer = setTimeout(() => {
      api.webauthnAvailable(username.trim()).then((res) => setBiometricAvailable(res.available)).catch(() => setBiometricAvailable(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [username, platformSupported]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.login(username, password);
      setToken(res.token);
      localStorage.setItem("easyservice_user", JSON.stringify(res.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || t("login_failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometricLogin() {
    setError("");
    setBiometricLoading(true);
    try {
      const optionsRes = await api.webauthnLoginOptions(username.trim());
      const credential = await getCredential(optionsRes.options);
      const res = await api.webauthnLogin(credential);
      setToken(res.token);
      localStorage.setItem("easyservice_user", JSON.stringify(res.user));
      router.push("/dashboard");
    } catch (err: any) {
      // A cancelled/failed biometric prompt shouldn't look like a scary error —
      // they can just try again or use their password instead.
      if (err?.name === "NotAllowedError") {
        setError("");
      } else {
        setError(err.message || "Biometric sign-in failed — try your password instead.");
      }
    } finally {
      setBiometricLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4" dir={dir}>
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-3">
          <div className="flex gap-1 bg-white rounded-full border border-slate-200 p-0.5">
            {(["en", "ar"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${lang === l ? "bg-teal-600 text-white" : "text-slate-500"}`}
              >
                {l === "en" ? "EN" : "AR"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-teal-200">ES</div>
          <h1 className="text-xl font-bold text-slate-900">EasyService</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("sign_in_subtitle")}</p>
        </div>
        <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
          <div>
            <label className="label">{t("username")}</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input w-full"
              autoCapitalize="none"
              required
            />
          </div>
          <div>
            <label className="label">{t("password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn w-full mt-1 py-3">
            {loading ? t("logging_in") : t("log_in")}
          </button>
          {biometricAvailable && (
            <button
              type="button"
              onClick={handleBiometricLogin}
              disabled={biometricLoading}
              className="btn-outline w-full flex items-center justify-center gap-2 py-3"
            >
              <Fingerprint size={18} />
              {biometricLoading ? "..." : "Sign in with Face ID / Fingerprint"}
            </button>
          )}
        </form>
        <p className="text-center text-sm text-slate-400 mt-4">
          {t("tracking_transfer")} <a href="/track" className="text-teal-600 font-semibold no-underline">{t("check_status")}</a>
        </p>
      </div>
    </div>
  );
}
