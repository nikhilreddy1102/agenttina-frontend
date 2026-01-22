import JobsList, { type JobItem } from "../../components/jobs/JobsList";

const mockJobs: JobItem[] = [
  {
    id: "job-1",
    title: "Backend Engineer (Go)",
    company: "Stripe",
    location: "Remote • USA",
    atsScore: 88,
    missing: {
      required: ["Redis", "gRPC"],
      preferred: ["Bazel", "Observability"],
    },
    applyUrl: "https://example.com/apply/stripe-backend",
    source: "lever",
    scannedAt: "Latest",
    jdText:
      "Responsibilities:\n- Build Go services...\n\nRequirements:\n- Go\n- Distributed systems\n- Kubernetes\n\nPreferred:\n- Bazel\n- Observability\n",
  },
  {
    id: "job-2",
    title: "Full Stack Developer",
    company: "Google",
    location: "Austin, TX",
    atsScore: 83,
    missing: {
      required: ["GraphQL"],
      preferred: ["Next.js Advanced", "Kubernetes"],
    },
    applyUrl: "https://example.com/apply/google-fullstack",
    source: "greenhouse",
    scannedAt: "Latest",
    jdText:
      "Role Summary:\n- Build full stack apps...\n\nRequirements:\n- React\n- Node\n- GraphQL\n\nPreferred:\n- Next.js\n- Kubernetes\n",
  },
  {
    id: "job-3",
    title: "Platform Engineer",
    company: "Amazon",
    location: "Seattle, WA",
    atsScore: 76,
    missing: {
      required: ["Terraform"],
      preferred: ["SRE Practices", "Cost Optimization"],
    },
    applyUrl: "https://example.com/apply/amazon-platform",
    source: "other",
    scannedAt: "Latest",
    jdText:
      "Responsibilities:\n- Infra automation...\n\nRequirements:\n- Terraform\n- CI/CD\n\nPreferred:\n- SRE\n- Cost Optimization\n",
  },
];

export default function JobsFeedPage() {
  return (
    <div className="p-10">
      <JobsList
        title="Latest Jobs"
        subtitle="Hardcoded feed for now. Later: if logged in show user-relevant jobs, else global feed."
        jobs={mockJobs}
        resumeHrefBase="/resume"
      />
    </div>
  );
}
