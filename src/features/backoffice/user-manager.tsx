"use client";

import { useEffect, useMemo, useState } from "react";
// firebase imports removed since this component uses the API
// import {
//   collection,
//   onSnapshot,
//   orderBy,
//   query,
//   type Firestore,
// } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/components/i18n-provider";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { formatDateTime } from "@/lib/format";
import type { UserProfile } from "@/types/user";

type UserRole = NonNullable<UserProfile["role"]>;

type UserRow = UserProfile & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
};

// form state now tracks separate first/last names instead of displayName
type UserForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
};

const emptyForm: UserForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "technician",
  password: "",
  confirmPassword: "",
};

const roleLabels: Record<UserRole, { th: string; en: string }> = {
  user: { th: "ผู้ใช้", en: "User" },
  technician: { th: "ช่าง", en: "Technician" },
  admin: { th: "แอดมิน", en: "Admin" },
};

const PAGE_SIZE = 8;

export default function UserManager() {
  const { lang } = useI18n();
  const [items, setItems] = useState<UserRow[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [page, setPage] = useState(1);

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/backoffice/users");
      if (!res.ok) throw new Error(res.statusText);
      const data = (await res.json()) as { users: UserRow[] };
      setItems(data.users || []);
    } catch (err) {
      setMessage(String(err));
    }
  };

  useEffect(() => {
    loadUsers();
  }, [lang]);

  useEffect(() => {
    setPage(1);
  }, [queryText, roleFilter, items.length]);

  const filteredRows = useMemo(() => {
    let rows = items;
    if (roleFilter !== "all") {
      rows = rows.filter((u) => u.role === roleFilter);
    }
    const keyword = queryText.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((user) => {
      const values = [
        user.id,
        user.firstName,
        user.lastName,
        user.displayName,
        user.email,
        user.phone,
        user.role,
        user.address?.line1,
        user.address?.district,
        user.address?.province,
        user.address?.zip,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return values.some((value) => value.includes(keyword));
    });
  }, [items, queryText, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSave = async () => {
    // we no longer reference db here; operations go through /api/backoffice/users
    if (!isFirebaseConfigured) {
      const errorText =
        lang === "th"
          ? "Firebase ยังไม่พร้อมใช้งาน"
          : "Firebase is not configured.";
      setMessage(errorText);
      await showErrorAlert({ title: "Error", text: errorText });
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const email = form.email.trim();
      const firstName = form.firstName.trim();
      const lastName = form.lastName.trim();
      const fullName = [firstName, lastName].filter(Boolean).join(" ");
      const phone = form.phone.trim();
      const isEditing = Boolean(editingId);
      if (!email) {
        const text =
          lang === "th"
            ? "กรุณาใส่อีเมลผู้ใช้"
            : "Please provide an email address.";
        setMessage(text);
        await showErrorAlert({ title: "Error", text });
        setSaving(false);
        return;
      }
      if (!firstName) {
        const text =
          lang === "th"
            ? "กรุณาใส่ชื่อ"
            : "Please provide a first name.";
        setMessage(text);
        await showErrorAlert({ title: "Error", text });
        setSaving(false);
        return;
      }
      if (!isEditing) {
        if (!form.password) {
          const text =
            lang === "th"
              ? "กรุณาใส่รหัสผ่าน"
              : "Please provide a password.";
          setMessage(text);
          await showErrorAlert({ title: "Error", text });
          setSaving(false);
          return;
        }
        if (form.password !== form.confirmPassword) {
          const text =
            lang === "th" ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match.";
          setMessage(text);
          await showErrorAlert({ title: "Error", text });
          setSaving(false);
          return;
        }
      }

      const response = await fetch("/api/backoffice/users", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: editingId ?? undefined,
          firstName,
          lastName,
          displayName: fullName,
          email,
          phone,
          role: form.role,
          password: form.password || undefined,
        }),
      });
      let data: { error?: string } = {};
      try {
        data = (await response.json()) as { error?: string };
      } catch {
        // Ignore JSON parse errors.
      }
      if (!response.ok) {
        throw new Error(data.error || response.statusText || "Unable to save user.");
      }
      setForm(emptyForm);
      setEditingId(null);
      setModalOpen(false);
      const successText = lang === "th" ? "บันทึกผู้ใช้แล้ว" : "User saved.";
      setMessage(successText);
      await showSuccessAlert({ title: successText });
      loadUsers();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unable to save user.";
      setMessage(text);
      await showErrorAlert({ title: "Error", text });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: UserRow) => {
    setEditingId(user.id);
    setForm({
      firstName: user.firstName || user.displayName?.split(" ")[0] || "",
      lastName:
        user.lastName ||
        user.displayName?.split(" ").slice(1).join(" ") ||
        "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      role: user.role ?? "user",
      password: "",
      confirmPassword: "",
    });
    setModalOpen(true);
  };

  const handleClear = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-[--text-strong]">
          {lang === "th" ? "จัดการผู้ใช้" : "User management"}
        </div>
        <Button onClick={() => setModalOpen(true)}>
          {lang === "th" ? "เพิ่มผู้ใช้" : "Add user"}
        </Button>
      </div>

      <Card className="space-y-3 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            placeholder={lang === "th" ? "ค้นหาผู้ใช้" : "Search users"}
            className="flex-1"
          />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "all" | UserRole)}
            className="w-full sm:w-[150px]"
          >
            <option value="all">
              {lang === "th" ? "ทุกบทบาท" : "All roles"}
            </option>
            {Object.keys(roleLabels).map((r) => (
              <option key={r} value={r}>
                {lang === "th"
                  ? roleLabels[r as UserRole].th
                  : roleLabels[r as UserRole].en}
              </option>
            ))}
          </Select>
        </div>
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="min-w-[720px] table-auto text-xs sm:w-full sm:min-w-0 sm:text-sm">
            <thead>
              <tr className="text-left text-xs text-[--text-soft]">
                <th className="pb-2 whitespace-nowrap w-20">UID</th>
                <th className="pb-2 whitespace-nowrap">{lang === "th" ? "ชื่อ-นามสกุล" : "Name"}</th>
                <th className="pb-2 whitespace-nowrap">{lang === "th" ? "อีเมล" : "Email"}</th>
                <th className="pb-2 whitespace-nowrap">{lang === "th" ? "เบอร์โทร" : "Phone"}</th>
                <th className="pb-2 whitespace-nowrap">{lang === "th" ? "สิทธิ์" : "Role"}</th>
                <th className="pb-2 whitespace-nowrap max-w-[120px]">{lang === "th" ? "ที่อยู่" : "Address"}</th>
                <th className="pb-2 whitespace-nowrap">{lang === "th" ? "อัปเดต" : "Updated"}</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((user) => (
                <tr key={user.id} className="border-t border-emerald-100 align-top">
                  <td className="py-3 pr-3 text-[10px] text-[--text-soft] font-mono">
                    <div className="w-16 truncate" title={user.id}>
                      {user.id}
                    </div>
                  </td>
                  <td className="py-3 pr-3 font-medium">
                    {user.firstName || user.lastName
                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                      : user.displayName || "-"}
                  </td>
                  <td className="py-3 pr-3 text-xs">{user.email || "-"}</td>
                  <td className="py-3 pr-3 text-xs">{user.phone || "-"}</td>
                  <td className="py-3 pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${user.role === "admin" ? "bg-purple-100 text-purple-700" :
                      user.role === "technician" ? "bg-blue-100 text-blue-700" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>
                      {user.role
                        ? lang === "th"
                          ? roleLabels[user.role].th
                          : roleLabels[user.role].en
                        : "-"}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    {user.address?.line1 ? (
                      <div className="w-24 text-[10px] text-[--text-soft] leading-tight line-clamp-2" title={[
                        user.address.line1,
                        user.address.district,
                        user.address.province,
                        user.address.zip,
                      ].filter(Boolean).join(", ")}>
                        {user.address.line1}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-3 text-xs text-[--text-soft]">
                    {user.updatedAt ? formatDateTime(user.updatedAt) : "-"}
                  </td>
                  <td className="py-3 flex items-start gap-1">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => handleEdit(user)}>
                      {lang === "th" ? "แก้ไข" : "Edit"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[10px]"
                      onClick={() => {
                        window.location.href = `/bo/tickets?userId=${user.id}`;
                      }}
                    >
                      {lang === "th" ? "งาน" : "Work"}
                    </Button>
                  </td>
                </tr>
              ))}
              {!pagedRows.length ? (
                <tr key="no-data">
                  <td colSpan={9} className="py-3 text-xs text-[--text-soft]">
                    {lang === "th" ? "ยังไม่มีผู้ใช้" : "No users found."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[--text-soft]">
          <div>
            {lang === "th"
              ? `แสดง ${filteredRows.length} รายการ`
              : `${filteredRows.length} items`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              {lang === "th" ? "ก่อนหน้า" : "Prev"}
            </Button>
            <span>
              {currentPage} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              {lang === "th" ? "ถัดไป" : "Next"}
            </Button>
          </div>
        </div>
      </Card>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[--text-strong]">
                {lang === "th" ? "เพิ่ม/แก้ไขผู้ใช้" : "Add / edit user"}
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-[--text-soft]"
                onClick={() => setModalOpen(false)}
              >
                {lang === "th" ? "ปิด" : "Close"}
              </button>
            </div>
            <Input
              value={form.firstName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  firstName: event.target.value,
                }))
              }
              placeholder={lang === "th" ? "ชื่อ" : "First name"}
            />
            <Input
              value={form.lastName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  lastName: event.target.value,
                }))
              }
              placeholder={lang === "th" ? "นามสกุล" : "Last name"}
            />
            <Input
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder={lang === "th" ? "อีเมล" : "Email"}
            />
            <Input
              value={form.phone}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phone: event.target.value }))
              }
              placeholder={lang === "th" ? "เบอร์โทร" : "Phone"}
            />
            <Input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder={lang === "th" ? "รหัสผ่าน" : "Password"}
            />
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  confirmPassword: event.target.value,
                }))
              }
              placeholder={lang === "th" ? "ยืนยันรหัสผ่าน" : "Confirm password"}
            />
            <Select
              value={form.role}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  role: event.target.value as UserRole,
                }))
              }
            >
              {Object.keys(roleLabels).map((role) => {
                const key = role as UserRole;
                return (
                  <option key={role} value={role}>
                    {lang === "th" ? roleLabels[key].th : roleLabels[key].en}
                  </option>
                );
              })}
            </Select>
            {message ? <div className="text-xs text-emerald-700">{message}</div> : null}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "..." : lang === "th" ? "บันทึก" : "Save"}
              </Button>
              <Button variant="outline" onClick={handleClear}>
                {lang === "th" ? "ล้างฟอร์ม" : "Clear"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
