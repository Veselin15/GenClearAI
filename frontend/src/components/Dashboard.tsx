"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Job, User } from "@/lib/types";
import {
  TERMINAL,
  api,
  fmtDate,
  fmtDuration,
  fmtEta,
  getJobs,
  getMe,
  notifyDone,
  processingPhase,
  requestNotifyPermission,
} from "@/lib/api";
import { useToast } from "./Toast";
import { StatusBadge } from "./StatusBadge";
import { CompareModal } from "./CompareModal";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { ReferralCard } from "./ReferralCard";
import { LiveQueueBanner } from "./LiveQueueBanner";

export function Dashboard({ initialUser }: { initialUser: User }) {
  const { toast } = useToast();
  const [user, setUser] = useState(initialUser);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [webhook, setWebhook] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const sockets = useRef(new Set<string>());
  const notified = useRef(new Set<string>());

  const refreshMe = useCallback(async () => {
    try {
      setUser(await getMe());
    } catch { /* ignore */ }
  }, []);

  const loadJobs = useCallback(async () => {
    try {
      const list = await getJobs();
      setJobs(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  const watch = useCallback((jobId: string) => {
    if (sockets.current.has(jobId)) return;
    sockets.current.add(jobId);
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${window.location.host}/v1/jobs/${jobId}/events`);
    ws.onmessage = (ev) => {
      const d = JSON.parse(ev.data);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: d.status,
                progress: d.progress ?? j.progress,
                has_preview: d.has_preview ?? j.has_preview,
              }
            : j
        )
      );
      if (d.status === "finished" && !notified.current.has(jobId)) {
        notified.current.add(jobId);
        setCelebrateId(jobId);
        notifyDone("Your video is ready!", "Open GenClear to download the clean clip.");
        toast("✨ Done — your cleaned video is ready to download!", "ok");
      }
      if (TERMINAL.includes(d.status)) ws.close();
    };
    ws.onclose = () => {
      sockets.current.delete(jobId);
      loadJobs();
      refreshMe();
    };
    ws.onerror = () => { try { ws.close(); } catch { /* ignore */ } };
  }, [loadJobs, refreshMe, toast]);

  const refreshAndWatch = useCallback(async () => {
    const list = await loadJobs();
    list.forEach((j) => {
      if (j.status === "pending" || j.status === "processing") watch(j.id);
    });
  }, [loadJobs, watch]);

  useEffect(() => {
    if (initialUser.daily_bonus && initialUser.daily_bonus > 0) {
      toast(`🎁 +${initialUser.daily_bonus} daily credit — ${initialUser.streak_days}-day streak!`, "ok");
    }
    refreshAndWatch();
    const id = setInterval(refreshAndWatch, 8000);
    return () => clearInterval(id);
  }, [initialUser.daily_bonus, initialUser.streak_days, refreshAndWatch, toast]);

  const pro = user.plan === "pro";
  const noCredits = !pro && user.credits <= 0;
  const activeJob = jobs.find((j) => j.status === "pending" || j.status === "processing");

  async function submitUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast("Choose a video first", "error"); return; }
    requestNotifyPermission();

    const fd = new FormData();
    fd.append("file", file);
    if (webhook.trim()) fd.append("webhook_url", webhook.trim());

    setUploading(true);
    setProgress(0);

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/v1/jobs");
      xhr.withCredentials = true;
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
      };
      xhr.onload = async () => {
        setUploading(false);
        if (xhr.status === 201) {
          const job = JSON.parse(xhr.responseText);
          if (job.status === "finished") {
            toast("⚡ Instant — we'd cleaned this exact clip before!", "ok");
            setCelebrateId(job.job_id);
          } else {
            const eta = job.eta_sec ? fmtEta(job.eta_sec) : null;
            toast(eta ? `Queued — ready in ${eta}` : "Uploaded — processing started", "ok");
            watch(job.job_id);
          }
          setFile(null);
          setWebhook("");
          await refreshMe();
          await refreshAndWatch();
        } else {
          let msg = "Upload failed";
          try { msg = JSON.parse(xhr.responseText).detail || msg; } catch { /* ignore */ }
          toast(msg, "error");
        }
        resolve();
      };
      xhr.onerror = () => { setUploading(false); toast("Network error", "error"); resolve(); };
      xhr.send(fd);
    });
  }

  async function deleteJob(id: string) {
    try {
      await api(`/v1/jobs/${id}`, { method: "DELETE" });
      if (celebrateId === id) setCelebrateId(null);
      toast("Removed", "ok");
      loadJobs();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "error");
    }
  }

  return (
    <div className="page">
      <LiveQueueBanner />
      <div className="container">
        <div className="page-head">
          <div>
            <h1>Dashboard</h1>
            <p className="muted">Drop a Veo or Gemini clip — we auto-detect and remove the watermark.</p>
          </div>
          {user.streak_days >= 2 && (
            <span className="pill pill-streak">🔥 {user.streak_days}-day streak</span>
          )}
        </div>

        {celebrateId && (() => {
          const j = jobs.find((x) => x.id === celebrateId);
          if (!j || j.status !== "finished") return null;
          return (
            <div className="celebrate card">
              <div>
                <h3>✨ Your video is ready!</h3>
                <p className="muted" style={{ margin: 0, fontSize: ".9rem" }}>
                  {j.from_cache ? "Served instantly from cache — " : ""}
                  {j.watermark_type ? `${j.watermark_type} watermark removed` : "Watermark removed"}
                  {j.processing_sec ? ` in ${fmtDuration(j.processing_sec)}` : ""}.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {j.download_url && (
                  <a className="btn btn-primary" href={j.download_url}>Download now</a>
                )}
                {j.has_preview && (
                  <button className="btn btn-ghost" type="button" onClick={() => setPreviewId(j.id)}>
                    Compare before/after
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setCelebrateId(null)}>Dismiss</button>
              </div>
            </div>
          );
        })()}

        <div className="grid-2">
          <div className="stack">
            <OnboardingChecklist user={user} />
            <ReferralCard user={user} />

            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Credits</h3>
              <div className="credit-box">
                <span className="credit-num">{pro ? "∞" : user.credits}</span>
                <div>
                  <div>{pro ? "Pro — unlimited" : `${user.credits} remaining`}</div>
                  {!pro && user.credits < 3 && (
                    <p className="muted" style={{ margin: "4px 0 0", fontSize: ".8rem" }}>
                      +1 free credit daily (max 5)
                    </p>
                  )}
                </div>
              </div>
              {user.badges.length > 0 && (
                <div className="badges-row">
                  {user.badges.map((b) => (
                    <span key={b.id} className="pill" title={b.desc}>{b.title}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="card" id="upload">
              <h3 style={{ marginBottom: 12 }}>Upload</h3>
              <form onSubmit={submitUpload}>
                <UploadZone file={file} onSelect={setFile} disabled={noCredits || uploading} />
                <details className="advanced" style={{ marginTop: 12 }}>
                  <summary className="muted" style={{ cursor: "pointer", fontSize: ".88rem" }}>Advanced options</summary>
                  <div className="field" style={{ marginTop: 10 }}>
                    <label htmlFor="webhook">Webhook URL</label>
                    <input
                      id="webhook"
                      type="url"
                      className="input"
                      placeholder="https://your-server.com/hook"
                      value={webhook}
                      onChange={(e) => setWebhook(e.target.value)}
                    />
                  </div>
                </details>
                {!uploading && (
                  <button className="btn btn-primary btn-block" type="submit" disabled={!file || noCredits} style={{ marginTop: 12 }}>
                    {file ? "Remove watermark" : "Choose a video first"}
                  </button>
                )}
                {uploading && (
                  <div style={{ marginTop: 12 }}>
                    <div className="progress"><i style={{ width: `${progress}%` }} /></div>
                    <p className="muted" style={{ fontSize: ".82rem", marginTop: 6 }}>Uploading… {progress}%</p>
                  </div>
                )}
              </form>
              {noCredits && (
                <p className="muted" style={{ marginTop: 12, fontSize: ".88rem" }}>
                  Out of credits. <a href="/account">Upgrade to Pro</a> or come back tomorrow for a free one.
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="jobs-head">
              <h3 style={{ margin: 0 }}>Your videos</h3>
              {activeJob?.eta_sec != null && activeJob.status === "pending" && (
                <span className="pill pill-eta">Ready in {fmtEta(activeJob.eta_sec)}</span>
              )}
            </div>
            <div className="jobs">
              {jobs.length === 0 ? (
                <div className="empty">
                  <div className="e-ico">🎬</div>
                  <p>No videos yet</p>
                  <p className="muted" style={{ fontSize: ".88rem" }}>Upload a Veo or Gemini clip to see live progress here.</p>
                </div>
              ) : (
                jobs.map((j) => (
                  <JobRow
                    key={j.id}
                    job={j}
                    highlight={j.id === celebrateId}
                    onDelete={() => deleteJob(j.id)}
                    onPreview={() => setPreviewId(j.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {previewId && <CompareModal jobId={previewId} onClose={() => setPreviewId(null)} />}
    </div>
  );
}

function UploadZone({
  file, onSelect, disabled,
}: { file: File | null; onSelect: (f: File | null) => void; disabled?: boolean }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`dropzone ${drag ? "drag" : ""}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (!disabled && e.dataTransfer.files[0]) onSelect(e.dataTransfer.files[0]);
      }}
      style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}
    >
      <input ref={inputRef} type="file" accept="video/mp4,video/x-matroska,video/quicktime,.mp4,.mkv,.mov" hidden
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)} />
      {file ? (
        <>
          <div className="dz-ico">🎞️</div>
          <span className="dz-file">{file.name}</span>
          <div className="muted" style={{ fontSize: ".82rem", marginTop: 4 }}>
            {(file.size / 1048576).toFixed(1)} MB · click to change
          </div>
        </>
      ) : (
        <>
          <div className="dz-ico">⬆</div>
          <div>Drop a video here or <b>browse</b></div>
          <div className="muted" style={{ fontSize: ".82rem", marginTop: 4 }}>MP4, MKV, MOV · up to 1080p</div>
        </>
      )}
    </div>
  );
}

function JobRow({
  job: j, highlight, onDelete, onPreview,
}: { job: Job; highlight?: boolean; onDelete: () => void; onPreview: () => void }) {
  const meta = [
    fmtDate(j.created_at),
    j.width && j.height ? `${j.width}×${j.height}` : null,
    j.watermark_type,
    j.processing_sec ? fmtDuration(j.processing_sec) : null,
  ].filter(Boolean).join(" · ");
  const active = j.status === "pending" || j.status === "processing";
  const phase = processingPhase(j.status, j.progress);
  const sub = active
    ? (j.status === "pending" && j.eta_sec
        ? `${phase} · ready in ${fmtEta(j.eta_sec)}`
        : phase || "Processing…")
    : (j.error_message && j.status !== "finished" ? j.error_message : meta);

  return (
    <div className={`job ${highlight ? "job-highlight" : ""}`}>
      <div>
        <div className="job-name">
          {j.original_name}
          {j.from_cache && <span className="tag-instant">⚡ Instant</span>}
        </div>
        <div className="job-meta">{sub}</div>
      </div>
      <div className="job-right">
        <StatusBadge status={j.status} />
        {j.status === "finished" && j.has_preview && (
          <button className="btn btn-ghost btn-sm" onClick={onPreview} type="button">Compare</button>
        )}
        {j.status === "finished" && j.download_url && (
          <a className="btn btn-primary btn-sm" href={j.download_url}>Download</a>
        )}
        {TERMINAL.includes(j.status) && (
          <button className="btn btn-ghost btn-sm" onClick={onDelete} type="button" title="Remove">✕</button>
        )}
      </div>
      {active && (
        <div className="job-prog progress">
          <i style={{ width: `${Math.max(j.progress, j.status === "pending" ? 3 : 8)}%` }} />
        </div>
      )}
    </div>
  );
}
