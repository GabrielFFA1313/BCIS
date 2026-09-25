import { useAuth } from "../context/AuthContext";

export type PageKey =
  | "dashboard"
  | "subscribers"
  | "billing"
  | "payments"
  | "collections"
  | "receivables"
  | "services"
  | "reports"
  | "administration";

interface NavItem {
  key: PageKey;
  label: string;
  requiredPermission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "subscribers", label: "Subscribers", requiredPermission: "subscriber.view" },
  { key: "billing", label: "Billing", requiredPermission: "billing.view" },
  { key: "payments", label: "Payments", requiredPermission: "payment.create" },
  { key: "collections", label: "Collections", requiredPermission: "collection.manage" },
  { key: "receivables", label: "Receivables", requiredPermission: "billing.view" },
  { key: "services", label: "Services", requiredPermission: "subscriber.view" },
  { key: "reports", label: "Reports", requiredPermission: "report.export" },
  { key: "administration", label: "Administration", requiredPermission: "user.manage" },
];

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { user, hasPermission, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.requiredPermission || hasPermission(item.requiredPermission)
  );

  return (
    <div
      style={{
        width: 220,
        minHeight: "100vh",
        background: "#0F2747",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
        <strong>BCIS</strong>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{user?.fullName}</div>
      </div>

      <nav style={{ flex: 1, padding: 8 }}>
        {visibleItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              marginBottom: 4,
              background: activePage === item.key ? "#2563EB" : "transparent",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        <button
          onClick={logout}
          style={{
            width: "100%",
            padding: "8px 12px",
            background: "transparent",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}