import JobsList, { type JobItem } from "../../../components/jobs/JobsList";

type Props = {
  params: { runId?: string; runID?: string };
};

export default function JobsRunPage({ params }: Props) {
  const runId = params.runId ?? params.runID ?? "";

  if (!runId) {
    return (
      <div className="p-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-lg font-bold text-gray-900">Missing runId</p>
          <p className="mt-1 text-sm text-gray-600">
            Rename your folder to <span className="font-mono">[runId]</span> OR keep it
            as <span className="font-mono">[runID]</span> and this file will still work.
          </p>
        </div>
      </div>
    );
  }

  const mockRunJobs: JobItem[] = [
    {
      id: `run-${runId}-1`,
      title: "Backend Engineer (Go + Kubernetes)",
      company: "Meta",
      location: "Remote • USA",
      atsScore: 91,
      missing: {
        required: ["CI/CD"],
        preferred: ["Service Mesh", "Tracing"],
      },
      applyUrl: "https://example.com/apply/meta-backend",
      source: "greenhouse",
      scannedAt: `Run ${runId.slice(0, 6)}…`,
      jdText:
        "Responsibilities:\n- Build backend services\n- Work with Kubernetes\n\nRequirements:\n- Go\n- Kubernetes\n- CI/CD\n\nPreferred:\n- Service Mesh\n- Tracing\n",
    },
    {
      id: `run-${runId}-2`,
      title: "Senior Backend Engineer",
      company: "Netflix",
      location: "Los Gatos, CA",
      atsScore: 84,
      missing: {
        required: ["Kafka"],
        preferred: ["Bazel", "gRPC"],
      },
      applyUrl: "https://example.com/apply/netflix-backend",
      source: "lever",
      scannedAt: `Run ${runId.slice(0, 6)}…`,
      jdText:
        "Responsibilities:\n- Build scalable backend APIs\n\nRequirements:\n- Java/Go\n- Kafka\n\nPreferred:\n- Bazel\n- gRPC\n",
    },
  ];

  return (
    <div className="p-10">
      <JobsList
        title="Scan Jobs Results"
        subtitle={`Showing jobs for runId: ${runId}`}
        jobs={mockRunJobs}
        resumeHrefBase="/dashboard/resume"
      />
    </div>
  );
}
