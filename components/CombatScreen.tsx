"use client";

import { useState } from "react";
import { LogView } from "@/components/LogView";
import { StatPanel } from "@/components/StatPanel";
import { createCombatFromClass } from "@/lib/combat";

export function CombatScreen({
  combat,
  onRestart,
}: {
  combat: ReturnType<typeof createCombatFromClass>;
  onRestart: () => void;
}) {
  const [tick, setTick] = useState(0);
  const rerender = () => setTick((t) => t + 1);

  const playableClass = (cost: number) =>
    combat.state.stamina >= cost && !combat.isOver
      ? "card card-enter card--playable"
      : "card card-enter card--unplayable";

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <StatPanel
          titolo={combat.state.player.name}
          hp={combat.state.player.hp}
          hpMax={combat.state.player.hpMax}
          def={combat.state.player.defense}
          extraRight={`⚡ Stamina: ${combat.state.stamina}`}
        />
        <StatPanel
          titolo={combat.state.enemy.name}
          hp={combat.state.enemy.hp}
          hpMax={combat.state.enemy.hpMax}
          def={combat.state.enemy.defense}
          extraRight={combat.state.enemy.stunned > 0 ? `💫 Stordito: ${combat.state.enemy.stunned}` : undefined}
        />
      </header>

      {/* Mano */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", minHeight: 190, flexWrap: "wrap" }}>
        {combat.deck.hand.map((c) => (
          <div
            key={c.id + "-" + tick + "-" + Math.random()}
            className={playableClass(c.cost)}
            style={{ width: 200 }}
            onClick={() => {
              combat.playCard(c.id);
              rerender();
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{c.title}</div>
            <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 6 }}>Costo: {c.cost}</div>
            <div style={{ fontSize: 12, minHeight: 40 }}>{c.description}</div>
          </div>
        ))}
      </div>

      {/* Controlli */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button
          onClick={() => {
            combat.endTurn();
            rerender();
          }}
          disabled={combat.isOver}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #2a2f3a",
            background: combat.isOver ? "#394150" : "#22c55e",
            color: "white",
            fontWeight: 700,
            cursor: combat.isOver ? "not-allowed" : "pointer",
          }}
        >
          Riposa (Recupera 3 STA)
        </button>

        <button
          onClick={onRestart}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #2a2f3a",
            background: "#ef4444",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Torna alla selezione
        </button>
      </div>

      {/* Log */}
      <LogView log={combat.log} />

      {/* Esito */}
      {combat.isOver && (
        <div style={{ textAlign: "center", fontWeight: 800, fontSize: 18 }}>
          {combat.winner === "player"
            ? "🏆 Vittoria!"
            : combat.winner === "enemy"
            ? "💀 Sconfitta..."
            : "☠️ Pareggio fatale"}
        </div>
      )}
    </section>
  );
}
