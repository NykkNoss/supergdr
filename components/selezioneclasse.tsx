"use client";

import { useMemo, useState } from "react";
import type { Classe, ClasseId } from "@/lib/classi";
import { CLASSI } from "@/lib/classi";

type Props = {
  nomeGiocatore: string;
  onChangeNome: (v: string) => void;
  onConferma: (classeId: ClasseId) => void; // ← passa SOLO l'id
  defaultClassId?: ClasseId;
};

function deckCountLines(ids: string[]): string[] {
  const m = new Map<string, number>();
  for (const id of ids ?? []) m.set(id, (m.get(id) ?? 0) + 1);
  // Mostriamo gli ID (niente CARTE -> niente cicli); se vuoi, poi mapperemo ai titoli
  return [...m.entries()].map(([id, n]) => `${n}× ${id}`);
}

export function SelezioneClasse({
  nomeGiocatore,
  onChangeNome,
  onConferma,
  defaultClassId,
}: Props) {
  const classi = useMemo(() => Object.values(CLASSI) as Classe[], []);
  if (!classi.length) {
    return <div style={{ color: "salmon" }}>Nessuna classe trovata.</div>;
  }

  const firstId = (defaultClassId ?? classi[0].id) as ClasseId;
  const [selectedId, setSelectedId] = useState<ClasseId>(firstId);
  const selected = classi.find((c) => c.id === selectedId) ?? classi[0];

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

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        }}
      >
        {classi.map((c) => {
          const sel = c.id === selectedId;
          const deckList = deckCountLines(c.mazzoIniziale);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id as ClasseId)}
              aria-pressed={sel}
              style={{
                textAlign: "left",
                display: "grid",
                gap: 8,
                padding: 16,
                borderRadius: 12,
                border: `2px solid ${sel ? "#1f6feb" : "#2a2f3a"}`,
                background: sel ? "#18233a" : "#151922",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700 }}>{c.nome}</div>
              {c.descrizione && (
                <div style={{ opacity: 0.85 }}>{c.descrizione}</div>
              )}
              <ul style={{ margin: "4px 0 0 16px", opacity: 0.85 }}>
                <li>HP: {c.baseStats.hpMax} • ATK: {c.baseStats.atk}</li>
                {!!deckList.length && (
                  <li>
                    Mazzo iniziale:
                    <ul style={{ marginTop: 6 }}>
                      {deckList.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </li>
                )}
              </ul>
            </button>
          );
        })}
      </div>

      <div>
        <button
          onClick={() => onConferma(selected.id as ClasseId)}
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
          Inizia con {selected.nome}
        </button>
      </div>
    </section>
  );
}
