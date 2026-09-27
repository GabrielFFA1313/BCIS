import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface Address {
  id: number;
  addressLine: string;
  isPrimary: boolean;
}

interface SubscriberDetail {
  id: number;
  accountNumber: string;
  fullName: string;
  contactNumber: string | null;
  status: string;
  addresses: Address[];
}

interface LedgerEntry {
  id: number;
  entryDate: string;
  reference: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
}

interface Props {
  subscriberId: number;
  onBack: () => void;
}

export function SubscriberProfilePage({ subscriberId, onBack }: Props) {
  const { token } = useAuth();
  const [subscriber, setSubscriber] = useState<SubscriberDetail | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [subRes, ledgerRes] = await Promise.all([
        fetch(`http://localhost:4000/subscribers/${subscriberId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:4000/subscribers/${subscriberId}/ledger`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setSubscriber(await subRes.json());
      setLedger(await ledgerRes.json());
      setLoading(false);
    }
    load();
  }, [subscriberId]);

  if (loading || !subscriber) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "#2563EB",
          cursor: "pointer",
          padding: 0,
          marginBottom: 16,
          fontSize: 14,
        }}
      >
        ← Back to Subscribers
      </button>

      <h2 style={{ color: "#0F172A", marginBottom: 4 }}>{subscriber.fullName}</h2>
      <p style={{ color: "#64748B", marginTop: 0 }}>
        {subscriber.accountNumber} · {subscriber.contactNumber || "No contact number"} ·{" "}
        <span
          style={{
            fontSize: 12,
            padding: "2px 8px",
            borderRadius: 12,
            background: subscriber.status === "active" ? "#D1FAE5" : "#F3F4F6",
            color: subscriber.status === "active" ? "#059669" : "#64748B",
          }}
        >
          {subscriber.status}
        </span>
      </p>

      <div style={{ marginTop: 16 }}>
        <h4 style={{ color: "#0F172A", marginBottom: 8 }}>Address</h4>
        {subscriber.addresses.map((a) => (
          <p key={a.id} style={{ color: "#64748B", margin: 0 }}>
            {a.addressLine} {a.isPrimary && "(Primary)"}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <h4 style={{ color: "#0F172A", marginBottom: 8 }}>Ledger / Statement of Account</h4>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #E5E7EB", color: "#64748B" }}>
              <th style={{ padding: 8 }}>Date</th>
              <th style={{ padding: 8 }}>Reference</th>
              <th style={{ padding: 8 }}>Description</th>
              <th style={{ padding: 8, textAlign: "right" }}>Debit</th>
              <th style={{ padding: 8, textAlign: "right" }}>Credit</th>
              <th style={{ padding: 8, textAlign: "right" }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {ledger.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 8, color: "#64748B" }}>
                  No ledger entries yet.
                </td>
              </tr>
            ) : (
              ledger.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: 8, color: "#0F172A" }}>
                    {entry.entryDate.slice(0, 10)}
                  </td>
                  <td style={{ padding: 8, color: "#0F172A" }}>{entry.reference}</td>
                  <td style={{ padding: 8, color: "#0F172A" }}>{entry.description}</td>
                  <td
                    style={{
                      padding: 8,
                      textAlign: "right",
                      color: "#0F172A",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {Number(entry.debit) > 0 ? `₱${Number(entry.debit).toFixed(2)}` : ""}
                  </td>
                  <td
                    style={{
                      padding: 8,
                      textAlign: "right",
                      color: "#0F172A",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {Number(entry.credit) > 0 ? `₱${Number(entry.credit).toFixed(2)}` : ""}
                  </td>
                  <td
                    style={{
                      padding: 8,
                      textAlign: "right",
                      color: "#0F172A",
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    ₱{Number(entry.balance).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}