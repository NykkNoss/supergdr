// lib/nemici.ts
import type { Fighter } from "./combat";

export type Nemico = Fighter;

// Template sorgente (non usato direttamente in partita)
type EnemyTemplate = {
  id: string;
  name: string;
  hpMax: number | string;
  atk: number | string;
  defense?: number | string;
  stunned?: number | string;
};

const TEMPLATES: Readonly<EnemyTemplate[]> = [
  { id: "goblin",    name: "Goblin",    hpMax: 10, atk: 3, defense: 0, stunned: 0 },
  { id: "scheletro", name: "Scheletro", hpMax: 5,  atk: 1, defense: 0, stunned: 0 },
  { id: "orco",      name: "Orco",      hpMax: 20, atk: 5, defense: 2, stunned: 0 },
];

// --- util numerica robusta
function toInt(n: unknown, fb = 0): number {
  const v =
    typeof n === "string" ? Number.parseInt(n, 10)
    : typeof n === "number" ? n
    : Number(n);
  return Number.isFinite(v) ? v : fb;
}

// Costruisce un nemico NUOVO (mai il template per riferimento)
function buildEnemy(t: EnemyTemplate): Nemico {
  const hpMax = Math.max(1, toInt(t.hpMax, 1));
  return {
    id: t.id,
    name: t.name,
    hpMax,
    hp: hpMax, // full life all’avvio
    atk: toInt(t.atk, 0),
    defense: toInt(t.defense, 0),
    stunned: Math.max(0, toInt(t.stunned, 0)),
  };
}

// — API minimale —
// Ritorna sempre un oggetto nuovo e normalizzato
export function getRandomEnemy(): Nemico {
  const t = TEMPLATES[(Math.random() * TEMPLATES.length) | 0];
  return buildEnemy(t);
}
