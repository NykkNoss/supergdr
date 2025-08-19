import { Fighter } from "./combat";
import { Card } from "./carte";

export type ClasseId = "guerriero"; // in futuro aggiungiamo "mago" ecc.

export interface Classe {
  id: ClasseId;
  nome: string;
  descrizione: string;
  baseStats: Omit<Fighter, "id" | "name">; // valori di partenza
  mazzoIniziale: Card["id"][];             // id delle carte iniziali
}

// Definizione del Guerriero
export const GUERRIERO: Classe = {
  id: "guerriero",
  nome: "Guerriero",
  descrizione: "Un combattente robusto, specializzato in attacchi fisici e difesa.",
  baseStats: {
    hp: 30,
    hpMax: 30,
    atk: 5,
    defense: 0,
    stunned: 0,
  },
  mazzoIniziale: [
    "spada", "spada", "spada", // 3 colpi di spada
    "scudo", "scudo",          // 2 difese
    "poz_cura",                // 1 cura
    "riposo"                   // 1 riposo
  ],
};

// Collezione di classi (utile se poi ne aggiungiamo altre)
export const CLASSI: Record<ClasseId, Classe> = {
  guerriero: GUERRIERO,
};
