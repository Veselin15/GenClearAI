"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, getMe } from "@/lib/api";
import { uploadVideo } from "@/lib/uploadJob";
import { useToast } from "./Toast";

type Tab = "video" | "image";

export function LandingUpload() {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("video");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    getMe().then(() => setAuthed(true)).catch(() => setAuthed(false));
  }, []);

  const pick = useCallback((f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("video/") && !/\.(mp4|mov|mkv|webm)$/i.test(f.name)) {
      toast("Please choose a video file (MP4, MOV, MKV, WebM)", "error");
      return;
    }
    setFile(f);
  }, [toast]);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (tab !== "video" || uploading) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("video/")) {
          const f = item.getAsFile();
          if (f) pick(f);
          break;
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [tab, uploading, pick]);

  async function startUpload() {
    if (!file || uploading) return;

    if (!authed) {
      setShowAuth(true);
      setAuthMode("register");
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const job = await uploadVideo(file, setProgress);
      if (job.status === "finished") {
        toast("Instant — we'd cleaned this exact clip before!", "ok");
      } else {
        toast("Processing started — opening your dashboard", "ok");
      }
      router.push("/app");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
      setUploading(false);
    }
  }

  async function onAuthSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    fd.forEach((v, k) => { if (v) payload[k] = String(v); });
    if (!payload.full_name) delete payload.full_name;

    setAuthLoading(true);
    try {
      await api(`/api/auth/${authMode}`, { method: "POST", body: payload });
      setAuthed(true);
      setShowAuth(false);
      toast(authMode === "login" ? "Welcome back!" : "Account created — uploading…", "ok");
      if (file) {
        setUploading(true);
        setProgress(0);
        try {
          const job = await uploadVideo(file, setProgress);
          router.push("/app");
          if (job.status === "finished") toast("Your clean video is ready!", "ok");
        } catch (err) {
          toast(err instanceof Error ? err.message : "Upload failed", "error");
          setUploading(false);
        }
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Authentication failed", "error");
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <>
      <div className="lp-upload-card card">
        <div className="lp-upload-tabs">
          <button
            type="button"
            className={tab === "image" ? "active" : ""}
            onClick={() => setTab("image")}
          >
            Image
          </button>
          <button
            type="button"
            className={tab === "video" ? "active" : ""}
            onClick={() => setTab("video")}
          >
            Video
          </button>
        </div>

        {tab === "image" ? (
          <div className="lp-upload-soon">
            <div className="lp-upload-soon-icon">🖼️</div>
            <h3>Image removal coming soon</h3>
            <p className="muted">GenClear currently supports Veo &amp; Gemini <strong>video</strong>. Switch to the Video tab to clean a clip now.</p>
            <button type="button" className="btn btn-primary" onClick={() => setTab("video")}>
              Switch to video
            </button>
          </div>
        ) : (
          <>
            <div
              role="button"
              tabIndex={uploading ? -1 : 0}
              aria-label={file ? `Selected: ${file.name}. Click to change.` : "Upload a video file"}
              className={`lp-upload-zone ${drag ? "drag" : ""} ${file ? "has-file" : ""}`}
              onClick={() => !uploading && inputRef.current?.click()}
              onKeyDown={(e) => { if (!uploading && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); inputRef.current?.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                if (!uploading && e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]);
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-matroska,video/webm,.mp4,.mov,.mkv,.webm"
                hidden
                onChange={(e) => pick(e.target.files?.[0] ?? null)}
              />
              {uploading ? (
                <div className="lp-upload-progress">
                  <div className="lp-upload-progress-icon">⬆</div>
                  <p><strong>Uploading… {progress}%</strong></p>
                  <div className="progress"><i style={{ width: `${progress}%` }} /></div>
                  <p className="muted" style={{ fontSize: ".85rem", margin: 0 }}>Then we remove the watermark automatically</p>
                </div>
              ) : file ? (
                <>
                  <div className="lp-upload-file-icon">🎞️</div>
                  <p className="lp-upload-filename">{file.name}</p>
                  <p className="muted" style={{ fontSize: ".85rem", margin: 0 }}>
                    {(file.size / 1048576).toFixed(1)} MB · click to change
                  </p>
                </>
              ) : (
                <>
                  <div className="lp-upload-icon">🎬</div>
                  <p className="lp-upload-title">Drop a video or <b>paste from clipboard</b></p>
                  <p className="muted lp-upload-hint">We remove the watermark and export pixel-perfect MP4</p>
                  <p className="lp-upload-formats">MP4 · MOV · MKV · WebM · up to 1080p</p>
                </>
              )}
            </div>

            {file && !uploading && (
              <button type="button" className="btn btn-primary btn-lg btn-block lp-upload-cta" onClick={startUpload}>
                Remove watermark →
              </button>
            )}

            <div className="lp-upload-footer">
              <span>🔒</span>
              <span>Processed in an isolated sandbox · auto-deletes after 48h · original quality</span>
            </div>
          </>
        )}
      </div>

      {showAuth && (
        <div className="modal-bg" onClick={() => !authLoading && setShowAuth(false)}>
          <div className="modal card lp-auth-modal" role="dialog" aria-modal="true" aria-label="Authentication" onClick={(e) => e.stopPropagation()}>
            <h3>{authMode === "login" ? "Sign in to continue" : "Create free account"}</h3>
            <p className="muted" style={{ fontSize: ".9rem", marginBottom: 20 }}>
              {file ? (
                <>Your clip <strong>{file.name}</strong> is ready — {authMode === "register" ? "sign up takes 10 seconds" : "sign in to upload"}.</>
              ) : (
                "Free tier includes 3 videos. No credit card."
              )}
            </p>
            <div className="lp-auth-tabs">
              <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Register</button>
              <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Sign in</button>
            </div>
            <form onSubmit={onAuthSubmit}>
              {authMode === "register" && (
                <div className="field">
                  <label htmlFor="lp_name">Name (optional)</label>
                  <input type="text" id="lp_name" name="full_name" autoComplete="name" />
                </div>
              )}
              <div className="field">
                <label htmlFor="lp_email">Email</label>
                <input type="email" id="lp_email" name="email" required autoComplete="email" />
              </div>
              <div className="field">
                <label htmlFor="lp_pw">Password</label>
                <input type="password" id="lp_pw" name="password" required minLength={8} autoComplete={authMode === "login" ? "current-password" : "new-password"} />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={authLoading}>
                {authLoading ? "Please wait…" : authMode === "register" ? "Create account & upload" : "Sign in & upload"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
