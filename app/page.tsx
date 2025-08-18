// app/page.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { createCombatFromClass } from "@/lib/combat";
import type { Fighter } from "@/lib/tipi-combattimento";

// In futuro potrai importare CLASSI e mostrare tutte le opzioni.
// Per ora la scelta è singola: "Guerriero".
export default function HomePage() {
  const [step, setStep] = useState<"scelta" | "combattimento">("scelta");
  const [nomeGiocatore, setNomeGiocatore] = useState("Eroe");
  const [classeSelezionata] = useState<"guerriero">("guerriero"); // placeholder per quando aggiungeremo altre classi

  // Nemico di esempio
  const nemico: Fighter = useMemo(
    () => ({
      id: "goblin",
      name: "Goblin",
      hp: 18,
      hpMax: 18,
      atk: 4,
      defense: 0,
      stunned: 0,
    }),
    []
  );

  // Creo il combattimento quando si entra nello step "combattimento"
  const combatRef = useRef<ReturnType<typeof createCombatFromClass> | null>(null);
  if (step === "combattimento" && !combatRef.current) {
    combatRef.current = createCombatFromClass(nomeGiocatore, nemico, {
      staminaStart: 3,
      handSize: 3,
    });
  }

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      {step === "scelta" && (
        <SelezioneClasse
          nomeGiocatore={nomeGiocatore}
          onChangeNome={setNomeGiocatore}
          onConferma={() => setStep("combattimento")}
        />
      )}

      {step === "combattimento" && combatRef.current && (
        <SchermataCombattimento combat={combatRef.current} onRestart={() => {
          combatRef.current = null;
          setStep("scelta");
        }} />
      )}
    </main>
  );
}

// ————————————————————————————————————————
// UI: Selezione Classe (per ora solo Guerriero)
// ————————————————————————————————————————
function SelezioneClasse({
  nomeGiocatore,
  onChangeNome,
  onConferma,
}: {
  nomeGiocatore: string;
  onChangeNome: (v: string) => void;
  onConferma: () => void;
}) {
  return (
    <section style={{ display: "grid", gap: 16 }}>
      <h1>Seleziona la classe</h1>

      <label style={{ display: "grid", gap: 6, maxWidth: 360 }}>
        <span>Nome del personaggio</span>
        <input
          value={nomeGiocatore}
          onChange={(e) => onChangeNome(e.target.value)}
          placeholder="Inserisci un nome"
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #2a2f3a",
            background: "#0f1115",
            color: "white",
          }}
        />
      </label>

      {/* Carta-classe: Guerriero */}
      <div
        style={{
          display: "grid",
          gap: 8,
          maxWidth: 420,
          padding: 16,
          border: "1px solid #2a2f3a",
          borderRadius: 12,
          background: "#151922",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700 }}>Guerriero</div>
        <div style={{ opacity: 0.85 }}>
          Un combattente robusto, specializzato in attacchi fisici e difesa.
        </div>
        <ul style={{ margin: "8px 0 0 16px", opacity: 0.85 }}>
          <li>HP: 30 • ATK: 5</li>
          <li>Mazzo iniziale: 3× Colpo di Spada, 2× Difesa, 1× Cura, 1× Riposo</li>
        </ul>

        <button
          onClick={onConferma}
          style={{
            marginTop: 8,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #2a2f3a",
            background: "#1f6feb",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Inizia!
        </button>
      </div>
    </section>
  );
}

// ————————————————————————————————————————
// UI: Schermata Combattimento
// ————————————————————————————————————————
function SchermataCombattimento({
  combat,
  onRestart,
}: {
  combat: ReturnType<typeof createCombatFromClass>;
  onRestart: () => void;
}) {
  const rerender = () => {
    // piccolo trucco: forzo un rerender aggiornando uno state locale
    setTick((t) => t + 1);
  };
  const [tick, setTick] = useState(0);

  const playableClass = (cost: number) =>
    combat.state.stamina >= cost && !combat.isOver ? "card card-enter card--playable" : "card card-enter card--unplayable";

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
          Fine turno
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
      <div
        style={{
          marginTop: 8,
          maxHeight: 200,
          overflowY: "auto",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 12,
          padding: 12,
          border: "1px solid #2a2f3a",
          borderRadius: 8,
          background: "#0f1115",
        }}
      >
        {combat.log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

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

function StatPanel({
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
