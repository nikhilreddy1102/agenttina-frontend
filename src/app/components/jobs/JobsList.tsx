"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export type JobItem = {
  id: string;
  title: string;
  company: string;
  location?: string;

  atsScore: number; // 0-100
  missing: {
    required: string[];
    preferred: string[];
  };

  applyUrl: string;
  jdText: string;

  source?: "lever" | "greenhouse" | "other";
  scannedAt?: string;
};

type Props = {
  title: string;
  subtitle?: string;
  jobs: JobItem[];
  resumeHrefBase?: string; // default "/resume"
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
      {children}
    </span>
  );
}

function ScorePill({ score }: { score: number }) {
  const safe = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;

  const tone =
    safe >= 85
      ? "bg-green-50 text-green-700 ring-green-200"
      : safe >= 70
      ? "bg-blue-50 text-blue-700 ring-blue-200"
      : safe >= 55
      ? "bg-yellow-50 text-yellow-700 ring-yellow-200"
      : "bg-red-50 text-red-700 ring-red-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tone}`}
    >
      ATS {safe}
    </span>
  );
}

function SkillChips({ skills }: { skills: string[] }) {
  if (!skills?.length) return <span className="text-sm text-gray-500">None</span>;

  const shown = skills.slice(0, 6);
  const extra = skills.length - shown.length;

  return (
    <div className="flex flex-wrap gap-2">
      {shown.map((s) => (
        <span
          key={s}
          className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
          title={s}
        >
          {s}
        </span>
      ))}
      {extra > 0 ? (
        <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
          +{extra} more
        </span>
      ) : null}
    </div>
  );
}

export default function JobsList({
  title,
  subtitle,
  jobs,
  resumeHrefBase = "/resume",
}: Props) {
  const [q, setQ] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return jobs;

    return jobs.filter((j) => {
      const hay = `${j.title} ${j.company} ${j.location ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [jobs, q]);

  function toggleExpand(jobId: string) {
    setExpandedId((cur) => (cur === jobId ? null : jobId));
  }

  function buildReuploadHref(job: JobItem) {
    const qp = new URLSearchParams();
    qp.set("prefill", "1");
    qp.set("mode", "jd_match");
    qp.set("jobId", job.id);
    qp.set("jdText", job.jdText);

    return `${resumeHrefBase}?${qp.toString()}`;
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
        <Search size={18} className="text-gray-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, company, location…"
          className="w-full outline-none text-sm text-gray-900 placeholder:text-gray-400"
        />
        <Badge>{filtered.length} jobs</Badge>
      </div>

      <div className="mt-6 hidden grid-cols-12 gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-600 md:grid">
        <div className="col-span-4">Role</div>
        <div className="col-span-2">ATS</div>
        <div className="col-span-4">Missing Skills</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      <div className="mt-3 space-y-3">
        {filtered.map((job) => {
          const isExpanded = expandedId === job.id;
          const applyDisabled = job.atsScore < 80;

          return (
            <div key={job.id} className="rounded-2xl border border-gray-200 bg-white">
              <div className="p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-center">
                  {/* Clickable area (opens JD dropdown) */}
                  <div
                    className="md:col-span-4 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleExpand(job.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleExpand(job.id);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          {job.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {job.company}
                          {job.location ? <span className="text-gray-400"> • </span> : null}
                          {job.location ? <span>{job.location}</span> : null}
                        </p>
                      </div>

                      <span className="mt-1 inline-flex items-center gap-2 text-sm text-gray-500 md:hidden">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {job.source ? <Badge>{job.source}</Badge> : null}
                      {job.scannedAt ? <Badge>{job.scannedAt}</Badge> : null}
                    </div>
                  </div>

                  {/* ATS */}
                  <div className="md:col-span-2">
                    <ScorePill score={job.atsScore} />
                  </div>

                  {/* Missing */}
                  <div className="md:col-span-4">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          Required
                        </p>
                        <SkillChips skills={job.missing.required} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          Preferred
                        </p>
                        <SkillChips skills={job.missing.preferred} />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-2 md:text-right">
                    <div className="flex flex-col gap-2 md:items-end">
                      <a
                        href={applyDisabled ? "#" : job.applyUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          if (applyDisabled) e.preventDefault();
                        }}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold md:w-auto
                          ${
                            applyDisabled
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        aria-disabled={applyDisabled}
                        title={
                          applyDisabled
                            ? "ATS below 80 — reupload recommended"
                            : "Apply"
                        }
                      >
                        Apply <ExternalLink size={16} />
                      </a>

                      <Link
                        href={buildReuploadHref(job)}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold md:w-auto
                          ${
                            applyDisabled
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                          }`}
                        title="Reupload resume and run JD match with this JD"
                      >
                        Reupload <RefreshCw size={16} />
                      </Link>

                      <div
                        className="hidden md:flex items-center justify-end gap-2 text-xs font-medium text-gray-500 cursor-pointer select-none"
                        onClick={() => toggleExpand(job.id)}
                      >
                        {isExpanded ? "Hide JD" : "View JD"}
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* JD dropdown */}
              {isExpanded ? (
                <div className="border-t border-gray-200 px-4 pb-4">
                  <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Full Job Description
                    </p>
                    <pre className="whitespace-pre-wrap break-words text-sm text-gray-700 leading-6">
                      {job.jdText}
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        {!filtered.length ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <p className="font-semibold text-gray-900">No jobs found</p>
            <p className="mt-1 text-sm text-gray-600">Try a different search keyword.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
