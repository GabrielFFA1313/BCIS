import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface Invoice {
  id: number;
  invoiceNumber: string;
  serviceAccountId: number;
  total: string;
  status: string;
  dueDate: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  paid: { bg: "#D1FAE5", text: "#059669" },
  unpaid: { bg: "#F3F4F6", text: "#64748B" },
  partially_paid: { bg: "#FEF3C7", text: "#D97706" },
  overdue: { bg: "#FEE2E2", text: "#DC2626" },
  void: { bg: "#F3F4F6", text: "#64748B" },
  credited: { bg: "#DBEAFE", text: "#2563EB" },
  draft: { bg: "#F3F4F6", text: "#64748B" },
};

export function InvoicesPage() {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadInvoices() {
    setLoading(true);
    const res = await fetch("http://localhost:4000/invoices", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setInvoices(data);
    setLoading(false);
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2 style={{ color: "#0F172A" }}>Invoices</h2>

      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #E5E7EB", color: "#64748B" }}>
            <th style={{ padding: 8 }}>Invoice #</th>
            <th style={{ padding: 8 }}>Service Acct #</th>
            <th style={{ padding: 8, textAlign: "right" }}>Total</th>
            <th style={{ padding: 8 }}>Due Date</th>
            <th style={{ padding: 8 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} style={{ padding: 8 }}>
                Loading...
              </td>
            </tr>
          ) : invoices.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: 8, color: "#64748B" }}>
                No invoices yet. Generate billing to create some.
              </td>
            </tr>
          ) : (
            invoices.map((inv) => {
              const colors = STATUS_COLORS[inv.status] || STATUS_COLORS.unpaid;
              return (
                <tr key={inv.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: 8, color: "#0F172A" }}>{inv.invoiceNumber}</td>
                  <td style={{ padding: 8, color: "#0F172A" }}>{inv.serviceAccountId}</td>
                  <td
                    style={{
                      padding: 8,
                      textAlign: "right",
                      color: "#0F172A",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    ₱{Number(inv.total).toFixed(2)}
                  </td>
                  <td style={{ padding: 8, color: "#0F172A" }}>{inv.dueDate}</td>
                  <td style={{ padding: 8 }}>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 12,
                        background: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {inv.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}