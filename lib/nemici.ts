// lib/nemici.ts
import type { createCombatFromClass } from "./combat";

export type Nemico = Parameters<typeof createCombatFromClass>[1];

// Lista nemici disponibili
export const NEMICI: Nemico[] = [
  {
    id: "goblin",
    name: "Goblin",
    hp: 10,
    hpMax: 10,
    atk: 3,
    defense: 0,
    stunned: 0,
  },
  {
    id: "scheletro",
    name: "Scheletro",
    hp: 5,
    hpMax: 5,
    atk: 1,
    defense: 0,
    stunned: 0,
  },
  {
    id: "orco",
    name: "Orco",
    hp: 20,
    hpMax: 20,
    atk: 5,
    defense: 2,
    stunned: 0,
  },
];

// Funzione che restituisce un nemico casuale
export function getRandomEnemy(): Nemico {
  return NEMICI[Math.floor(Math.random() * NEMICI.length)];
}
