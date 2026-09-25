import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Sidebar, type PageKey } from "./components/Sidebar";
import { LoginPage } from "./pages/LoginPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { SubscribersPage } from "./pages/SubscribersPage";

function AppShell() {
  const { token } = useAuth();
  const [activePage, setActivePage] = useState<PageKey>("dashboard");

  if (!token) {
    return <LoginPage />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div style={{ flex: 1, background: "#F6F8FB" }}>
        {activePage === "dashboard" && <PlaceholderPage title="Dashboard" />}
        {activePage === "subscribers" && <SubscribersPage />}
        {activePage === "billing" && <PlaceholderPage title="Billing" />}
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