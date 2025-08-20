import type { Fighter } from "./combat";
import type { Card } from "./carte";

export type ClasseId = "guerriero" | "elementalista";

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
  descrizione: "Un combattetente corpo a corpo, dotato di armatura",
  baseStats: {
    hp: 30,
    hpMax: 30,
    atk: 5, 
    defense: 10,
    stunned: 0, 
  },
  staminaBase: 6, 
  mazzoIniziale: [
    "spada", "spada", "spada",
    "scudo",
    "poz_cura",
  ],
};
// Elementalista
export const ELEMENTALISTA: Classe = {
  id: "elementalista", // ID di questa classe non cambiare
  nome: "Elementalista", // cambiare qui il nome della classe per non rompere i collegamenti
  descrizione: "Un mago specializzato nel controllo degli elementi",
  baseStats: {
    hp: 15,
    hpMax: 15,
    atk: 5, 
    defense: 0,
    stunned: 0,
  },
  staminaBase: 10, 
  mazzoIniziale: [
    "fiammata", "fiammata", "fiammata", "fiammata",
    "armatura", "armatura",
    "vapore",
  ],
};

// Collezione di classi (utile se poi ne aggiungiamo altre)
export const CLASSI = {
  guerriero: GUERRIERO,
  elementalista: ELEMENTALISTA,
} as const satisfies Record<string, Classe>;
