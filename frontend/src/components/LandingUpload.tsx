"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, getMe } from "@/lib/api";
import { uploadGuestVideo, uploadVideo } from "@/lib/uploadJob";
import { useToast } from "./Toast";
import { GuestResult } from "./GuestResult";
import { GoogleAuthButton, AuthDivider } from "./GoogleAuthButton";
import type { Job } from "@/lib/types";
import { TERMINAL } from "@/lib/api";

type Tab = "video" | "image";
type Phase = "idle" | "uploading" | "processing" | "done";

export function LandingUpload() {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("video");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [jobProgress, setJobProgress] = useState(0);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [guestJob, setGuestJob] = useState<Job | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    getMe().then(() => setAuthed(true)).catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (!showAuth) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !authLoading) setShowAuth(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAuth, authLoading]);

  const pick = useCallback((f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("video/") && !/\.(mp4|mov|mkv|webm)$/i.test(f.name)) {
      toast("Please choose a video file (MP4, MOV, MKV, WebM)", "error");
      return;
    }
    setFile(f);
    setGuestJob(null);
    setPhase("idle");
  }, [toast]);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (tab !== "video" || phase === "uploading" || phase === "processing") return;
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
  }, [tab, phase, pick]);

  async function pollGuestJob(jobId: string): Promise<Job> {
    const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/v1/guest/jobs/${jobId}/events`;
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      let settled = false;
      const timeout = setTimeout(() => {
        ws.close();
        if (!settled) { settled = true; reject(new Error("Processing timed out")); }
      }, 30 * 60 * 1000);

      ws.onmessage = async (ev) => {
        const data = JSON.parse(ev.data);
        if (data.progress != null) setJobProgress(data.progress);
        if (TERMINAL.includes(data.status)) {
          clearTimeout(timeout);
          ws.close();
          if (settled) return;
          settled = true;
          try {
            resolve(await api<Job>(`/v1/guest/jobs/${jobId}`));
          } catch (err) {
            reject(err);
          }
        }
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        if (!settled) { settled = true; reject(new Error("Lost connection to server")); }
      };
      ws.onclose = () => {
        clearTimeout(timeout);
        if (settled) return;
        settled = true;
        api<Job>(`/v1/guest/jobs/${jobId}`)
          .then((job) => {
            if (TERMINAL.includes(job.status)) resolve(job);
            else reject(new Error("Connection lost during processing"));
          })
          .catch(() => reject(new Error("Connection lost during processing")));
      };
    });
  }

  async function startUpload() {
    if (!file || phase === "uploading" || phase === "processing") return;

    if (authed) {
      setPhase("uploading");
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
        setPhase("idle");
      }
      return;
    }

    // Anonymous PLG tier — process without login
    setPhase("uploading");
    setProgress(0);
    setJobProgress(0);
    try {
      const created = await uploadGuestVideo(file, setProgress);
      if (created.status === "finished") {
        const job = await api<Job>(`/v1/guest/jobs/${created.job_id}`);
        setGuestJob(job);
        setPhase("done");
        toast("Your clean clip is ready!", "ok");
        return;
      }
      setPhase("processing");
      const job = await pollGuestJob(created.job_id);
      if (job.status === "failed" || job.status === "skipped") {
        const msg = job.status === "skipped"
          ? "No supported watermark detected in this video"
          : job.error_message || "Processing failed — please try again";
        toast(msg, "error");
        setPhase("idle");
        return;
      }
      setGuestJob(job);
      setPhase("done");
      toast("Watermark removed — compare below", "ok");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      if (msg.includes("free trial used") || msg.includes("create a free account")) {
        setShowAuth(true);
        setAuthMode("register");
        toast("Free trial used — sign up for 3 monthly credits", "info");
      } else {
        toast(msg, "error");
      }
      setPhase("idle");
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
        setPhase("uploading");
        setProgress(0);
        try {
          await uploadVideo(file, setProgress);
          router.push("/app");
        } catch (err) {
          toast(err instanceof Error ? err.message : "Upload failed", "error");
          setPhase("idle");
        }
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Authentication failed", "error");
    } finally {
      setAuthLoading(false);
    }
  }

  const busy = phase === "uploading" || phase === "processing";

  return (
    <>
      <div className="lp-upload-card card">
        <div className="lp-upload-tabs">
          <button type="button" className={tab === "image" ? "active" : ""} onClick={() => setTab("image")}>Image</button>
          <button type="button" className={tab === "video" ? "active" : ""} onClick={() => setTab("video")}>Video</button>
        </div>

        {tab === "image" ? (
          <div className="lp-upload-soon">
            <div className="lp-upload-soon-icon">🖼️</div>
            <h3>Image removal coming soon</h3>
            <p className="muted">GenClear currently supports Veo, Sora &amp; Runway <strong>video</strong>. Switch to the Video tab to clean a clip now.</p>
            <button type="button" className="btn btn-primary" onClick={() => setTab("video")}>Switch to video</button>
          </div>
        ) : guestJob && phase === "done" ? (
          <GuestResult job={guestJob} onRegister={() => { setShowAuth(true); setAuthMode("register"); }} />
        ) : (
          <>
            <div
              role="button"
              tabIndex={busy ? -1 : 0}
              aria-label={file ? `Selected: ${file.name}. Click to change.` : "Upload a video file"}
              className={`lp-upload-zone ${drag ? "drag" : ""} ${file ? "has-file" : ""}`}
              onClick={() => !busy && inputRef.current?.click()}
              onKeyDown={(e) => { if (!busy && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); inputRef.current?.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                if (!busy && e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]);
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-matroska,video/webm,.mp4,.mov,.mkv,.webm"
                hidden
                onChange={(e) => pick(e.target.files?.[0] ?? null)}
              />
              {phase === "uploading" ? (
                <div className="lp-upload-progress">
                  <div className="lp-upload-progress-icon">⬆</div>
                  <p><strong>Uploading… {progress}%</strong></p>
                  <div className="progress"><i style={{ width: `${progress}%` }} /></div>
                  <p className="muted" style={{ fontSize: ".85rem", margin: 0 }}>No account needed — try before you buy</p>
                </div>
              ) : phase === "processing" ? (
                <div className="lp-upload-progress">
                  <div className="lp-upload-progress-icon">⚙</div>
                  <p><strong>Cleaning your clip… {jobProgress}%</strong></p>
                  <div className="progress"><i style={{ width: `${jobProgress}%` }} /></div>
                  <p className="muted" style={{ fontSize: ".85rem", margin: 0 }}>Removing overlays &amp; artifacts automatically</p>
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
                  <p className="lp-upload-title">Drop Gemini video — <b>watermark remove, no login</b></p>
                  <p className="muted lp-upload-hint">One free clean with before/after compare. Timeline-ready MP4.</p>
                  <p className="lp-upload-formats">Gemini · Veo · MP4 · MOV · up to 1080p</p>
                </>
              )}
            </div>

            {file && !busy && (
              <button type="button" className="btn btn-primary btn-lg btn-block lp-upload-cta" onClick={startUpload}>
                Clean my clip — free →
              </button>
            )}

            <div className="lp-upload-footer">
              <span>🔒</span>
              <span>Isolated sandbox · auto-deletes after 24h · no signup for first clean</span>
            </div>
          </>
        )}
      </div>

      {showAuth && (
        <div className="modal-bg" onClick={() => !authLoading && setShowAuth(false)}>
          <div className="modal card lp-auth-modal" role="dialog" aria-modal="true" aria-label="Authentication" onClick={(e) => e.stopPropagation()}>
            <h3>{authMode === "login" ? "Sign in to continue" : "Unlock your studio workspace"}</h3>
            <p className="muted" style={{ fontSize: ".9rem", marginBottom: 20 }}>
              {file ? (
                <>Your clip <strong>{file.name}</strong> is ready — get <strong>3 free credits/month</strong> with a workspace.</>
              ) : (
                "Free tier: 3 monthly credits, 1080p processing, before/after compare. No credit card."
              )}
            </p>
            <GoogleAuthButton label={authMode === "register" ? "Sign up with Google" : "Sign in with Google"} />
            <AuthDivider />
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
