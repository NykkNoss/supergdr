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
  stunned: number; // turni di stordimento rimanenti
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

// ========= Utility =========

function randShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getCardById(id: string): Card | undefined {
  return CARTE.find((c) => c.id === id);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function checkGameOver(state: BattleState): { over: boolean; winner: "player" | "enemy" | null } {
  if (state.player.hp <= 0 && state.enemy.hp <= 0) return { over: true, winner: null };
  if (state.player.hp <= 0) return { over: true, winner: "enemy" };
  if (state.enemy.hp <= 0) return { over: true, winner: "player" };
  return { over: false, winner: null };
}

// ========= Inizializzazione =========

export function createCombatFromClass(
  playerName: string,
  enemy: Fighter,
  classe: Classe,
  options?: { handSize?: number }
) {
  const base = classe.baseStats;
  const player: Fighter = {
    id: "player",
    name: playerName,
    hp: base.hp,
    hpMax: base.hpMax,
    atk: base.atk,
    defense: base.defense,
    stunned: base.stunned,
  };

  // Stamina iniziale/massima presa dalla classe (coerente con il tuo codice)
  const staminaMax = classe.staminaBase;
  const stamina = classe.staminaBase;

  // Dimensione mano
  const handSize = options?.handSize ?? 3;

  // Stato "core" (solo campi di BattleState)
  const state: BattleState = {
    player,
    enemy,
    stamina,
    staminaMax,
  };

  // Crea il mazzo dalla classe (mapping degli id alle Card)
  const startDeck: Card[] = classe.mazzoIniziale
    .map((id) => getCardById(id))
    .filter((c): c is Card => !!c);

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
        // se drawPile è vuota, rimescola gli scarti
        if (this.deck.drawPile.length === 0 && this.deck.discardPile.length > 0) {
          this.deck.drawPile = randShuffle(this.deck.discardPile);
          this.deck.discardPile = [];
          this.log.push("🔁 Rimescoli gli scarti nel mazzo.");
        }
        const card = this.deck.drawPile.shift();
        if (!card) break;
        this.deck.hand.push(card);
      }
      // animazione: quando peschi, le carte in mano possono comparire con la classe CSS "card-enter"
    },

    canPlay(card: Card) {
      // Si può giocare se hai stamina sufficiente e il combattimento non è finito
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
      // Aggiorna stato e log (ora res.state e res.log sono SEMPRE presenti)
      this.state = res.state;
      if (res.log.length) this.log.push(...res.log);

      // Forza pescate se l'effetto lo richiede
      if (typeof res.drawCards === "number" && res.drawCards > 0) {
        this.draw(res.drawCards);
      }

      // Sposta la carta negli scarti
      this.deck.discardPile.push(card);
      this.deck.hand.splice(idx, 1);

      // Controlla se qualcuno è morto
      const result = checkGameOver(this.state);
      if (result.over) {
        this.isOver = true;
        this.winner = result.winner;
        if (this.winner === "player") this.log.push(`🏆 ${this.state.player.name} ha sconfitto ${this.state.enemy.name}!`);
        else if (this.winner === "enemy") this.log.push(`💀 ${this.state.player.name} è stato sconfitto.`);
        else this.log.push(`☠️ Siete caduti entrambi.`);
        return;
      }

      // Se l'effetto forza la fine turno
      if (res.endTurn) this.endTurn();
    },

    endTurn() {
      if (this.isOver) return;

      // ——— Turno NEMICO ———
      // Se nemico stordito: salta turno e decrementa
      if (this.state.enemy.stunned > 0) {
        this.state.enemy.stunned = Math.max(0, this.state.enemy.stunned - 1);
        this.log.push(`💫 ${this.state.enemy.name} è stordito e salta il turno.`);
      } else {
        // Nemico attacca con il suo ATK base
        const raw = Math.max(0, Math.floor(this.state.enemy.atk));
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
      const result = checkGameOver(this.state);
      if (result.over) {
        this.isOver = true;
        this.winner = result.winner;
        if (this.winner === "player") this.log.push(`🏆 ${this.state.player.name} ha sconfitto ${this.state.enemy.name}!`);
        else if (this.winner === "enemy") this.log.push(`💀 ${this.state.player.name} è stato sconfitto.`);
        else this.log.push(`☠️ Siete caduti entrambi.`);
        return;
      }

      // ——— Preparazione nuovo turno del GIOCATORE ———
      const regen = 3;
      this.state.stamina = Math.min(this.state.stamina + regen, this.state.staminaMax);

      // Pesca nuova mano: scarta la mano attuale e ripesca
      this.deck.discardPile.push(...this.deck.hand);
      this.deck.hand = [];
      this.draw(this.deck.handSize);
    },
  };

  // Mano iniziale + log iniziale
  combat.draw(combat.deck.handSize);
  combat.log.push(`⚔️ Inizia lo scontro: ${combat.state.player.name} vs ${combat.state.enemy.name}.`);
  return combat;
}
