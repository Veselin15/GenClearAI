"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Job, User } from "@/lib/types";
import {
  TERMINAL,
  api,
  expiresIn,
  fmtDate,
  fmtDuration,
  fmtEta,
  getJobs,
  getMe,
  getUserSummary,
  notifyDone,
  processingPhase,
  requestNotifyPermission,
} from "@/lib/api";
import { uploadVideo } from "@/lib/uploadJob";
import { useToast } from "./Toast";
import { StatusBadge } from "./StatusBadge";
import { CompareModal } from "./CompareModal";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { ReferralCard } from "./ReferralCard";
import { LiveQueueBanner } from "./LiveQueueBanner";
import { CreatorLevel } from "./CreatorLevel";
import { FileInspector } from "./FileInspector";
import { ProgressRing } from "./ProgressRing";
import { Confetti } from "./Confetti";
import { PageHeader } from "./PageHeader";
import { CardTitle } from "./CardTitle";
import { ProcessingTheatre } from "./ProcessingTheatre";
import { UploadZone } from "./UploadZone";
import type { UserSummary } from "@/lib/types";

type JobFilter = "all" | "active" | "done";

const WS_RECONNECT_DELAY = 2000;
const POLL_INTERVAL = 10000;

export function Dashboard({ initialUser }: { initialUser: User }) {
  const { toast } = useToast();
  const [user, setUser] = useState(initialUser);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [webhook, setWebhook] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewJob, setPreviewJob] = useState<Job | null>(null);
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState<JobFilter>("all");
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const wsMap = useRef(new Map<string, WebSocket>());
  const notified = useRef(new Set<string>());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const u = await getMe();
      if (mounted.current) setUser(u);
    } catch { /* ignore */ }
  }, []);

  const loadJobs = useCallback(async () => {
    try {
      const list = await getJobs();
      if (mounted.current) setJobs(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  const watch = useCallback((jobId: string) => {
    if (wsMap.current.has(jobId)) return;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${window.location.host}/v1/jobs/${jobId}/events`;

    function connect() {
      if (!mounted.current) return;
      const ws = new WebSocket(url);
      wsMap.current.set(jobId, ws);

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
          toast("Done — your cleaned video is ready to download!", "ok");
        }
        if (TERMINAL.includes(d.status)) ws.close();
      };

      ws.onclose = () => {
        wsMap.current.delete(jobId);
        if (mounted.current) {
          loadJobs();
          refreshMe();
        }
      };

      ws.onerror = () => {
        try { ws.close(); } catch { /* ignore */ }
        wsMap.current.delete(jobId);
        if (mounted.current && !notified.current.has(jobId)) {
          setTimeout(connect, WS_RECONNECT_DELAY);
        }
      };
    }

    connect();
  }, [loadJobs, refreshMe, toast]);

  const refreshAndWatch = useCallback(async () => {
    const list = await loadJobs();
    list.forEach((j) => {
      if (j.status === "pending" || j.status === "processing") watch(j.id);
    });
  }, [loadJobs, watch]);

  const pro = user.plan === "pro";
  const noCredits = !pro && user.credits <= 0;

  useEffect(() => {
    if (initialUser.daily_bonus && initialUser.daily_bonus > 0) {
      toast(`+${initialUser.daily_bonus} daily credit — ${initialUser.streak_days}-day streak!`, "ok");
    }
    refreshAndWatch();
    getUserSummary().then(setSummary).catch(() => {});
    const id = setInterval(refreshAndWatch, POLL_INTERVAL);
    return () => {
      clearInterval(id);
      wsMap.current.forEach((ws) => { try { ws.close(); } catch { /* ignore */ } });
      wsMap.current.clear();
    };
  }, [initialUser.daily_bonus, initialUser.streak_days, refreshAndWatch, toast]);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (uploading || noCredits) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("video/")) {
          const f = item.getAsFile();
          if (f) {
            setFile(f);
            toast("Pasted video from clipboard", "ok");
            document.getElementById("upload")?.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          break;
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [uploading, noCredits, toast]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "u" || e.key === "U") {
        document.getElementById("upload-zone")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeJob = jobs.find((j) => j.status === "pending" || j.status === "processing");
  const filteredJobs = jobs.filter((j) => {
    if (jobFilter === "active") return j.status === "pending" || j.status === "processing";
    if (jobFilter === "done") return j.status === "finished";
    return true;
  });
  const activeCount = jobs.filter((j) => j.status === "pending" || j.status === "processing").length;
  const doneCount = jobs.filter((j) => j.status === "finished").length;

  async function submitUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast("Choose a video first", "error"); return; }
    requestNotifyPermission();

    setUploading(true);
    setProgress(0);

    try {
      let job: { job_id: string; status: string; eta_sec?: number | null };

      if (webhook.trim()) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("webhook_url", webhook.trim());
        job = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/v1/jobs");
          xhr.withCredentials = true;
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
          };
          xhr.onload = () => {
            if (xhr.status !== 201) {
              let msg = "Upload failed";
              try { msg = JSON.parse(xhr.responseText).detail || msg; } catch { /* ignore */ }
              reject(new Error(msg));
              return;
            }
            resolve(JSON.parse(xhr.responseText));
          };
          xhr.onerror = () => reject(new Error("Network error — check your connection"));
          xhr.send(fd);
        });
      } else {
        job = await uploadVideo(file, setProgress);
      }

      if (job.status === "finished") {
        toast("Instant — we'd cleaned this exact clip before!", "ok");
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
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function deleteJob(id: string) {
    setDeleting(id);
    try {
      await api(`/v1/jobs/${id}`, { method: "DELETE" });
      if (celebrateId === id) setCelebrateId(null);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast("Removed", "ok");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to remove", "error");
      loadJobs();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="page">
      <Confetti active={!!celebrateId} />
      <LiveQueueBanner />
      <div className="container">
        <PageHeader
          title="Dashboard"
          subtitle="Drop or paste a Veo or Gemini clip — we auto-detect and remove the watermark."
          action={user.streak_days >= 2 ? (
            <span className="pill pill-streak">🔥 {user.streak_days}-day streak</span>
          ) : undefined}
        />

        {summary && summary.finished_jobs > 0 && (
          <div className="summary-strip">
            <div className="summary-chip">
              <b>{summary.finished_jobs}</b>
              <span>clips cleaned</span>
            </div>
            <div className="summary-chip">
              <b>{fmtDuration(summary.total_processing_sec)}</b>
              <span>total processing</span>
            </div>
            {summary.cache_hits > 0 && (
              <div className="summary-chip">
                <b>{summary.cache_hits}</b>
                <span>instant replays</span>
              </div>
            )}
          </div>
        )}

        {celebrateId && (() => {
          const j = jobs.find((x) => x.id === celebrateId);
          if (!j || j.status !== "finished") return null;
          return (
            <div className="celebrate card" role="alert">
              <div>
                <h3>Your video is ready!</h3>
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
                  <button className="btn btn-ghost" type="button" onClick={() => setPreviewJob(j)}>
                    Compare
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setCelebrateId(null)}>Dismiss</button>
              </div>
            </div>
          );
        })()}

        <div className="grid-2">
          <div className="stack">
            <div className="card card-upload" id="upload">
              <CardTitle title="Upload video" icon="⬆" subtitle="Drag, browse, or Ctrl+V" />
              <form onSubmit={submitUpload}>
                <UploadZone file={file} onSelect={setFile} disabled={noCredits || uploading} variant="dashboard" />
                {file && !uploading && <FileInspector file={file} />}
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
                  <button className="btn btn-primary btn-block" type="submit" disabled={!file || noCredits} style={{ marginTop: 14 }}>
                    {file ? "Remove watermark →" : "Choose a video first"}
                  </button>
                )}
                {uploading && (
                  <div style={{ marginTop: 12 }}>
                    <div className="progress"><i style={{ width: `${progress}%` }} /></div>
                    <p className="muted" style={{ fontSize: ".82rem", marginTop: 6 }}>
                      {progress < 100 ? `Uploading… ${progress}%` : "Processing upload…"}
                    </p>
                  </div>
                )}
              </form>
              {noCredits && (
                <p className="muted" style={{ marginTop: 12, fontSize: ".88rem" }}>
                  Out of credits. <Link href="/account" className="link-accent">Upgrade to Pro</Link> or come back tomorrow for a free one.
                </p>
              )}
            </div>

            <div className="card">
              <CardTitle title="Credits" icon="◈" />
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

            <OnboardingChecklist user={user} />
            <CreatorLevel user={user} />
            <ReferralCard user={user} />
          </div>

          <div className="card card-jobs">
            {activeJob && (
              <ProcessingTheatre
                status={activeJob.status}
                progress={activeJob.progress}
                filename={activeJob.original_name}
              />
            )}
            <CardTitle
              title="Your videos"
              icon="🎬"
              action={activeJob?.eta_sec != null && activeJob.status === "pending" ? (
                <span className="pill pill-eta">Ready in {fmtEta(activeJob.eta_sec)}</span>
              ) : undefined}
            />
            {jobs.length > 0 && (
              <div className="job-tabs" role="tablist">
                {(["all", "active", "done"] as const).map((tab) => {
                  const count = tab === "all" ? jobs.length : tab === "active" ? activeCount : doneCount;
                  const label = tab.charAt(0).toUpperCase() + tab.slice(1);
                  return (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={jobFilter === tab}
                      className={`job-tab ${jobFilter === tab ? "active" : ""}`}
                      onClick={() => setJobFilter(tab)}
                    >
                      {label}{count > 0 && <span className="job-tab-count">{count}</span>}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="jobs" role="list">
              {jobs.length === 0 ? (
                <div className="empty">
                  <div className="e-ico">🎬</div>
                  <p>No videos yet</p>
                  <p className="muted" style={{ fontSize: ".88rem" }}>
                    Upload a clip on the left — or paste with Ctrl+V.
                  </p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="empty">
                  <p className="muted" style={{ fontSize: ".88rem" }}>No {jobFilter} videos.</p>
                </div>
              ) : (
                filteredJobs.map((j) => (
                  <JobRow
                    key={j.id}
                    job={j}
                    highlight={j.id === celebrateId}
                    deleting={j.id === deleting}
                    onDelete={() => deleteJob(j.id)}
                    onPreview={() => setPreviewJob(j)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {previewJob && <CompareModal job={previewJob} onClose={() => setPreviewJob(null)} />}
    </div>
  );
}

function JobRow({
  job: j, highlight, deleting, onDelete, onPreview,
}: { job: Job; highlight?: boolean; deleting?: boolean; onDelete: () => void; onPreview: () => void }) {
  const { toast } = useToast();
  const expiry = j.status === "finished" ? expiresIn(j.expires_at) : null;
  const res = j.output_width && j.output_height
    ? `${j.output_width}×${j.output_height}`
    : j.width && j.height ? `${j.width}×${j.height}` : null;
  const meta = [
    fmtDate(j.created_at),
    res,
    j.watermark_type,
    j.processing_sec ? fmtDuration(j.processing_sec) : null,
    expiry,
  ].filter(Boolean).join(" · ");
  const active = j.status === "pending" || j.status === "processing";
  const phase = processingPhase(j.status, j.progress);
  const sub = active
    ? (j.status === "pending" && j.eta_sec
        ? `${phase} · ready in ${fmtEta(j.eta_sec)}`
        : phase || "Processing…")
    : (j.error_message && j.status !== "finished" ? j.error_message : meta);

  async function copyLink() {
    if (!j.download_url) return;
    const url = `${window.location.origin}${j.download_url}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Download link copied", "ok");
    } catch {
      toast("Copy failed", "error");
    }
  }

  return (
    <div className={`job ${highlight ? "job-highlight" : ""}`} role="listitem" style={deleting ? { opacity: .5, pointerEvents: "none" } : undefined}>
      <div>
        <div className="job-name">
          {j.original_name}
          {j.from_cache && <span className="tag-instant">⚡ Instant</span>}
          {j.quality_matched && j.status === "finished" && (
            <span className="tag-quality">1080p OK</span>
          )}
          {expiry && <span className="tag-expiry">{expiry}</span>}
        </div>
        <div className="job-meta">{sub}</div>
      </div>
      <div className="job-right">
        {active && <ProgressRing progress={j.progress} />}
        <StatusBadge status={j.status} />
        {j.status === "finished" && j.has_preview && (
          <button className="btn btn-ghost btn-sm" onClick={onPreview} type="button" title="Compare before/after">Compare</button>
        )}
        {j.status === "finished" && j.download_url && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={copyLink} type="button" title="Copy download link" aria-label="Copy download link">⎘</button>
            <a className="btn btn-primary btn-sm" href={j.download_url}>Download</a>
          </>
        )}
        {TERMINAL.includes(j.status) && (
          <button className="btn btn-ghost btn-sm" onClick={onDelete} type="button" title="Remove" aria-label="Remove job" disabled={deleting}>✕</button>
        )}
      </div>
      {active && (
        <div className="job-prog progress" role="progressbar" aria-valuenow={j.progress} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${Math.max(j.progress, j.status === "pending" ? 3 : 8)}%` }} />
        </div>
      )}
    </div>
  );
}
