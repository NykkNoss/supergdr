// /lib/combat.ts
// Engine del combattimento: gestione mazzo, mano, stamina, turni e applicazione effetti.

import { CARTE, type Card } from "./carte";
import { applyCardEffect } from "./effetti";
import type { Classe } from "./classi";

// ========= Tipi esportati =========

export type Fighter = {
  id: string;
  name: string;
  hp: number;
  hpMax: number;
  atk: number;
  defense: number;
  stunned: number;
};

export type BattleState = {
  player: Fighter;
  enemy: Fighter;
  stamina: number;
  staminaMax: number;
};

export type EffectResult = {
  state: BattleState;
  log: string[];
  drawCards?: number;
  endTurn?: boolean;
  error?: string;
};

// ========= Tipi interni =========

export type DeckState = {
  drawPile: Card[];
  discardPile: Card[];
  hand: Card[];
  handSize: number;
};

export type CombatLog = string[];

export type Combat = {
  state: BattleState;
  deck: DeckState;
  log: CombatLog;
  isOver: boolean;
  winner: "player" | "enemy" | null;
  draw: (n?: number) => void;
  canPlay: (card: Card) => boolean;
  playCard: (cardId: string) => void;
  endTurn: () => void;
};

// ========= Utility robuste =========

function deepClone<T>(v: T): T {
  if (typeof structuredClone === "function") return structuredClone(v);
  return JSON.parse(JSON.stringify(v)) as T;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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

function randShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeFighter(src: Partial<Fighter>): Fighter {
  const hpMax = Math.max(1, Number.isFinite(Number(src.hpMax)) ? Number(src.hpMax) : Number(src.hp) || 1);
  const id =
    src.id ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `f_${Math.random().toString(36).slice(2)}`);
  const name = src.name ?? "Sconosciuto";
  const atk = Number.isFinite(Number(src.atk)) ? Number(src.atk) : 0;
  const defense = Number.isFinite(Number(src.defense)) ? Number(src.defense) : 0;
  const stunned = Math.max(0, Number.isFinite(Number(src.stunned)) ? Number(src.stunned) : 0);
  const hpRaw = Number.isFinite(Number(src.hp)) ? Number(src.hp) : hpMax;

  return { id, name, hpMax, hp: clamp(hpRaw, 0, hpMax), atk, defense, stunned };
}

function buildPlayerFromClasse(playerName: string, classe: Classe): Fighter {
  const b = classe.baseStats;
  const hpMax =
    Math.max(1, Number.isFinite(Number(b.hpMax)) ? Number(b.hpMax) : Number(b.hp)) || 1;

  return normalizeFighter({
    id: "player",
    name: playerName,
    hpMax,
    hp: hpMax,
    atk: Number(b.atk) || 0,
    defense: Number(b.defense) || 0,
    stunned: Number(b.stunned) || 0,
  });
}

function buildDeckFromClasse(classe: Classe): Card[] {
  const ids = classe.mazzoIniziale ?? [];
  const cards: Card[] = [];
  for (const id of ids) {
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
  const enemyBase = normalizeFighter(deepClone(enemy));
  enemyBase.hp = enemyBase.hpMax; // sempre full life all’inizio

  const playerBase = buildPlayerFromClasse(playerName, classe);

  const staminaMax = Math.max(0, Number(classe.staminaBase) || 0);
  const stamina = staminaMax;

  const handSize = Math.max(0, options?.handSize ?? 3);

  const state: BattleState = {
    player: playerBase,
    enemy: enemyBase,
    stamina,
    staminaMax,
  };

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
        if (this.deck.drawPile.length === 0 && this.deck.discardPile.length > 0) {
          this.deck.drawPile = randShuffle(this.deck.discardPile);
          this.deck.discardPile = [];
          this.log.push("🔁 Rimescoli gli scarti nel mazzo.");
        }
        const card = this.deck.drawPile.shift();
        if (!card) break;
        this.deck.hand.push(card);
      }
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

      const res = applyCardEffect(card, this.state) as EffectResult;

      this.state = res.state;
      if (res.log?.length) this.log.push(...res.log);

      if (typeof res.drawCards === "number" && res.drawCards > 0) {
        this.draw(res.drawCards);
      }

      this.deck.discardPile.push(card);
      this.deck.hand.splice(idx, 1);

      const afterPlay = checkGameOver(this.state);
      if (afterPlay.over) {
        this.isOver = true;
        this.winner = afterPlay.winner;
        if (this.winner === "player") this.log.push(`🏆 ${this.state.player.name} ha sconfitto ${this.state.enemy.name}!`);
        else if (this.winner === "enemy") this.log.push(`💀 ${this.state.player.name} è stato sconfitto.`);
        else this.log.push(`☠️ Siete caduti entrambi.`);
        return;
      }

      if (res.endTurn) this.endTurn();
    },

    endTurn() {
      if (this.isOver) return;

      // ——— Turno NEMICO ———
      if (this.state.enemy.stunned > 0) {
        this.state.enemy.stunned = Math.max(0, this.state.enemy.stunned - 1);
        this.log.push(`💫 ${this.state.enemy.name} è stordito e salta il turno.`);
      } else {
        const raw = Math.max(0, Math.floor(this.state.enemy.atk));
        if (raw > 0) {
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

      const afterEnemy = checkGameOver(this.state);
      if (afterEnemy.over) {
        this.isOver = true;
        this.winner = afterEnemy.winner;
        if (this.winner === "player") this.log.push(`🏆 ${this.state.player.name} ha sconfitto ${this.state.enemy.name}!`);
        else if (this.winner === "enemy") this.log.push(`💀 ${this.state.player.name} è stato sconfitto.`);
        else this.log.push(`☠️ Siete caduti entrambi.`);
        return;
      }

      // ——— Nuovo turno giocatore ———
      const regen = 3;
      this.state.stamina = Math.min(this.state.stamina + regen, this.state.staminaMax);

      if (this.deck.hand.length) {
        this.deck.discardPile.push(...this.deck.hand);
        this.deck.hand = [];
      }
      this.draw(this.deck.handSize);
    },
  };

  combat.draw(combat.deck.handSize);
  combat.log.push(`⚔️ Inizia lo scontro: ${combat.state.player.name} vs ${combat.state.enemy.name}.`);
  return combat;
}
