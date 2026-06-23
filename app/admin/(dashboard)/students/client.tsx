"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  email: string;
  first_name: string | null;
  telegram_username: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  email_sent: boolean;
  invite_count: number;
  created_at: string;
  sweep_verified_at: string | null;
}

type EditableField = "first_name" | "email" | "telegram_username" | "amount" | "payment_method";

export function StudentsClient({ students }: { students: Student[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [amount, setAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("manual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingCell, setEditingCell] = useState<{ id: string; field: EditableField } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sweepLoading, setSweepLoading] = useState(false);
  const [sweepResult, setSweepResult] = useState("");
  const [sweepPhase, setSweepPhase] = useState<"idle" | "announced" | "checked">("idle");

  async function handleUpdateField(id: string, field: EditableField) {
    const res = await fetch("/api/admin/update-student", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: editValue }),
    });
    if (res.ok) {
      setEditingCell(null);
      router.refresh();
    }
  }

  function startEdit(id: string, field: EditableField, currentValue: string) {
    setEditingCell({ id, field });
    setEditValue(currentValue);
  }

  async function handleEnroll() {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/admin/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        first_name: firstName.trim() || null,
        telegram_username: telegramUsername.trim().replace(/^@/, "") || null,
        amount: Number(amount) || 0,
        payment_method: paymentMethod,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to enroll");
    } else {
      setSuccess(`${email} enrolled successfully`);
      setEmail("");
      setFirstName("");
      setTelegramUsername("");
      setAmount("0");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleSweep(phase: string) {
    setSweepLoading(true);
    setSweepResult("");
    try {
      const res = await fetch("/api/admin/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase }),
      });
      const data = await res.json();
      if (phase === "announce") {
        setSweepResult(`Sweep announced and pinned in channel. Wait 24hrs then check status.`);
        setSweepPhase("announced");
      } else if (phase === "check") {
        const unlinked = (data.unverified_unlinked || []).map((s: { email: string }) => s.email).join(", ");
        const linked = (data.unverified_linked || []).map((s: { email: string; telegram_username: string }) =>
          `${s.email} (@${s.telegram_username || "?"})`
        ).join(", ");
        setSweepResult(
          `Verified: ${data.verified}/${data.total}\n` +
          `Unverified (will be kicked): ${linked || "none"}\n` +
          `Unverified (no TG linked, can't kick): ${unlinked || "none"}`
        );
        setSweepPhase("checked");
      } else if (phase === "kick") {
        setSweepResult(
          `Kicked: ${(data.kicked || []).length} user(s). Fresh emails sent to: ${(data.emails_sent || []).join(", ") || "none"}`
        );
        setSweepPhase("idle");
        router.refresh();
      }
    } catch {
      setSweepResult("Sweep request failed.");
    }
    setSweepLoading(false);
  }

  function renderEditableCell(s: Student, field: EditableField, displayValue: string, prefix?: string) {
    const isEditing = editingCell?.id === s.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <span className="flex items-center gap-1">
          {prefix && <span>{prefix}</span>}
          {field === "payment_method" ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") setEditingCell(null); }}
              autoFocus
              className="w-28 rounded border border-[#333] bg-[#1a1a1a] px-2 py-1 text-sm text-white focus:border-[#E63946] focus:outline-none"
            >
              <option value="flutterwave">Flutterwave</option>
              <option value="blockradar">Blockradar</option>
              <option value="manual">Manual / Transfer</option>
              <option value="cash">Cash</option>
              <option value="crypto_direct">Crypto (direct)</option>
              <option value="free">Free / Comp</option>
            </select>
          ) : (
            <input
              type={field === "amount" ? "number" : "text"}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleUpdateField(s.id, field); if (e.key === "Escape") setEditingCell(null); }}
              autoFocus
              className="w-32 rounded border border-[#333] bg-[#1a1a1a] px-2 py-1 text-sm text-white focus:border-[#E63946] focus:outline-none"
            />
          )}
          <button onClick={() => handleUpdateField(s.id, field)} className="text-green-400 hover:text-green-300 text-xs cursor-pointer">&#10003;</button>
          <button onClick={() => setEditingCell(null)} className="text-red-400 hover:text-red-300 text-xs cursor-pointer">&#10007;</button>
        </span>
      );
    }

    return (
      <span
        onClick={() => startEdit(s.id, field, displayValue)}
        className="cursor-pointer hover:text-white hover:underline"
        title="Click to edit"
      >
        {prefix}{displayValue || "—"}
      </span>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-sm text-[#888]">{students.length} enrolled</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-[#E63946] px-4 py-2 text-sm font-bold text-white hover:bg-[#FF4D5A] cursor-pointer"
        >
          {showForm ? "Cancel" : "+ Enroll Student"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-[#2a2a2a] bg-[#111] p-5">
          <h2 className="mb-4 text-sm font-bold text-white">Manual Enrollment</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="email"
              placeholder="Email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-[#555] focus:border-[#E63946] focus:outline-none"
            />
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-[#555] focus:border-[#E63946] focus:outline-none"
            />
            <input
              type="text"
              placeholder="@telegram_username"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
              className="rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-[#555] focus:border-[#E63946] focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-1/2 rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-[#555] focus:border-[#E63946] focus:outline-none"
              />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-1/2 rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#E63946] focus:outline-none"
              >
                <option value="manual">Manual / Transfer</option>
                <option value="cash">Cash</option>
                <option value="crypto_direct">Crypto (direct)</option>
                <option value="free">Free / Comp</option>
              </select>
            </div>
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          {success && <p className="mt-2 text-xs text-green-400">{success}</p>}
          <button
            onClick={handleEnroll}
            disabled={loading}
            className="mt-3 rounded-lg bg-[#E63946] px-4 py-2 text-sm font-bold text-white hover:bg-[#FF4D5A] disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Enrolling..." : "Enroll Student"}
          </button>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-[#2a2a2a] bg-[#111] p-5">
        <h2 className="mb-2 text-sm font-bold text-white">Verification Sweep</h2>
        <p className="mb-4 text-xs text-[#888]">Audit channel members — announce, check who verified, then kick freeloaders.</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleSweep("announce")}
            disabled={sweepLoading}
            className="rounded-lg bg-yellow-600 px-4 py-2 text-xs font-bold text-white hover:bg-yellow-500 disabled:opacity-50 cursor-pointer"
          >
            {sweepLoading ? "..." : "1. Announce"}
          </button>
          <button
            onClick={() => handleSweep("check")}
            disabled={sweepLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
          >
            {sweepLoading ? "..." : "2. Check Status"}
          </button>
          <button
            onClick={() => {
              if (confirm("This will KICK all unverified members and send them fresh emails. Continue?")) {
                handleSweep("kick");
              }
            }}
            disabled={sweepLoading}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50 cursor-pointer"
          >
            {sweepLoading ? "..." : "3. Kick Unverified"}
          </button>
        </div>
        {sweepResult && <pre className="mt-3 whitespace-pre-wrap text-xs text-[#ccc]">{sweepResult}</pre>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#2a2a2a] bg-[#111]">
            <tr>
              <th className="px-4 py-3 font-medium text-[#888]">Name</th>
              <th className="px-4 py-3 font-medium text-[#888]">Email</th>
              <th className="px-4 py-3 font-medium text-[#888]">Telegram</th>
              <th className="px-4 py-3 font-medium text-[#888]">Amount</th>
              <th className="px-4 py-3 font-medium text-[#888]">Method</th>
              <th className="px-4 py-3 font-medium text-[#888]">Email Sent</th>
              <th className="px-4 py-3 font-medium text-[#888]">Links Used</th>
              <th className="px-4 py-3 font-medium text-[#888]">Date</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-[#1a1a1a] hover:bg-[#111]">
                <td className="px-4 py-3 text-white">
                  {renderEditableCell(s, "first_name", s.first_name || "")}
                </td>
                <td className="px-4 py-3 text-[#ccc]">
                  {renderEditableCell(s, "email", s.email)}
                </td>
                <td className="px-4 py-3 text-[#ccc]">
                  {renderEditableCell(s, "telegram_username", s.telegram_username || "", "@")}
                </td>
                <td className="px-4 py-3 text-[#ccc]">
                  {renderEditableCell(s, "amount", String(s.amount), s.currency === "NGN" ? "₦" : "$")}
                </td>
                <td className="px-4 py-3 text-[#888]">
                  {renderEditableCell(s, "payment_method", s.payment_method)}
                </td>
                <td className="px-4 py-3">{s.email_sent ? <span className="text-green-400">&#10003;</span> : <span className="text-red-400">&#10007;</span>}</td>
                <td className="px-4 py-3 text-[#888]">{s.invite_count}/2</td>
                <td className="px-4 py-3 text-[#888]">{new Date(s.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
