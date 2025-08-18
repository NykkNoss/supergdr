"use client";
import { useState } from "react";
import {
  Fighter,
  BattleFlags,
  makePlayer,
  makeGoblin,
  warriorDeck,
  Ability,
  pickTwoRandom,
  restAction,
  enemyTurn,
} from "@/lib/combat";

export default function Home() {
  const [phase, setPhase] = useState<"READY" | "BATTLE" | "GAMEOVER">("READY");

  const [player, setPlayer] = useState<Fighter | null>(null);
  const [enemy, setEnemy] = useState<Fighter | null>(null);
  const [flags, setFlags] = useState<BattleFlags>({
    playerShieldUp: false,
    enemyStunned: false,
  });
  const [log, setLog] = useState<string[]>([]);

  // Mazzo abilità del Guerriero (array, non funzione!)
  const deck: Ability[] = warriorDeck();

  // Abilità pescate per il turno
  const [options, setOptions] = useState<Ability[]>([]);

  function startBattle() {
    const p = makePlayer();
    const e = makeGoblin();
    setPlayer(p);
    setEnemy(e);
    setFlags({ playerShieldUp: false, enemyStunned: false });
    setLog([`Entri in battaglia contro un ${e.name}!`]);
    setOptions(pickTwoRandom(deck));
    setPhase("BATTLE");
  }

  function nextGoblin() {
    const e = makeGoblin();
    setEnemy(e);
    setFlags({ playerShieldUp: false, enemyStunned: false });
    setLog((prev) => [`Arriva un nuovo ${e.name}!`, ...prev]);
    setOptions(pickTwoRandom(deck));
  }

  function resetGame() {
    setPhase("READY");
    setPlayer(null);
    setEnemy(null);
    setFlags({ playerShieldUp: false, enemyStunned: false });
    setLog([]);
    setOptions([]);
  }

  function doRest() {
    if (!player || !enemy) return;
    const res = restAction(player);
    setPlayer(res.player);
    setLog((prev) => [...res.logs, ...prev]);

    // turno nemico dopo il riposo
    const et = enemyTurn(enemy, res.player, flags);
    setPlayer(et.player);
    setFlags(et.flags);
    setLog((prev) => [...et.logs, ...prev]);

    // nuove opzioni
    if (et.player.hp <= 0) {
      setPhase("GAMEOVER");
      setLog((prev) => ["Sei stato sconfitto... 💀", ...prev]);
    } else {
      setOptions(pickTwoRandom(deck));
    }
  }

  function useAbility(ab: Ability) {
    if (!player || !enemy) return;
    // se non ho stamina sufficiente → ignora
    if (player.sta < ab.staminaCost) return;

    const used = ab.use(player, enemy, flags);
    setPlayer(used.player);
    setEnemy(used.enemy);
    setFlags(used.flags);
    setLog((prev) => [...used.logs, ...prev]);

    // se il nemico muore → nuovo goblin, niente contrattacco
    if (used.enemyDiedFromAction) {
      setLog((prev) => [`Hai sconfitto il ${enemy.name}!`, ...prev]);
      setTimeout(nextGoblin, 250);
      return;
    }

    // contrattacco nemico
    const et = enemyTurn(used.enemy, used.player, used.flags);
    setPlayer(et.player);
    setFlags(et.flags);
    setLog((prev) => [...et.logs, ...prev]);

    if (et.player.hp <= 0) {
      setPhase("GAMEOVER");
      setLog((prev) => ["Sei stato sconfitto... 💀", ...prev]);
    } else {
      setOptions(pickTwoRandom(deck));
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center gap-6 p-6">
      <h1 className="text-3xl font-bold">GDR Testuale — Sistema Stamina</h1>

      {phase === "READY" && (
        <section className="w-full max-w-xl p-4 border rounded-2xl space-y-4">
          <p className="opacity-80">
            Personaggio: <b>Guerriero</b> — ATK 5 • DEF 10 • HP 12 • Stamina 4/6. <br />
            Nemico: <b>Goblin</b> — ATK 2 • DEF 2 • HP 6. <br />
            Hit 75% • Critico 5% • Riposa: +3 Stamina. Le abilità consumano stamina.
          </p>
          <button
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            onClick={startBattle}
          >
            Inizia Battaglia
          </button>
        </section>
      )}

      {phase !== "READY" && player && enemy && (
        <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Player */}
          <div className="p-4 border rounded-2xl">
            <h3 className="text-lg font-semibold mb-2">Tu</h3>
            <p><b>Classe:</b> {player.name}</p>
            <p><b>ATK:</b> {player.atk} • <b>DEF:</b> {player.def}</p>
            <p><b>HP:</b> {player.hp}/{player.maxHp}</p>
            <div className="w-full bg-gray-200 h-2 rounded mt-2">
              <div className="h-2 bg-green-600 rounded" style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
            </div>
            <p className="mt-2"><b>Stamina:</b> {player.sta}/{player.maxSta}</p>
            <div className="w-full bg-gray-200 h-2 rounded mt-2">
              <div className="h-2 bg-yellow-500 rounded" style={{ width: `${(player.sta / player.maxSta) * 100}%` }} />
            </div>

            {/* Azioni */}
            {phase === "BATTLE" && (
              <div className="mt-4 grid grid-cols-1 gap-2">
                <button
                  className="w-full px-4 py-2 rounded-xl bg-slate-700 text-white hover:bg-slate-800"
                  onClick={doRest}
                >
                  Riposa (+3 Stamina)
                </button>

                {options.map((ab) => {
                  const disabled = player.sta < ab.staminaCost;
                  return (
                    <button
                      key={ab.key}
                      disabled={disabled}
                      onClick={() => useAbility(ab)}
                      className={`w-full px-4 py-2 rounded-xl text-white ${
                        disabled
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-amber-600 hover:bg-amber-700"
                      }`}
                      title={disabled ? "Stamina insufficiente" : ""}
                    >
                      {ab.name} — {ab.staminaCost} STA
                    </button>
                  );
                })}
              </div>
            )}

            {phase === "GAMEOVER" && (
              <button
                className="mt-4 w-full px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                onClick={resetGame}
              >
                Rigioca
              </button>
            )}
          </div>

          {/* Enemy */}
          <div className="p-4 border rounded-2xl">
            <h3 className="text-lg font-semibold mb-2">Nemico</h3>
            <p><b>Nome:</b> {enemy.name}</p>
            <p><b>ATK:</b> {enemy.atk} • <b>DEF:</b> {enemy.def}</p>
            <p><b>HP:</b> {enemy.hp}/{enemy.maxHp}</p>
            <div className="w-full bg-gray-200 h-2 rounded mt-2">
              <div className="h-2 bg-red-600 rounded" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
            </div>

            {(flags.playerShieldUp || flags.enemyStunned) && (
              <div className="mt-3 text-sm">
                {flags.playerShieldUp && <div>🛡️ Scudo alzato: annullerai il prossimo danno.</div>}
                {flags.enemyStunned && <div>🌀 Nemico stordito: salterà il prossimo attacco.</div>}
              </div>
            )}
          </div>

          {/* Log */}
          <div className="p-4 border rounded-2xl md:col-span-1">
            <h3 className="text-lg font-semibold mb-2">Log</h3>
            <ul className="space-y-1 max-h-80 overflow-auto text-sm">
              {log.map((entry, i) => (
                <li key={i}>• {entry}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
