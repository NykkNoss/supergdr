import { Fighter } from "./combat";
import { Card } from "./carte";

export type ClasseId = "guerriero"; // in futuro aggiungiamo altre classi

export interface Classe {
  id: ClasseId;
  nome: string;
  descrizione: string;
  baseStats: Omit<Fighter, "id" | "name">;
  staminaBase: number;
  mazzoIniziale: Card["id"][];             
}

// GUERRIERO
export const GUERRIERO: Classe = {
  id: "guerriero", // ID di questa classe non cambiare
  nome: "Guerriero", // cambiare qui il nome della classe per non rompere i collegamenti
  descrizione: "Un combattente robusto, specializzato in attacchi fisici e difesa.",
  baseStats: {
    hp: 30,
    hpMax: 30,
    atk: 5, 
    defense: 0,
    stunned: 0, // non ancora implementato
  },
  staminaBase: 6, 
  mazzoIniziale: [
    "spada", "spada", "spada",
    "scudo",
    "poz_cura",
  ],
};


// Collezione di classi (utile se poi ne aggiungiamo altre)
export const CLASSI: Record<ClasseId, Classe> = {
  guerriero: GUERRIERO,
};
