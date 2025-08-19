"use client";

export function StatPanel({
  titolo,
  hp,
  hpMax,
  def,
  extraRight,
}: {
  titolo: string;
  hp: number;
  hpMax: number;
  def: number;
  extraRight?: string;
}) {
  return (
    <div
      style={{
        flex: "1 1 320px",
        padding: 12,
        border: "1px solid #2a2f3a",
        borderRadius: 10,
        background: "#0f1115",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>{titolo}</div>
        <div>❤️ {hp}/{hpMax} &nbsp;•&nbsp; 🛡️ {def}</div>
      </div>
      {extraRight && <div style={{ opacity: 0.9 }}>{extraRight}</div>}
    </div>
  );
}
