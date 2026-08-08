"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import SearchInput from "@/components/SearchInput";
import CountrySearchSelect from "@/components/CountrySearchSelect";
import { useLanguage } from "@/lib/i18n";

export default function StaffPage() {
  const { t } = useLanguage();
  const [staff, setStaff] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState<any>(null); // null = create mode when creatingOpen
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [countryId, setCountryId] = useState("");
  const [chadRegionId, setChadRegionId] = useState("");
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [chadRegions, setChadRegions] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [resetTarget, setResetTarget] = useState<any>(null);
  const [resetPassword, setResetPassword] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [staffRes, rolesRes, currenciesRes, chadRegionsRes] = await Promise.all([
        api.getStaff(),
        api.getRoles(),
        api.getCurrencies(),
        api.getChadRegions(),
      ]);
      setStaff(staffRes.staff);
      setRoles(rolesRes.roles);
      setCurrencies(currenciesRes.currencies);
      setChadRegions(chadRegionsRes.chad_regions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setRoleId("");
    setCountryId("");
    setChadRegionId("");
    setCreatingOpen(true);
  }

  function openEdit(member: any) {
    setEditing(member);
    setName(member.name);
    setUsername(member.username);
    setEmail(member.email || "");
    setRoleId(String(member.role_id));
    const matchedCountry = currencies.find((c) => c.country?.toLowerCase() === member.location?.toLowerCase());
    setCountryId(matchedCountry ? String(matchedCountry.id) : "");
    setChadRegionId(member.chad_region || "");
    setCreatingOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const selectedCountry = currencies.find((c) => String(c.id) === countryId);
      const location = selectedCountry?.country || undefined;
      const chad_region = location?.toLowerCase() === "chad" ? (chadRegionId || undefined) : undefined;

      if (editing) {
        await api.updateStaff(editing.id, { name, email: email || undefined, role_id: Number(roleId), location, chad_region });
      } else {
        await api.createStaff({
          name,
          username,
          email: email || undefined,
          password,
          role_id: Number(roleId),
          location,
          chad_region,
        });
      }
      setCreatingOpen(false);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(member: any) {
    await api.updateStaff(member.id, { account_status: member.account_status === "active" ? "inactive" : "active" });
    load();
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    await api.resetStaffPassword(resetTarget.id, resetPassword);
    setResetTarget(null);
    setResetPassword("");
  }

  return (
    <AppShell
      title={t("staff")}
      subtitle={t("manage_staff_subtitle")}
      actions={<button onClick={openCreate} className="btn">{t("add_staff")}</button>}
    >
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <SearchInput value={search} onChange={setSearch} placeholder={t("search_name_username")} />

      {creatingOpen && (
        <form onSubmit={handleSubmit} className="card flex flex-col gap-3 mb-6 max-w-md">
          <h2 className="text-base font-semibold">{editing ? t("edit_staff_member") : t("new_staff_member")}</h2>
          <div>
            <label className="label">{t("full_name")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input w-full" />
          </div>
          {!editing && (
            <div>
              <label className="label">{t("username_col")}</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required className="input w-full" />
            </div>
          )}
          <div>
            <label className="label">{t("email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input w-full" />
          </div>
          {!editing && (
            <div>
              <label className="label">{t("password")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input w-full" />
            </div>
          )}
          <div>
            <label className="label">{t("role")}</label>
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)} required className="input w-full">
              <option value="">{t("select")}</option>
              {roles.filter((r) => r.name !== "customer").map((r) => (
                <option key={r.id} value={r.id}>{r.label || r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t("location")}</label>
            <CountrySearchSelect currencies={currencies} selectedId={countryId} onSelect={(id) => { setCountryId(id); setChadRegionId(""); }} />
          </div>
          {currencies.find((c) => String(c.id) === countryId)?.country?.toLowerCase() === "chad" && (
            <div>
              <label className="label">Chad region</label>
              <select value={chadRegionId} onChange={(e) => setChadRegionId(e.target.value)} className="input w-full">
                <option value="">Select region...</option>
                {chadRegions.map((r) => (
                  <option key={r.id} value={r.region}>{r.region}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="btn">{submitting ? t("saving") : t("save")}</button>
            <button type="button" onClick={() => setCreatingOpen(false)} className="btn-ghost">{t("cancel")}</button>
          </div>
        </form>
      )}

      {resetTarget && (
        <form onSubmit={handleResetPassword} className="card flex gap-3 items-end mb-6 max-w-md">
          <div className="flex-1">
            <label className="label">{t("reset_password_for")} {resetTarget.name}</label>
            <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required minLength={6} className="input w-full" />
          </div>
          <button type="submit" className="btn">{t("reset")}</button>
          <button type="button" onClick={() => setResetTarget(null)} className="btn-ghost">{t("cancel")}</button>
        </form>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">{t("loading")}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("username_col")}</th>
                <th>{t("role")}</th>
                <th>{t("location")}</th>
                <th>{t("wallet")}</th>
                <th>{t("status")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staff.filter((s) => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.username?.toLowerCase().includes(search.toLowerCase())).map((s) => (
                <tr key={s.id}>
                  <td className="font-medium">{s.name}</td>
                  <td>{s.username}</td>
                  <td>{s.role?.label || s.role?.name}</td>
                  <td>{s.location || "—"}</td>
                  <td>{Number(s.wallet).toLocaleString()}</td>
                  <td>
                    <button onClick={() => toggleStatus(s)} className={s.account_status === "active" ? "btn-ghost" : "btn-danger"}>
                      {s.account_status}
                    </button>
                  </td>
                  <td className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="btn-ghost">{t("edit")}</button>
                    <button onClick={() => setResetTarget(s)} className="btn-ghost">{t("reset_password")}</button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-400 py-8">{t("no_staff_yet")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
