"use client";

import { useEffect, useState } from "react";

const SHORTCUTS = [
  { keys: "?", desc: "Show keyboard shortcuts" },
  { keys: "U", desc: "Focus upload zone (dashboard)" },
  { keys: "Esc", desc: "Close modals" },
];

export function ShortcutHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div className="modal-bg" onClick={() => setOpen(false)}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h3>Keyboard shortcuts</h3>
        <ul className="shortcut-list">
          {SHORTCUTS.map((s) => (
            <li key={s.keys}>
              <kbd>{s.keys}</kbd>
              <span>{s.desc}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => setOpen(false)}>Close</button>
      </div>
    </div>
  );
}
