import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHeader } from "@/components/PageHeader";

const ENDPOINTS = [
  {
    method: "POST",
    path: "/v1/jobs",
    title: "Upload a clip",
    desc: "Multipart form with file field. Optional webhook_url.",
  },
  {
    method: "GET",
    path: "/v1/jobs/{id}",
    title: "Job status",
    desc: "Poll until status is finished, failed, or expired.",
  },
  {
    method: "GET",
    path: "/v1/jobs/{id}/download",
    title: "Download clean MP4",
    desc: "Use download_url from the finished job response.",
  },
  {
    method: "WS",
    path: "/v1/jobs/{id}/events",
    title: "Live progress",
    desc: "WebSocket stream with status and progress updates.",
  },
];

export default function DevelopersPage() {
  return (
    <div className="lp-shell">
      <TopNav variant="landing" />
      <main className="page container docs-page">
        <PageHeader
          title="API documentation"
          subtitle="Programmatic access uses the same endpoints as the web app. Authenticate with a bearer API key from your account page, or session cookies."
        />

        <div className="docs-endpoints">
          {ENDPOINTS.map((ep) => (
            <div key={ep.path} className="card docs-endpoint">
              <span className={`docs-method docs-method-${ep.method.toLowerCase()}`}>{ep.method}</span>
              <div>
                <h3>{ep.title}</h3>
                <code className="docs-path">{ep.path}</code>
                <p className="muted" style={{ margin: "8px 0 0", fontSize: ".9rem" }}>{ep.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card docs-block">
          <h3>Quick start</h3>
          <pre className="code-block">{`# Upload a clip
curl -X POST https://your-domain/v1/jobs \\
  -H "Authorization: Bearer gck_YOUR_KEY" \\
  -F "file=@clip.mp4"

# Poll status
curl https://your-domain/v1/jobs/JOB_ID \\
  -H "Authorization: Bearer gck_YOUR_KEY"

# Download (use download_url from the finished job)
curl -L -o clean.mp4 "https://your-domain/v1/jobs/JOB_ID/download?token=..."`}</pre>
        </div>

        <div className="card docs-block">
          <h3>Webhooks</h3>
          <p className="muted" style={{ fontSize: ".94rem" }}>
            Pass <code>webhook_url</code> (HTTPS, public) as form data on upload. We POST when processing completes.
            Verify with header <code>X-GenClear-Signature</code> (HMAC-SHA256).
          </p>
        </div>

        <div className="card docs-block docs-cta">
          <div>
            <h3>Interactive OpenAPI</h3>
            <p className="muted" style={{ margin: 0, fontSize: ".94rem" }}>
              Full schema, models, and try-it-out UI.
            </p>
          </div>
          <a className="btn btn-primary" href="/docs" target="_blank" rel="noopener noreferrer">
            Open Swagger UI →
          </a>
        </div>

        <p className="muted center" style={{ marginTop: 24, fontSize: ".9rem" }}>
          Need an API key? <Link href="/account" className="link-accent">Generate one in Account</Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
