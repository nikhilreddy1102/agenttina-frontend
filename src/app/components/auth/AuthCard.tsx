"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowser } from "../../../lib/supabase/client";

type Props = {
  variant: "login" | "settings";
  userEmail?: string | null;
};

export default function AuthCard({ variant, userEmail }: Props) {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const params = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const error = params.get("error");

  const next = params.get("next") ?? "/dashboard/settings";

  async function signInWithGoogle() {
    setLoading(true);

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) setLoading(false);
  }

  async function logout() {
    setLoading(true);
    await supabase.auth.signOut();
    router.refresh();
    setLoading(false);
  }

  const isLoggedIn = Boolean(userEmail);

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-zinc-900">
          {variant === "settings"
            ? isLoggedIn
              ? "You’re signed in"
              : "Sign in to continue"
            : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {isLoggedIn
            ? `Signed in as ${userEmail}`
            : "Use Google to sign in securely."}
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Login failed. Try again. (code: {error})
        </div>
      ) : null}

      {!isLoggedIn ? (
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Redirecting..." : "Continue with Google"}
        </button>
      ) : (
        <button
          onClick={logout}
          disabled={loading}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 disabled:opacity-60"
        >
          {loading ? "Signing out..." : "Logout"}
        </button>
      )}

      <div className="mt-4 text-xs text-zinc-500">
        By continuing, you agree to your app’s Terms & Privacy.
      </div>
    </div>
  );
}
