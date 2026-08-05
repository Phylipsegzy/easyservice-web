"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-teal-200">ES</div>
          <h1 className="text-xl font-bold text-slate-900">EasyService</h1>
          <p className="text-sm text-slate-500 mt-0.5">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
          <div>
            <label className="label">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input w-full"
              autoCapitalize="none"
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
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
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-400 mt-4">
          Tracking a transfer? <a href="/track" className="text-teal-600 font-semibold no-underline">Check its status</a>
        </p>
      </div>
    </div>
  );
}
