"use client";

export function SelezioneClasse({
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
          <li>Mazzo iniziale: 3× Colpo di Spada, 1× Scudo, 1× Cura</li>
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
