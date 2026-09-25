export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2 style={{ color: "#0F172A" }}>{title}</h2>
      <p style={{ color: "#64748B" }}>This section will be built in a later phase.</p>
    </div>
  );
}