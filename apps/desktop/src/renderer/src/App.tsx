import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Sidebar, type PageKey } from "./components/Sidebar";
import { LoginPage } from "./pages/LoginPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { SubscribersPage } from "./pages/SubscribersPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { GenerateBillingPage } from "./pages/GenerateBillingPage";
import { SubscriberProfilePage } from "./pages/SubscriberProfilePage";

function BillingSection() {
  const [tab, setTab] = useState<"generate" | "invoices">("invoices");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, padding: "16px 24px 0" }}>
        <button
          onClick={() => setTab("invoices")}
          style={{
            padding: "6px 14px",
            border: "none",
            borderBottom: tab === "invoices" ? "2px solid #2563EB" : "2px solid transparent",
            background: "transparent",
            color: tab === "invoices" ? "#2563EB" : "#64748B",
            cursor: "pointer",
            fontWeight: tab === "invoices" ? 600 : 400,
          }}
        >
          Invoices
        </button>
        <button
          onClick={() => setTab("generate")}
          style={{
            padding: "6px 14px",
            border: "none",
            borderBottom: tab === "generate" ? "2px solid #2563EB" : "2px solid transparent",
            background: "transparent",
            color: tab === "generate" ? "#2563EB" : "#64748B",
            cursor: "pointer",
            fontWeight: tab === "generate" ? 600 : 400,
          }}
        >
          Generate Billing
        </button>
      </div>
      {tab === "invoices" ? <InvoicesPage /> : <GenerateBillingPage />}
    </div>
  );
}

function SubscribersSection() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (selectedId !== null) {
    return (
      <SubscriberProfilePage
        subscriberId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return <SubscribersPage onSelectSubscriber={setSelectedId} />;
}

function AppShell() {
  const { token } = useAuth();
  const [activePage, setActivePage] = useState<PageKey>("dashboard");

  if (!token) {
    return <LoginPage />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
       <div style={{ flex: 1, background: "#F6F8FB", height: "100vh", overflowY: "auto" }}>
        {activePage === "dashboard" && <PlaceholderPage title="Dashboard" />}
        {activePage === "subscribers" && <SubscribersSection />}
        {activePage === "billing" && <BillingSection />}
        {activePage === "payments" && <PlaceholderPage title="Payments" />}
        {activePage === "collections" && <PlaceholderPage title="Collections" />}
        {activePage === "receivables" && <PlaceholderPage title="Receivables" />}
        {activePage === "services" && <PlaceholderPage title="Services" />}
        {activePage === "reports" && <PlaceholderPage title="Reports" />}
        {activePage === "administration" && <PlaceholderPage title="Administration" />}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;