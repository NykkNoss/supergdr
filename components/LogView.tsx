// /components/LogView.tsx
"use client"; // 👈 serve qui

import { useEffect, useRef } from "react";
import type { Log } from "@/lib/log";

export function LogView({ log }: { log: Log }) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [log.length]);

  return (
    <div
      ref={logRef}
      style={{
        marginTop: 8,
        maxHeight: 200,
        overflowY: "auto",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 12,
        padding: 12,
        border: "1px solid #2a2f3a",
        borderRadius: 8,
        background: "#0f1115",
      }}
    >
      {log.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}
