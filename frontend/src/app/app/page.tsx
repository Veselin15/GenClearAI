import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { TopNav } from "@/components/TopNav";
import { Dashboard } from "@/components/Dashboard";
import type { User } from "@/lib/types";

async function fetchMe(cookie: string): Promise<User | null> {
  const base = process.env.INTERNAL_API_URL ?? "http://api:8000";
  try {
    const res = await fetch(`${base}/api/me`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AppPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("genclear_session");
  if (!session) redirect("/login");

  const user = await fetchMe(`genclear_session=${session.value}`);
  if (!user) redirect("/login");

  return (
    <>
      <TopNav user={user} variant="app" />
      <Dashboard initialUser={user} />
    </>
  );
}
