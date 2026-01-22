"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Bell, Clock } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

import googleIcon from "@/public/icons/google.png";

type ScanFrequency = "hourly" | "every_2_hours" | "daily";

type UserSettings = {
  scan_frequency: ScanFrequency | "";
  email_alerts: boolean;
  telegram_alerts: boolean;
  sms_alerts: boolean;
};

const DEFAULT_SETTINGS: UserSettings = {
  scan_frequency: "",
  email_alerts: true,
  telegram_alerts: false,
  sms_alerts: false,
};

const SCAN_OPTIONS: { label: string; value: ScanFrequency }[] = [
  { label: "Hourly", value: "hourly" },
  { label: "Every 2 hours", value: "every_2_hours" },
  { label: "Daily", value: "daily" },
];

function isValidEmail(v: string) {
  const s = v.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function ToggleRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-between items-center mb-4">
      <span className={disabled ? "opacity-60" : ""}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        disabled={disabled}
        className={`w-14 h-7 rounded-full p-1 transition ${
          value ? "bg-green-500" : "bg-gray-300"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition ${
            value ? "translate-x-7" : ""
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  // ✅ Read env once
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ✅ Show nice UI if missing env, and STOP rendering anything that uses supabase
  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="h-dvh w-full overflow-hidden flex items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Missing env vars</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Add these to <span className="font-medium">.env.local</span> and restart dev:
          </p>
          <pre className="mt-3 text-xs bg-zinc-100 p-3 rounded-xl overflow-auto">
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=... (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
          </pre>
        </div>
      </div>
    );
  }

  // ✅ supabase is NEVER null now
  const supabase = useMemo(() => createBrowserClient(supabaseUrl, supabaseKey), [
    supabaseUrl,
    supabaseKey,
  ]);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const settingsRef = useRef<UserSettings>(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [authLoading, setAuthLoading] = useState(false);

  // ✅ email sign-in UI only (no auth)
  const [emailInput, setEmailInput] = useState("");
  const emailOk = isValidEmail(emailInput);
  const [emailBtnLoading, setEmailBtnLoading] = useState(false);
  const [emailInfo, setEmailInfo] = useState<string | null>(null);

  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // 1) get user + listen for auth changes
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;

      const u = data.user;
      setUserId(u?.id ?? null);
      setUserEmail(u?.email ?? null);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUserId(u?.id ?? null);
      setUserEmail(u?.email ?? null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [supabase]);

  // 2) load settings when logged in
  useEffect(() => {
    if (!userId) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("profiles")
        .select("scan_frequency,email_alerts,telegram_alerts,sms_alerts")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setSettings(DEFAULT_SETTINGS);
        setLoading(false);
        return;
      }

      if (!data) {
        setSettings(DEFAULT_SETTINGS);
        setLoading(false);
        return;
      }

      const loaded: UserSettings = {
        scan_frequency: (data.scan_frequency as ScanFrequency) ?? "",
        email_alerts: data.email_alerts ?? true,
        telegram_alerts: false,
        sms_alerts: false,
      };

      // force telegram/sms off once if old data had true
      if (data.telegram_alerts || data.sms_alerts) {
        await supabase
          .from("profiles")
          .update({ telegram_alerts: false, sms_alerts: false })
          .eq("user_id", userId);
      }

      setSettings(loaded);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  // debounced save (UPSERT so first-time users work)
  function queueSave(next: Partial<UserSettings>) {
    if (!userId) return;

    setSettings((prev) => {
      const merged = { ...prev, ...next };
      settingsRef.current = merged;
      return merged;
    });

    setError(null);

    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    saveTimer.current = window.setTimeout(async () => {
      setSaving(true);

      const s = settingsRef.current;

      const payload = {
        user_id: userId,
        scan_frequency: s.scan_frequency ? s.scan_frequency : null, // "" -> NULL
        email_alerts: s.email_alerts,
        telegram_alerts: false,
        sms_alerts: false,
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "user_id" });

      if (error) setError(error.message);

      setSaving(false);
    }, 350);
  }

  async function signInWithGoogle() {
    setAuthLoading(true);
    setError(null);
    setEmailInfo(null);

    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/settings")}`,
      },
    });

    if (error) setError(error.message);

    setAuthLoading(false);
  }

  async function emailSignInNoAuth() {
    if (!emailOk) return;

    setEmailBtnLoading(true);
    setEmailInfo(null);

    await new Promise((r) => setTimeout(r, 400));

    setEmailBtnLoading(false);
    setEmailInfo(`Not enabled yet. We captured: ${emailInput.trim()}`);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  // ----------------------------
  // NOT LOGGED IN UI (no scroll)
  // ----------------------------
  if (!userId) {
    const baseBtn =
      "w-full rounded-xl border px-4 py-3 text-sm font-medium transition flex items-center justify-center gap-3";

    const idleGrey = "bg-zinc-100 border-zinc-200 text-zinc-900 hover:bg-zinc-200";
    const activeBlue = "bg-blue-600 border-blue-600 text-white";
    const disabledBtn = "opacity-60 cursor-not-allowed";

    const emailBtnClass = emailOk ? `${activeBlue} hover:bg-blue-700` : `${idleGrey}`;

    return (
      <div className="h-dvh w-full overflow-hidden flex items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Sign in to manage scan frequency and alerts.
          </p>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {/* Email input + button (UI only) */}
          <div className="mt-4">
            <label className="text-sm font-medium text-zinc-900">Email</label>
            <input
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter email to sign in"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={emailSignInNoAuth}
              disabled={!emailOk || emailBtnLoading}
              className={[
                baseBtn,
                emailBtnClass,
                !emailOk || emailBtnLoading ? disabledBtn : "",
                "mt-3",
              ].join(" ")}
            >
              {emailBtnLoading ? "Signing in…" : "Sign in"}
            </button>

            {emailInfo ? (
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                {emailInfo}
              </div>
            ) : null}
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs text-zinc-500">OR</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          {/* Google sign-in */}
          <button
            onClick={signInWithGoogle}
            disabled={authLoading}
            className={[
              baseBtn,
              authLoading ? activeBlue : idleGrey,
              authLoading ? disabledBtn : "",
            ].join(" ")}
          >
            <Image src={googleIcon} alt="Google" width={18} height={18} />
            {authLoading ? "Signing in…" : "Sign in with Google"}
          </button>

          <div className="mt-4 text-xs text-zinc-500">
            By continuing, you agree to your app’s Terms & Privacy.
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------
  // LOGGED IN UI
  // ----------------------------
  return (
    <div className="min-h-dvh w-full bg-zinc-50">
      <div className="px-6 py-8 md:p-10">
        <div className="flex items-center justify-between mb-8 max-w-2xl">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Logged in as {userEmail}
              {saving ? " • Saving…" : ""}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900"
          >
            Logout
          </button>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md max-w-2xl">
          {/* Scan Frequency */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Clock className="text-blue-500" size={20} />
              Scan Frequency
            </h2>

            <select
              value={settings.scan_frequency}
              onChange={(e) => queueSave({ scan_frequency: e.target.value as ScanFrequency })}
              disabled={loading}
              className="w-full p-3 border rounded-xl bg-gray-100 focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            >
              <option value="" disabled>
                Select scan frequency
              </option>
              {SCAN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <hr className="my-6" />

          {/* Notifications */}
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Bell className="text-yellow-500" size={20} />
              Notifications
            </h2>

            <ToggleRow
              label="Email Alerts"
              value={settings.email_alerts}
              disabled={loading}
              onChange={(next) => queueSave({ email_alerts: next })}
            />

            <div className="text-xs text-zinc-500 mt-2">
              Telegram and SMS alerts are coming soon.
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
