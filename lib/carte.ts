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
    title: "⚔️Colpo di Spada⚔️",
    cost: 2,
    description: "Infliggi 2 Danni.",
    effect: "attacco",
    value: 2,
  },
  {
    id: "scudo",
    title: "🛡️In Alto lo Scudo🛡️",
    cost: 1,
    description: "Ottieni 3 Difesa.",
    effect: "difesa",
    value: 3,
  },
  {
    id: "poz_cura",
    title: "🫙Pozione Curativa🫙",
    cost: 2,
    description: "Recuperi 5 HP.",
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
