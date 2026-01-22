"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, ChevronDown, ChevronUp } from "lucide-react";

type RunMode = "scan_jobs" | "jd_match";
type RunStatus = "queued" | "running" | "done" | "failed" | "completed";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "";

const API = {
  scan_jobs: { method: "POST", path: "/runs/scan-jobs" },
  jd_match: { method: "POST", path: "/runs/jd-match" },
  get_run: { method: "GET", path: (runId: string) => `/runs/${runId}` },
} as const;

const POLL_MS = 2000;

function MovingDots() {
  return (
    <div className="relative h-3 w-20">
      <div className="absolute inset-0 flex items-center justify-between">
        <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
      </div>

      <span className="moving-dot absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-green-600" />

      <style jsx>{`
        .moving-dot {
          animation: moveDot 0.9s linear infinite;
        }
        @keyframes moveDot {
          0% {
            transform: translate(0px, -50%);
          }
          25% {
            transform: translate(18px, -50%);
          }
          50% {
            transform: translate(36px, -50%);
          }
          75% {
            transform: translate(54px, -50%);
          }
          100% {
            transform: translate(72px, -50%);
          }
        }
      `}</style>
    </div>
  );
}

function CenterOverlay({
  open,
  title,
  subtitle,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-[92%] max-w-md rounded-2xl bg-white p-6 shadow-lg text-center">
        <p className="text-lg font-bold text-gray-900">{title}</p>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        ) : null}
        <div className="mt-6 flex items-center justify-center">
          <MovingDots />
        </div>
      </div>
    </div>
  );
}

function ReuploadInfoModal({
  open,
  onOk,
  onExit,
}: {
  open: boolean;
  onOk: () => void;
  onExit: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* backdrop click => OK (keeps it simple) */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onOk}
        aria-label="Close modal"
      />
      <div className="relative w-[92%] max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <p className="text-sm font-semibold text-gray-900">
          Check with new resume only for new ATS score
        </p>
        <p className="mt-2 text-sm text-gray-600">
          We prefilled the Job Description for you. Upload a new resume and click{" "}
          <span className="font-semibold">Check ATS</span>.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onExit}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 hover:bg-gray-50"
          >
            Exit
          </button>

          <button
            type="button"
            onClick={onOk}
            className="flex-1 rounded-xl px-4 py-3 font-semibold text-white bg-blue-600 hover:bg-blue-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResumePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ used to avoid re-applying same prefill repeatedly, but still allow new JD links
  const lastPrefillKeyRef = useRef<string>("");

  const [reuploadMode, setReuploadMode] = useState(false);
  const [reuploadModalOpen, setReuploadModalOpen] = useState(false);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const [showJd, setShowJd] = useState(false);
  const [jdText, setJdText] = useState("");
  const [jdTouched, setJdTouched] = useState(false);

  const [confirmScanOpen, setConfirmScanOpen] = useState(false);

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayTitle, setOverlayTitle] = useState("Working…");
  const [overlaySubtitle, setOverlaySubtitle] = useState<string | undefined>(
    undefined
  );

  const [scanResult, setScanResult] = useState<any>(null);
  const [atsResult, setAtsResult] = useState<any>(null);

  const pollTimerRef = useRef<number | null>(null);
  const activeRunRef = useRef<{ runId: string; mode: RunMode } | null>(null);

  const jdCharCount = useMemo(() => jdText.trim().length, [jdText]);
  const canUseActions = !!resumeFile;
  const canCheckAts = canUseActions && showJd && jdCharCount >= 300;

  const isBusy = overlayOpen;

  const stopPolling = () => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    activeRunRef.current = null;
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const resetToNormalMode = useCallback(() => {
    setReuploadMode(false);
    setReuploadModalOpen(false);

    // close + clear JD UI
    setShowJd(false);
    setJdText("");
    setJdTouched(false);

    // close confirm modal if open
    setConfirmScanOpen(false);

    setError("");
  }, []);

  // ✅ Prefill + auto reset when user navigates to /resume without query
  useEffect(() => {
    const prefill = searchParams.get("prefill");
    const mode = searchParams.get("mode");
    const jd = searchParams.get("jdText");

    const hasPrefill = prefill === "1" && mode === "jd_match" && !!jd;

    // ✅ If user clicks navbar Resume (no query), reset everything back
    if (!hasPrefill) {
      lastPrefillKeyRef.current = "";
      if (reuploadMode) resetToNormalMode();
      return;
    }

    // ✅ Prevent re-applying same prefill repeatedly, but allow new JD links
    const key = `${mode}:${jd!.length}:${jd!.slice(0, 40)}`;
    if (lastPrefillKeyRef.current === key) return;
    lastPrefillKeyRef.current = key;

    setReuploadMode(true);
    setReuploadModalOpen(true);

    setShowJd(true);
    setJdTouched(true);
    setJdText(jd!);
    setError("");

    // clean
    setConfirmScanOpen(false);
    setScanResult(null);
  }, [searchParams, reuploadMode, resetToNormalMode]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles?.[0];
    if (!f) return;

    if (
      f.type !== "application/pdf" &&
      !f.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Only PDF files are allowed.");
      return;
    }

    setResumeFile(f);
    setError("");
    setScanResult(null);
    setAtsResult(null);
  }, []);

  const onDropRejected = useCallback(() => {
    setError("Only one PDF file is allowed.");
  }, []);

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } =
    useDropzone({
      onDrop,
      onDropRejected,
      accept: { "application/pdf": [".pdf"] },
      multiple: false,
      maxFiles: 1,
      noKeyboard: true,
    });

  const handleRemoveResume = (e: React.MouseEvent) => {
    e.stopPropagation();

    stopPolling();
    setOverlayOpen(false);

    setResumeFile(null);
    setError("");

    setShowJd(false);
    setJdText("");
    setJdTouched(false);

    setConfirmScanOpen(false);

    setScanResult(null);
    setAtsResult(null);
  };

  const formatBytes = (bytes: number) => {
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  async function fetchJson(url: string, init?: RequestInit) {
    const res = await fetch(url, init);
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {}

    if (!res.ok) {
      const msg =
        (json && (json.error || json.message)) ||
        text ||
        `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return json;
  }

  function extractRunId(payload: any): string | null {
    return (
      payload?.runId ??
      payload?.id ??
      payload?.run?.id ??
      payload?.data?.runId ??
      payload?.data?.run?.id ??
      null
    );
  }

  function extractRun(payload: any): any {
    return payload?.run ?? payload;
  }

  function normalizeStatus(s: any): RunStatus {
    const v = String(s ?? "").toLowerCase().trim();
    if (v === "completed") return "completed";
    if (v === "done") return "done";
    if (v === "failed") return "failed";
    if (v === "running") return "running";
    if (v === "queued") return "queued";
    return "running";
  }

  async function startAsyncRun(mode: RunMode, fd: FormData) {
    if (!BACKEND_URL) throw new Error("NEXT_PUBLIC_BACKEND_URL is not set.");

    if (mode === "scan_jobs") setScanResult(null);
    if (mode === "jd_match") setAtsResult(null);

    setError("");

    setOverlayTitle(mode === "scan_jobs" ? "Scanning jobs…" : "Checking ATS…");
    setOverlaySubtitle(
      mode === "scan_jobs"
        ? "Scraping latest jobs for your resume"
        : "Matching JD with your resume"
    );
    setOverlayOpen(true);

    stopPolling();

    const createUrl = `${BACKEND_URL}${API[mode].path}`;
    const createRes = await fetchJson(createUrl, {
      method: API[mode].method,
      body: fd,
    });

    const runId = extractRunId(createRes);
    if (!runId) {
      setOverlayOpen(false);
      throw new Error("Backend did not return runId.");
    }

    activeRunRef.current = { runId, mode };

    pollTimerRef.current = window.setInterval(async () => {
      try {
        const active = activeRunRef.current;
        if (!active) return;

        const getUrl = `${BACKEND_URL}${API.get_run.path(active.runId)}`;
        const getRes = await fetchJson(getUrl, { method: API.get_run.method });

        const run = extractRun(getRes);
        const status = normalizeStatus(run?.status);

        if (status === "done" || status === "completed") {
          stopPolling();
          setOverlayOpen(false);

          if (active.mode === "scan_jobs") {
            setScanResult(run);
            router.push(`/dashboard/jobs/${active.runId}`);
            return;
          }

          if (active.mode === "jd_match") {
            setAtsResult(run);
          }
        }

        if (status === "failed") {
          stopPolling();
          setOverlayOpen(false);
          const msg =
            run?.error || run?.message || "Run failed. Check backend logs.";
          setError(String(msg));
        }
      } catch (e: any) {
        stopPolling();
        setOverlayOpen(false);
        setError(e?.message || "Failed to poll run status.");
      }
    }, POLL_MS);
  }

  const handleScanJobsClick = () => {
    if (!resumeFile || overlayOpen) return;
    if (reuploadMode) return; // extra guard (even though we hide the button)
    setConfirmScanOpen(true);
  };

  const handleConfirmScanCancel = () => setConfirmScanOpen(false);

  const handleConfirmScanOk = async () => {
    if (!resumeFile) return;

    setConfirmScanOpen(false);
    setShowJd(false);

    const fd = new FormData();
    fd.append("file", resumeFile);
    fd.append("mode", "scan_jobs");

    try {
      await startAsyncRun("scan_jobs", fd);
    } catch (e: any) {
      setOverlayOpen(false);
      setError(e?.message || "Failed to start scan jobs.");
    }
  };

  const handleToggleAddJd = () => {
    if (!resumeFile || overlayOpen) return;
    setJdTouched(true);
    setShowJd((v) => !v);
    setError("");
  };

  const handleCheckAts = async () => {
    if (!resumeFile || !canCheckAts || overlayOpen) return;

    const fd = new FormData();
    fd.append("file", resumeFile);
    fd.append("mode", "jd_match");
    fd.append("jdText", jdText);

    try {
      await startAsyncRun("jd_match", fd);
    } catch (e: any) {
      setOverlayOpen(false);
      setError(e?.message || "Failed to start ATS check.");
    }
  };

  const handleReuploadModalOk = () => {
    setReuploadModalOpen(false);
  };

  const handleReuploadModalExit = () => {
    resetToNormalMode();
    router.replace("/resume"); // remove query params
  };

  return (
    <div className="p-10 flex flex-col items-center">
      <CenterOverlay
        open={overlayOpen}
        title={overlayTitle}
        subtitle={overlaySubtitle}
      />

      <ReuploadInfoModal
        open={reuploadModalOpen}
        onOk={handleReuploadModalOk}
        onExit={handleReuploadModalExit}
      />

      <h1 className="text-3xl font-bold mb-8">Upload Your Resume</h1>

      {confirmScanOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={handleConfirmScanCancel}
            aria-label="Close modal"
          />
          <div className="relative w-[92%] max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900">
              Confirm Scan Jobs
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Do you want to scrape the latest jobs with ATS score that suits
              your resume?
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleConfirmScanCancel}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmScanOk}
                className="flex-1 rounded-xl px-4 py-3 font-semibold text-white bg-blue-600 hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 w-full max-w-xl text-center cursor-pointer transition
        ${
          isDragActive
            ? "border-blue-600 bg-blue-50"
            : "border-gray-400 bg-gray-100"
        }`}
        aria-label="Resume upload dropzone"
      >
        <input {...getInputProps()} />

        {!resumeFile ? (
          <div className="flex flex-col items-center gap-4">
            <UploadCloud size={50} className="text-gray-600" />
            {isDragActive ? (
              <p className="text-blue-700 font-medium">Drop your PDF here…</p>
            ) : (
              <p className="text-gray-600 font-medium">
                Drag and drop or click to upload (PDF only)
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-200">
              <div className="text-left">
                <p className="font-semibold text-gray-900">{resumeFile.name}</p>
                <p className="text-sm text-gray-500">
                  {formatBytes(resumeFile.size)} • PDF • Click anywhere to replace
                </p>
              </div>

              <button
                type="button"
                onClick={handleRemoveResume}
                className="ml-3 inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100"
                aria-label="Remove resume"
                title="Remove"
                disabled={isBusy}
              >
                <X size={18} className="text-gray-700" />
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
              className="w-full rounded-xl px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 font-medium"
              disabled={isBusy}
            >
              Replace Resume
            </button>
          </div>
        )}
      </div>

      {error ? <p className="mt-4 text-red-600 font-medium">{error}</p> : null}

      <div className="mt-8 w-full max-w-xl flex gap-3">
        {/* ✅ Hide Scan Jobs in reupload mode */}
        {!reuploadMode ? (
          <button
            type="button"
            onClick={handleScanJobsClick}
            disabled={!canUseActions || overlayOpen}
            className={`flex-1 rounded-xl px-4 py-3 font-semibold transition
              ${
                !canUseActions || overlayOpen
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            Scan Jobs
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleToggleAddJd}
          disabled={!canUseActions || overlayOpen}
          className={`flex-1 rounded-xl px-4 py-3 font-semibold transition inline-flex items-center justify-center gap-2
            ${
              !canUseActions || overlayOpen
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : showJd
                ? "bg-blue-700 text-white ring-2 ring-blue-200"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          Add JD
          {jdTouched ? (
            showJd ? <ChevronUp size={18} /> : <ChevronDown size={18} />
          ) : null}
        </button>
      </div>

      <div
        className={`w-full max-w-xl overflow-hidden transition-all duration-200 ${
          showJd ? "max-h-[650px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-gray-900">Job Description</p>
            <p
              className={`text-sm ${
                jdCharCount >= 300 ? "text-green-600" : "text-gray-500"
              }`}
            >
              {jdCharCount} chars{" "}
              {jdCharCount >= 300 ? "✓" : "(min 300 to enable Check ATS)"}
            </p>
          </div>

          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Add one JD here… (paste full job description)"
            className="w-full min-h-[220px] rounded-2xl border border-gray-200 bg-white p-4 outline-none focus:ring-2 focus:ring-blue-200"
            disabled={overlayOpen}
          />

          <button
            type="button"
            disabled={!canCheckAts || overlayOpen}
            onClick={handleCheckAts}
            className={`mt-4 w-full rounded-xl px-4 py-3 font-semibold transition
              ${
                !canCheckAts || overlayOpen
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            Check ATS
          </button>
        </div>
      </div>

      <div className="mt-8 w-full max-w-xl space-y-4">
        {scanResult ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="font-semibold text-gray-900 mb-2">
              Scan Jobs Result (JSON)
            </p>
            <pre className="text-xs whitespace-pre-wrap break-words text-gray-700">
              {JSON.stringify(scanResult, null, 2)}
            </pre>
          </div>
        ) : null}

        {atsResult ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="font-semibold text-gray-900 mb-2">
              ATS Result (JSON)
            </p>
            <pre className="text-xs whitespace-pre-wrap break-words text-gray-700">
              {JSON.stringify(atsResult, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
