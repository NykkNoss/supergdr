// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createCombatFromClass } from "@/lib/combat";
import { CLASSI, type Classe, type ClasseId } from "@/lib/classi";
import { SelezioneClasse } from "@/components/selezioneclasse";
import { CombatScreen } from "@/components/CombatScreen";
import { getRandomEnemy } from "@/lib/nemici";

type DebugInfo = {
  step: "scelta" | "combattimento";
  classeId: string | null;
  classeResolved?: { id: string; nome: string } | null;
  enemyResolved?: { id: string; name: string; hpMax: number } | null;
  notes?: string[];
};

export default function HomePage() {
  const [step, setStep] = useState<"scelta" | "combattimento">("scelta");
  const [nomeGiocatore, setNomeGiocatore] = useState("Eroe");
  const [classeId, setClasseId] = useState<ClasseId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<DebugInfo>({ step: "scelta", classeId: null, notes: [] });

  const combatRef = useRef<ReturnType<typeof createCombatFromClass> | null>(null);

  useEffect(() => {
    setDebug((d) => ({ ...d, step, classeId, notes: d.notes ?? [] }));
  }, [step, classeId]);

  useEffect(() => {
    if (step !== "combattimento" || combatRef.current) return;

    try {
      // 1) Risolvo la classe dall'id (fallback alla prima)
      const classe: Classe | undefined =
        (classeId && CLASSI[classeId]) || Object.values(CLASSI)[0];

      if (!classe) {
        setError("Nessuna classe disponibile o id non valido.");
        setDebug((d) => ({
          ...d,
          classeResolved: null,
          notes: [...(d.notes ?? []), "classe undefined"],
        }));
        setStep("scelta");
        return;
      }

      setDebug((d) => ({
        ...d,
        classeResolved: { id: classe.id as string, nome: classe.nome },
        notes: [...(d.notes ?? []), "classe ok"],
      }));

      // 2) Creo il nemico
      const enemy = getRandomEnemy();
      if (!enemy || !Number.isFinite(enemy.hpMax)) {
        setError("Nemico non valido.");
        setDebug((d) => ({
          ...d,
          enemyResolved: enemy ? { id: enemy.id, name: enemy.name, hpMax: Number(enemy.hpMax) || 0 } : undefined,
          notes: [...(d.notes ?? []), "enemy invalid"],
        }));
        setStep("scelta");
        return;
      }

      setDebug((d) => ({
        ...d,
        enemyResolved: { id: enemy.id, name: enemy.name, hpMax: enemy.hpMax },
        notes: [...(d.notes ?? []), "enemy ok"],
      }));

      // 3) Creo il combat
      combatRef.current = createCombatFromClass(
        nomeGiocatore,
        enemy,
        classe,
        { handSize: 3 }
      );

      setDebug((d) => ({
        ...d,
        notes: [...(d.notes ?? []), "combat creato"],
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError("Errore creazione combat: " + msg);
      setDebug((d) => ({ ...d, notes: [...(d.notes ?? []), "catch: " + msg] }));
      combatRef.current = null;
      setStep("scelta");
    }
  }, [step, classeId, nomeGiocatore]);

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto", color: "#e6edf3" }}>
      {/* Pannello errori visibile (niente black screen silenziosi) */}
      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ff4d4f",
            background: "#2a1416",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Errore</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{error}</div>

          <details style={{ marginTop: 8 }}>
            <summary>Dettagli diagnostica</summary>
            <pre style={{ fontSize: 12, overflowX: "auto" }}>
{JSON.stringify(debug, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {step === "scelta" && (
        <SelezioneClasse
          nomeGiocatore={nomeGiocatore}
          onChangeNome={(v) => {
            setError(null);
            setNomeGiocatore(v);
          }}
          onConferma={(id) => {
            setError(null);
            setClasseId(id);
            setStep("combattimento");
          }}
        />
      )}

      {step === "combattimento" && combatRef.current && (
        <CombatScreen
          combat={combatRef.current}
          onRestart={() => {
            combatRef.current = null;
            setClasseId(null);
            setError(null);
            setStep("scelta");
          }}
        />
      )}
    </main>
  );
}
