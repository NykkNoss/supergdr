// /lib/combat.ts
// Engine del combattimento: gestione mazzo, mano, stamina, turni e applicazione effetti.

import { CARTE, type Card } from "./carte";
import { applyCardEffect } from "./effetti";
import type { Classe } from "./classi";

// ========= Tipi esportati (usabili anche in app/page.tsx e in effetti.ts) =========

export type Fighter = {
  id: string;
  name: string;
  hp: number;
  hpMax: number;
  atk: number;
  defense: number;
  stunned: number;
};

/**
 * Stato "core" del combattimento, senza le pile (che sono nel DeckState).
 */
export type BattleState = {
  player: Fighter;
  enemy: Fighter;
  stamina: number;
  staminaMax: number;
};

/**
 * Risultato di un effetto carta.
 * - `state` è obbligatorio (così puoi fare this.state = res.state senza errori)
 * - `log` è obbligatorio (così puoi fare this.log.push(...res.log) senza errori)
 * - opzionali: drawCards, endTurn (se l'effetto forza pesca o fine turno)
 */
export type EffectResult = {
  state: BattleState;
  log: string[];
  drawCards?: number;
  endTurn?: boolean;
  error?: string;
};

// ========= Tipi interni al combat =========

export type DeckState = {
  drawPile: Card[];    // pescate da qui
  discardPile: Card[]; // scarti qui
  hand: Card[];        // carte in mano
  handSize: number;
};

export type CombatLog = string[];

export type Combat = {
  state: BattleState;
  deck: DeckState;
  log: CombatLog;
  isOver: boolean;               // true se qualcuno è a 0 HP
  winner: "player" | "enemy" | null;
  // API
  draw: (n?: number) => void;
  canPlay: (card: Card) => boolean;
  playCard: (cardId: string) => void;
  endTurn: () => void;
};

// ========= Utility robuste =========

function deepClone<T>(v: T): T {
  // Evita mutazioni condivise tra partite (soprattutto su mobile/StrictMode)
  if (typeof structuredClone === "function") return structuredClone(v);
  return JSON.parse(JSON.stringify(v));
}

function toInt(n: unknown, fallback = 0): number {
  const v =
    typeof n === "string"
      ? Number.parseInt(n as string, 10)
      : typeof n === "number"
      ? n
      : Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function randShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getCardById(id: string): Card | undefined {
  return CARTE.find((c) => c.id === id);
}

function checkGameOver(state: BattleState): { over: boolean; winner: "player" | "enemy" | null } {
  if (state.player.hp <= 0 && state.enemy.hp <= 0) return { over: true, winner: null };
  if (state.player.hp <= 0) return { over: true, winner: "enemy" };
  if (state.enemy.hp <= 0) return { over: true, winner: "player" };
  return { over: false, winner: null };
}

function normalizeFighter(src: Partial<Fighter>): Fighter {
  const hpMax = Math.max(1, toInt(src.hpMax ?? src.hp ?? 1, 1));
  const id =
    src.id ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `f_${Math.random().toString(36).slice(2)}`);

  const name = src.name ?? "Sconosciuto";
  const atk = toInt(src.atk, 0);
  const defense = toInt(src.defense, 0);
  const stunned = Math.max(0, toInt(src.stunned, 0));
  // Se hp manca o non è valido → parte full life
  const hp = clamp(toInt(src.hp, hpMax), 0, hpMax);

  return { id, name, hpMax, hp, atk, defense, stunned };
}

function buildPlayerFromClasse(playerName: string, classe: Classe): Fighter {
  // Tollerante: se qualche campo della classe fosse stringa, lo normalizziamo
  const base = (classe as any).baseStats ?? {};
  const hpMax = Math.max(1, toInt(base.hpMax ?? base.hp ?? 1, 1));

  return normalizeFighter({
    id: "player",
    name: playerName,
    hpMax,
    hp: hpMax,
    atk: toInt(base.atk, 0),
    defense: toInt(base.defense, 0),
    stunned: toInt(base.stunned, 0),
  });
}

function buildDeckFromClasse(classe: Classe): Card[] {
  // La classe fornisce un array di ID carta (mazzoIniziale)
  const ids: unknown[] = (classe as any).mazzoIniziale ?? [];
  const cards: Card[] = [];
  for (const raw of ids) {
    const id = String(raw);
    const card = getCardById(id);
    if (card) cards.push(card);
  }
  return cards;
}

// ========= Inizializzazione =========

export function createCombatFromClass(
  playerName: string,
  enemy: Fighter,
  classe: Classe,
  options?: { handSize?: number }
): Combat {
  // CLONA e normalizza per evitare mutazioni condivise e/o stringhe numeriche
  const enemyBase = normalizeFighter(deepClone(enemy));
  // Sempre full life all'inizio
  enemyBase.hp = enemyBase.hpMax;

  const playerBase = buildPlayerFromClasse(playerName, classe);

  // Stamina iniziale/massima presa dalla classe (tollerante)
  const staminaMax = Math.max(0, toInt((classe as any).staminaBase ?? 0, 0));
  const stamina = staminaMax;

  // Dimensione mano
  const handSize = Math.max(0, toInt(options?.handSize ?? 3, 3));

  // Stato "core"
  const state: BattleState = {
    player: playerBase,
    enemy: enemyBase,
    stamina,
    staminaMax,
  };

  // Crea il mazzo dalla classe (mapping degli id alle Card)
  const startDeck: Card[] = buildDeckFromClasse(classe);

  const deck: DeckState = {
    drawPile: randShuffle(startDeck),
    discardPile: [],
    hand: [],
    handSize,
  };

  const combat: Combat = {
    state,
    deck,
    log: [],
    isOver: false,
    winner: null,

    draw(n = deck.handSize) {
      for (let i = 0; i < n; i++) {
        // Se drawPile è vuota, rimescola gli scarti
        if (this.deck.drawPile.length === 0 && this.deck.discardPile.length > 0) {
          this.deck.drawPile = randShuffle(this.deck.discardPile);
          this.deck.discardPile = [];
          this.log.push("🔁 Rimescoli gli scarti nel mazzo.");
        }
        const card = this.deck.drawPile.shift();
        if (!card) break;
        this.deck.hand.push(card);
      }
      // (Se usi animazioni CSS, qui puoi triggerare classi tipo "card-enter")
    },

    canPlay(card: Card) {
      if (this.isOver) return false;
      return this.state.stamina >= card.cost;
    },

    playCard(cardId: string) {
      if (this.isOver) return;
      const idx = this.deck.hand.findIndex((c) => c.id === cardId);
      if (idx === -1) return;

      const card = this.deck.hand[idx];
      if (!this.canPlay(card)) {
        this.log.push(`❌ Stamina insufficiente per giocare "${card.title}".`);
        return;
      }

      // Applica effetto (usa effetti.ts)
      const res = applyCardEffect(card, this.state) as EffectResult;

      // Aggiorna stato e log (res.state e res.log sono obbligatori per tipo)
      this.state = res.state;
      if (res.log?.length) this.log.push(...res.log);

      // Pescate forzate dall'effetto
      if (typeof res.drawCards === "number" && res.drawCards > 0) {
        this.draw(res.drawCards);
      }

      // Sposta la carta negli scarti
      this.deck.discardPile.push(card);
      this.deck.hand.splice(idx, 1);

      // Controllo fine partita
      const afterPlay = checkGameOver(this.state);
      if (afterPlay.over) {
        this.isOver = true;
        this.winner = afterPlay.winner;
        if (this.winner === "player") this.log.push(`🏆 ${this.state.player.name} ha sconfitto ${this.state.enemy.name}!`);
        else if (this.winner === "enemy") this.log.push(`💀 ${this.state.player.name} è stato sconfitto.`);
        else this.log.push(`☠️ Siete caduti entrambi.`);
        return;
      }

      // Fine turno forzata dall'effetto
      if (res.endTurn) this.endTurn();
    },

    endTurn() {
      if (this.isOver) return;

      // ——— Turno NEMICO ———
      if (this.state.enemy.stunned > 0) {
        this.state.enemy.stunned = Math.max(0, this.state.enemy.stunned - 1);
        this.log.push(`💫 ${this.state.enemy.name} è stordito e salta il turno.`);
      } else {
        const raw = Math.max(0, Math.floor(toInt(this.state.enemy.atk, 0)));
        if (raw > 0) {
          // Danno al player rispettando la difesa
          const beforeDef = this.state.player.defense;
          const absorbed = Math.min(beforeDef, raw);
          this.state.player.defense = Math.max(0, beforeDef - absorbed);
          const hpDamage = raw - absorbed;
          if (hpDamage > 0) {
            this.state.player.hp = clamp(this.state.player.hp - hpDamage, 0, this.state.player.hpMax);
          }
          this.log.push(
            `👹 ${this.state.enemy.name} attacca: ${raw} danni (assorbiti ${absorbed}, ${hpDamage} a HP) a ${this.state.player.name}.`
          );
        } else {
          this.log.push(`👹 ${this.state.enemy.name} osserva e non attacca.`);
        }
      }

      // Controllo morte dopo l’azione nemico
      const afterEnemy = checkGameOver(this.state);
      if (afterEnemy.over) {
        this.isOver = true;
        this.winner = afterEnemy.winner;
        if (this.winner === "player") this.log.push(`🏆 ${this.state.player.name} ha sconfitto ${this.state.enemy.name}!`);
        else if (this.winner === "enemy") this.log.push(`💀 ${this.state.player.name} è stato sconfitto.`);
        else this.log.push(`☠️ Siete caduti entrambi.`);
        return;
      }

      // ——— Preparazione nuovo turno del GIOCATORE ———
      const regen = 3;
      this.state.stamina = Math.min(this.state.stamina + regen, this.state.staminaMax);

      // Scarta la mano e ripesca
      if (this.deck.hand.length) {
        this.deck.discardPile.push(...this.deck.hand);
        this.deck.hand = [];
      }
      this.draw(this.deck.handSize);
    },
  };

  // Mano iniziale + log iniziale
  combat.draw(combat.deck.handSize);
  combat.log.push(`⚔️ Inizia lo scontro: ${combat.state.player.name} vs ${combat.state.enemy.name}.`);
  return combat;
}
