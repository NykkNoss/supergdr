// /lib/effetti.ts
import { Card } from "./carte";
import { BattleState, EffectResult } from "./tipi-combattimento";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Applica il danno tenendo conto della difesa del bersaglio */
function dealDamage(target: "player" | "enemy", rawDamage: number, state: BattleState) {
  const t = target === "player" ? state.player : state.enemy;

  // assorbe prima con la difesa
  const absorbed = Math.min(t.defense, rawDamage);
  t.defense -= absorbed;

  let hpDamage = rawDamage - absorbed;
  if (hpDamage > 0) {
    t.hp = clamp(t.hp - hpDamage, 0, t.hpMax);
  }

  return { absorbed, hpDamage };
}

/** Cura semplice (non supera hpMax) */
function heal(target: "player" | "enemy", amount: number, state: BattleState) {
  const t = target === "player" ? state.player : state.enemy;
  const healed = Math.min(amount, t.hpMax - t.hp);
  t.hp += healed;
  return healed;
}

/** Aggiunge difesa (scudo) al bersaglio */
function addDefense(target: "player" | "enemy", amount: number, state: BattleState) {
  const t = target === "player" ? state.player : state.enemy;
  t.defense += amount;
  return amount;
}

/** Aggiunge turni di stordimento */
function addStun(target: "player" | "enemy", turns: number, state: BattleState) {
  const t = target === "player" ? state.player : state.enemy;
  t.stunned += Math.max(0, Math.floor(turns));
  return t.stunned;
}

/**
 * Applica l’effetto della carta.
 * Regole che hai richiesto:
 * - attacco: infligge danno pari a `value` al nemico
 * - cura: cura il giocatore di `value`
 * - difesa: aggiunge `value` alla difesa del giocatore
 * - stordimento: stordisce il nemico per `value` turni
 * - riposa: recupera `value` stamina
 */
export function applyCardEffect(card: Card, state: BattleState): EffectResult {
  const log: string[] = [];

  // Controllo stamina
  if (state.stamina < card.cost) {
    return { log, state, error: "Stamina insufficiente" };
  }
  state.stamina -= card.cost;

  switch (card.effect) {
    case "attacco": {
      const { absorbed, hpDamage } = dealDamage("enemy", Math.floor(card.value), state);
      log.push(
        `${card.title}: infliggi ${card.value} danni (assorbiti ${absorbed}, ${hpDamage} a HP) a ${state.enemy.name}.`
      );
      break;
    }

    case "cura": {
      const healed = heal("player", Math.floor(card.value), state);
      log.push(`${card.title}: curi ${healed} HP a ${state.player.name}.`);
      break;
    }

    case "difesa": {
      const gained = addDefense("player", Math.floor(card.value), state);
      log.push(`${card.title}: ottieni ${gained} Difesa (scudo).`);
      break;
    }

    case "stordimento": {
      const total = addStun("enemy", Math.floor(card.value), state);
      log.push(`${card.title}: ${state.enemy.name} è stordito per ${card.value} turno/i (totale ${total}).`);
      break;
    }

    case "riposa": {
      state.stamina += Math.floor(card.value);
      log.push(`${card.title}: recuperi ${Math.floor(card.value)} stamina.`);
      break;
    }

    default:
      // Non dovrebbe accadere: i tipi limitano i valori validi
      log.push(`⚠️ Effetto non riconosciuto: ${card.effect}`);
  }

  return { log, state };
}
