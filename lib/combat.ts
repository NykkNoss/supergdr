// lib/combat.ts

// ===== Types =====
export type Fighter = {
  name: string;
  atk: number;
  def: number;
  hp: number;
  maxHp: number;
  sta: number;       // stamina corrente
  maxSta: number;    // stamina massima
};

export type BattleFlags = {
  playerShieldUp: boolean; // annulla il prossimo danno entrante
  enemyStunned: boolean;   // il nemico salta il prossimo attacco
};

export type Log = string;

// ===== Tuning =====
export const HIT_CHANCE = 0.75;         // % di colpire
export const CRIT_CHANCE = 0.05;        // % critico base
export const REST_STAMINA_GAIN = 3;     // stamina recuperata da Riposa

// ===== Fighters base =====
export function makePlayer(): Fighter {
  return {
    name: "Guerriero",
    atk: 5,
    def: 10,
    hp: 12,
    maxHp: 12,
    sta: 4,
    maxSta: 6,
  };
}

export function makeGoblin(): Fighter {
  return {
    name: "Goblin",
    atk: 2,
    def: 2,
    hp: 6,
    maxHp: 6,
    sta: 0,
    maxSta: 0,
  };
}

// RNG helper
export function roll(prob: number) {
  return Math.random() < prob;
}

// Danno base
export function computeHitAndDamage(
  attacker: Fighter,
  defender: Fighter,
  opts?: { critChance?: number; powerBonus?: number }
) {
  const hit = roll(HIT_CHANCE);
  if (!hit) {
    return { hit: false, crit: false, dmg: 0 };
  }

  const critChance = opts?.critChance ?? CRIT_CHANCE;
  const powerBonus = opts?.powerBonus ?? 0;

  let base = Math.max(1, (attacker.atk + powerBonus) - defender.def);
  const crit = roll(critChance);
  if (crit) base *= 2;

  return { hit: true, crit, dmg: base };
}

// ===== Abilità Guerriero =====
export type WarriorAbilityKey = "SWORD" | "SHIELD" | "FEINT" | "POTION" | "LOWKICK";

export type Ability = {
  key: WarriorAbilityKey;
  name: string;
  staminaCost: number;
  use: (player: Fighter, enemy: Fighter, flags: BattleFlags) => {
    player: Fighter;
    enemy: Fighter;
    flags: BattleFlags;
    logs: Log[];
    enemyDiedFromAction?: boolean;
  };
};

export function warriorDeck(): Ability[] {
  return [
    {
      key: "SWORD",
      name: "Colpo di Spada",
      staminaCost: 2,
      use: (player, enemy, flags) => {
        const logs: Log[] = [];
        const res = computeHitAndDamage(player, enemy, { powerBonus: 2 });
        const newEnemy = { ...enemy };
        if (res.hit) {
          newEnemy.hp = Math.max(0, enemy.hp - res.dmg);
          logs.push(`Colpo di Spada! Infliggi ${res.dmg} danni${res.crit ? " (CRITICO!)" : ""}.`);
        } else {
          logs.push("Colpo di Spada mancato!");
        }
        return {
          player: { ...player, sta: Math.max(0, player.sta - 2) },
          enemy: newEnemy,
          flags: { ...flags },
          logs,
          enemyDiedFromAction: newEnemy.hp <= 0,
        };
      },
    },
    {
      key: "SHIELD",
      name: "In Alto lo Scudo",
      staminaCost: 2,
      use: (player, enemy, flags) => {
        const logs: Log[] = ["Alzi lo scudo: annullerai il prossimo danno in arrivo."];
        return {
          player: { ...player, sta: Math.max(0, player.sta - 2) },
          enemy: { ...enemy },
          flags: { ...flags, playerShieldUp: true },
          logs,
        };
      },
    },
    {
      key: "FEINT",
      name: "Finta e Colpo",
      staminaCost: 3,
      use: (player, enemy, flags) => {
        const logs: Log[] = [];
        const res = computeHitAndDamage(player, enemy, { critChance: 0.3 });
        const newEnemy = { ...enemy };
        if (res.hit) {
          newEnemy.hp = Math.max(0, enemy.hp - res.dmg);
          logs.push(`Finta e Colpo! Infliggi ${res.dmg} danni${res.crit ? " (CRITICO!)" : ""}.`);
        } else {
          logs.push("Finta e Colpo mancato!");
        }
        return {
          player: { ...player, sta: Math.max(0, player.sta - 3) },
          enemy: newEnemy,
          flags: { ...flags },
          logs,
          enemyDiedFromAction: newEnemy.hp <= 0,
        };
      },
    },
    {
      key: "POTION",
      name: "Pozione di Cura",
      staminaCost: 3,
      use: (player, enemy, flags) => {
        const heal = Math.min(3, player.maxHp - player.hp);
        const logs: Log[] = [`Bevi una pozione e recuperi ${heal} HP.`];
        return {
          player: { ...player, hp: player.hp + heal, sta: Math.max(0, player.sta - 3) },
          enemy: { ...enemy },
          flags: { ...flags },
          logs,
        };
      },
    },
    {
      key: "LOWKICK",
      name: "Calcio Basso",
      staminaCost: 2,
      use: (player, enemy, flags) => {
        const logs: Log[] = [`Calcio Basso! ${enemy.name} salterà il prossimo attacco.`];
        return {
          player: { ...player, sta: Math.max(0, player.sta - 2) },
          enemy: { ...enemy },
          flags: { ...flags, enemyStunned: true },
          logs,
        };
      },
    },
  ];
}

// Utility: pescare 2 abilità a caso dal mazzo
export function pickTwoRandom<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, 2);
}

// ===== Azioni standard =====

// Riposa: recupera stamina
export function restAction(player: Fighter) {
  const gained = Math.min(REST_STAMINA_GAIN, player.maxSta - player.sta);
  const newPlayer = { ...player, sta: player.sta + gained };
  const logs: Log[] = [`Riposi e recuperi ${gained} Stamina.`];
  return { player: newPlayer, logs };
}

// Attacco base nemico (Goblin) + gestione scudo/stordito
export function enemyTurn(
  enemy: Fighter,
  player: Fighter,
  flags: BattleFlags
) {
  const logs: Log[] = [];
  const newPlayer = { ...player };
  const newFlags = { ...flags };

  if (flags.enemyStunned) {
    logs.push(`${enemy.name} è stordito e non attacca!`);
    newFlags.enemyStunned = false;
    return { player: newPlayer, flags: newFlags, logs };
  }

  // Goblin fa un attacco semplice ogni turno
  const res = computeHitAndDamage(enemy, player);
  if (res.hit) {
    let incoming = res.dmg;

    if (flags.playerShieldUp) {
      logs.push(`Lo scudo annulla i ${incoming} danni in arrivo!`);
      incoming = 0;
      newFlags.playerShieldUp = false;
    } else {
      logs.push(`${enemy.name} ti colpisce per ${res.dmg} danni${res.crit ? " (CRITICO!)" : ""}.`);
    }

    newPlayer.hp = Math.max(0, player.hp - incoming);
  } else {
    logs.push(`${enemy.name} manca il colpo!`);
  }

  return { player: newPlayer, flags: newFlags, logs };
}
