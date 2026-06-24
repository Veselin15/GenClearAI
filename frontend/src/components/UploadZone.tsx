"use client";

import { useRef, useState } from "react";

interface Props {
  file: File | null;
  onSelect: (f: File | null) => void;
  disabled?: boolean;
  id?: string;
  variant?: "default" | "dashboard";
}

export function UploadZone({ file, onSelect, disabled, id = "upload-zone", variant = "default" }: Props) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cls = variant === "dashboard" ? "dropzone dropzone-app" : "dropzone";

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    if (disabled) return;
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("video/")) {
      onSelect(f);
    }
  }

  return (
    <div
      id={id}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={file ? `Selected: ${file.name}. Click to change.` : "Upload a video file"}
      className={`${cls} ${drag ? "drag" : ""} ${file ? "has-file" : ""}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); inputRef.current?.click(); } }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      style={{ opacity: disabled ? 0.45 : 1, pointerEvents: disabled ? "none" : "auto" }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-matroska,video/webm,.mp4,.mov,.mkv,.webm"
        hidden
        onChange={(e) => { onSelect(e.target.files?.[0] ?? null); e.target.value = ""; }}
      />
      {file ? (
        <>
          <div className="dz-ico">🎞️</div>
          <span className="dz-file">{file.name}</span>
          <div className="muted dz-meta">
            {(file.size / 1048576).toFixed(1)} MB · click to change
          </div>
        </>
      ) : (
        <>
          <div className="dz-ico">⬆</div>
          <div className="dz-label">Drop a video, <b>browse</b>, or <b>Ctrl+V</b></div>
          <div className="muted dz-meta">MP4 · MOV · MKV · WebM · up to 1080p · max 1 GB</div>
        </>
      )}
    </div>
  );
}
