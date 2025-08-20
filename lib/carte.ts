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

/* ──────────────────────────────────────────────────────────────
  TEMPLATE CARTA

  {
    id: "id-unico",
    title: "Titolo",
    cost: 1,
    description: "Descrizione…",
    effect: "attacco" | "cura" | "difesa" | "stordimento" | "riposa",
    value: 0,
    classes?: Array<Classe["id"]>;
  },
────────────────────────────────────────────────────────────── */
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
    title: "❤️Pozione Curativa❤️",
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
  {
    id: "fiammata",
    title: "Fiammata",
    cost: 2,
    description: "Infliggi 2 danni.",
    effect: "attacco",
    value: 2,
  },
    {
    id: "armatura",
    title: "Armatura di Ghiaccio",
    cost: 1,
    description: "Ottieni 3 Difesa.",
    effect: "difesa",
    value: 3,
  },
    {
    id: "vapore",
    title: "Nube di Vapore",
    cost: 3,
    description: "Recuperi 10 HP",
    effect: "cura",
    value: 10,
  },
];
