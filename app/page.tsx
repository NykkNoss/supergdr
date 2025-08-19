// app/page.tsx
"use client";

import { useRef, useState } from "react";
import { createCombatFromClass } from "@/lib/combat";
import { GUERRIERO } from "@/lib/classi";
import { SelezioneClasse } from "@/components/selezioneclasse";
import { CombatScreen } from "@/components/CombatScreen";
import { getRandomEnemy } from "@/lib/nemici"; // <— importato

export default function HomePage() {
  const [step, setStep] = useState<"scelta" | "combattimento">("scelta");
  const [nomeGiocatore, setNomeGiocatore] = useState("Eroe");

  const combatRef = useRef<ReturnType<typeof createCombatFromClass> | null>(null);

  if (step === "combattimento" && !combatRef.current) {
    combatRef.current = createCombatFromClass(
      nomeGiocatore,
      getRandomEnemy(), // <— usa un nemico casuale
      GUERRIERO,
      { handSize: 3 }
    );
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
        <CombatScreen
          combat={combatRef.current}
          onRestart={() => {
            combatRef.current = null;
            setStep("scelta");
          }}
        />
      )}
    </main>
  );
}
