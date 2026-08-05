"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import SearchInput from "@/components/SearchInput";

export default function StaffPage() {
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
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [resetTarget, setResetTarget] = useState<any>(null);
  const [resetPassword, setResetPassword] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [staffRes, rolesRes] = await Promise.all([api.getStaff(), api.getRoles()]);
      setStaff(staffRes.staff);
      setRoles(rolesRes.roles);
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
    setLocation("");
    setCreatingOpen(true);
  }

  function openEdit(member: any) {
    setEditing(member);
    setName(member.name);
    setUsername(member.username);
    setEmail(member.email || "");
    setRoleId(String(member.role_id));
    setLocation(member.location || "");
    setCreatingOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (editing) {
        await api.updateStaff(editing.id, { name, email: email || undefined, role_id: Number(roleId), location: location || undefined });
      } else {
        await api.createStaff({
          name,
          username,
          email: email || undefined,
          password,
          role_id: Number(roleId),
          location: location || undefined,
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
      title="Staff"
      subtitle="Manage staff accounts and access"
      actions={<button onClick={openCreate} className="btn">Add staff</button>}
    >
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <SearchInput value={search} onChange={setSearch} placeholder="Search by name or username..." />

      {creatingOpen && (
        <form onSubmit={handleSubmit} className="card flex flex-col gap-3 mb-6 max-w-md">
          <h2 className="text-base font-semibold">{editing ? "Edit staff member" : "New staff member"}</h2>
          <div>
            <label className="label">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input w-full" />
          </div>
          {!editing && (
            <div>
              <label className="label">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required className="input w-full" />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input w-full" />
          </div>
          {!editing && (
            <div>
              <label className="label">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input w-full" />
            </div>
          )}
          <div>
            <label className="label">Role</label>
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)} required className="input w-full">
              <option value="">Select</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.label || r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="input w-full" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="btn">{submitting ? "Saving..." : "Save"}</button>
            <button type="button" onClick={() => setCreatingOpen(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      {resetTarget && (
        <form onSubmit={handleResetPassword} className="card flex gap-3 items-end mb-6 max-w-md">
          <div className="flex-1">
            <label className="label">Reset password for {resetTarget.name}</label>
            <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required minLength={6} className="input w-full" />
          </div>
          <button type="submit" className="btn">Reset</button>
          <button type="button" onClick={() => setResetTarget(null)} className="btn-ghost">Cancel</button>
        </form>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Location</th>
                <th>Wallet</th>
                <th>Status</th>
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
                    <button onClick={() => openEdit(s)} className="btn-ghost">Edit</button>
                    <button onClick={() => setResetTarget(s)} className="btn-ghost">Reset password</button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-400 py-8">No staff yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
