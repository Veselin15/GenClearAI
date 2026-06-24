"use client";

import { useState } from "react";
import Link from "next/link";

const FORMATS = ["MP4", "MKV", "MOV"];
const RESOLUTIONS = ["720p", "1080p"];
const MARKS = ["Gemini diamond", "Veo wordmark", "Legacy Veo text"];

export function CompatibilityChecker() {
  const [format, setFormat] = useState(FORMATS[0]);
  const [res, setRes] = useState(RESOLUTIONS[1]);
  const [mark, setMark] = useState(MARKS[0]);

  return (
    <div className="card compat-checker lp-compat">
      <div className="lp-compat-head">
        <div>
          <h3>Will my clip work?</h3>
          <p className="muted" style={{ fontSize: ".9rem", margin: 0 }}>
            Check compatibility before you sign up — we auto-detect on upload.
          </p>
        </div>
        <Link className="btn btn-primary btn-sm" href="/register">Try it free</Link>
      </div>
      <div className="compat-grid">
        <label>
          Format
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            {FORMATS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </label>
        <label>
          Resolution
          <select value={res} onChange={(e) => setRes(e.target.value)}>
            {RESOLUTIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label>
          Watermark
          <select value={mark} onChange={(e) => setMark(e.target.value)}>
            {MARKS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
      </div>
      <div className="compat-result">
        <span className="compat-ok">✓</span>
        <div>
          <b>Supported — you&apos;re good to go</b>
          <p className="muted" style={{ margin: 0, fontSize: ".85rem" }}>
            {format} · {res} · {mark}. Upload and we handle detection and removal automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
