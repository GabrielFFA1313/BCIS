import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

interface Subscriber {
  id: number;
  accountNumber: string;
  fullName: string;
  contactNumber: string | null;
  status: string;
}

export function SubscribersPage() {
  const { token, hasPermission } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [accountNumber, setAccountNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadSubscribers() {
    setLoading(true);
    const res = await fetch("http://localhost:4000/subscribers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSubscribers(data);
    setLoading(false);
  }

  useEffect(() => {
    loadSubscribers();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:4000/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accountNumber, fullName, contactNumber, addressLine }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Could not create subscriber");
        return;
      }

      setAccountNumber("");
      setFullName("");
      setContactNumber("");
      setAddressLine("");
      setShowForm(false);
      loadSubscribers();
    } catch {
      setFormError("Could not reach the API.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "#0F172A" }}>Subscribers</h2>
        {hasPermission("subscriber.manage") && (
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{
              padding: "8px 16px",
              background: "#2563EB",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {showForm ? "Cancel" : "+ New Subscriber"}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            padding: 16,
            marginTop: 16,
            maxWidth: 400,
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 13, color: "#64748B" }}>Account Number</label>
            <input
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              style={{ width: "100%", padding: 6, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 13, color: "#64748B" }}>Full Name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: "100%", padding: 6, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 13, color: "#64748B" }}>Contact Number</label>
            <input
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              style={{ width: "100%", padding: 6, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, color: "#64748B" }}>Address</label>
            <input
              required
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              style={{ width: "100%", padding: 6, boxSizing: "border-box" }}
            />
          </div>
          {formError && <p style={{ color: "#DC2626", fontSize: 13 }}>{formError}</p>}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "8px 16px",
              background: "#059669",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {submitting ? "Saving..." : "Save Subscriber"}
          </button>
        </form>
      )}

      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #E5E7EB", color: "#64748B" }}>
            <th style={{ padding: 8, color: "#0F172A" }}>Account #</th>
            <th style={{ padding: 8, color: "#0F172A" }}>Name</th>
            <th style={{ padding: 8, color: "#0F172A" }}>Contact</th>
            <th style={{ padding: 8, color: "#0F172A" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} style={{ padding: 8 }}>
                Loading...
              </td>
            </tr>
          ) : subscribers.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: 8, color: "#64748B" }}>
                No subscribers yet.
              </td>
            </tr>
          ) : (
            subscribers.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td style={{ padding: 8 }}>{s.accountNumber}</td>
                <td style={{ padding: 8 }}>{s.fullName}</td>
                <td style={{ padding: 8 }}>{s.contactNumber || "-"}</td>
                <td style={{ padding: 8 }}>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: s.status === "active" ? "#D1FAE5" : "#F3F4F6",
                      color: s.status === "active" ? "#059669" : "#64748B",
                    }}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}