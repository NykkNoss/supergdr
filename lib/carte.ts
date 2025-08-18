// /lib/carte.ts
export type Card = {
  id: string;
  title: string;
  cost: number;       // stamina richiesta
  description: string;
  image?: string;
  effect: "attacco" | "cura" | "difesa" | "stordimento" | "riposa";
  value: number;
};

export const CARTE: Card[] = [
  {
    id: "spada",
    title: "Colpo di Spada",
    cost: 2,
    description: "Infliggi danni pari al tuo ATK.",
    effect: "attacco",
    value: 1,
  },
  {
    id: "scudo",
    title: "Alzata di Scudo",
    cost: 1,
    description: "Ottieni Difesa pari al valore.",
    effect: "difesa",
    value: 3,
  },
  {
    id: "poz_cura",
    title: "Pozione Curativa",
    cost: 2,
    description: "Recupera HP pari al valore.",
    effect: "cura",
    value: 5,
  },
  {
    id: "riposo",
    title: "Riposo",
    cost: 0,
    description: "Recupera stamina pari al valore.",
    effect: "riposa",
    value: 2,
  },
];
