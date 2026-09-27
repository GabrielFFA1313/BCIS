import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

export function GenerateBillingPage() {
  const { token } = useAuth();
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [result, setResult] = useState<{ createdCount: number; skippedCount: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/billing/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ periodYear: year, periodMonth: month }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not generate billing");
        return;
      }
      setResult(data);
    } catch {
      setError("Could not reach the API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 480 }}>
      <h2 style={{ color: "#0F172A" }}>Generate Billing</h2>
      <p style={{ color: "#64748B" }}>
        Generates invoices for all active service accounts for the selected billing period.
        Re-running for the same period is safe — existing invoices are skipped, not duplicated.
      </p>

      <form
        onSubmit={handleGenerate}
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 8,
          padding: 16,
          marginTop: 16,
        }}
      >
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, color: "#64748B" }}>Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ width: "100%", padding: 6, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, color: "#64748B" }}>Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              style={{ width: "100%", padding: 6, boxSizing: "border-box" }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p style={{ color: "#DC2626", fontSize: 13 }}>{error}</p>}

        {result && (
          <div
            style={{
              background: "#D1FAE5",
              color: "#059669",
              padding: 10,
              borderRadius: 4,
              marginBottom: 12,
              fontSize: 14,
            }}
          >
            Generated {result.createdCount} invoice(s). Skipped {result.skippedCount} (already
            billed).
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "8px 16px",
            background: "#2563EB",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate Billing"}
        </button>
      </form>
    </div>
  );
}