import { NextResponse } from "next/server";
import { createSupabaseServer } from "../../../lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard/settings";

  if (!code) return NextResponse.redirect(new URL(`/login?error=missing_code`, url.origin));

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return NextResponse.redirect(new URL(`/login?error=oauth_failed`, url.origin));
  return NextResponse.redirect(new URL(next, url.origin));
}
