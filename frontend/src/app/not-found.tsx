import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <div className="lp-shell">
      <TopNav variant="landing" />
      <main className="not-found">
        <div className="container center">
          <p className="lp-hero-eyebrow">404</p>
          <h1 className="lp-hero-title" style={{ fontSize: "2.5rem" }}>Page not found</h1>
          <p className="muted" style={{ maxWidth: "40ch", margin: "0 auto" }}>
            This page doesn&apos;t exist — but your next clean upload can. Head home and drop a clip.
          </p>
          <div className="hero-cta" style={{ justifyContent: "center", marginTop: 28 }}>
            <Link className="btn btn-primary btn-lg" href="/">Back home</Link>
            <Link className="btn btn-ghost btn-lg" href="/app">Dashboard</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
