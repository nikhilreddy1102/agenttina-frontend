import { CheckCircle, Briefcase, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* ATS SCORE CARD */}
        <div className="p-8 bg-white rounded-2xl shadow-md flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">ATS Score</h2>

          {/* CIRCLE PROGRESS */}
          <div className="relative w-40 h-40">
            <svg className="w-full h-full">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#ddd"
                strokeWidth="12"
                fill="none"
              ></circle>
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#4ade80"
                strokeWidth="12"
                fill="none"
                strokeDasharray="439"
                strokeDashoffset="100"   // looks like 82%
                strokeLinecap="round"
                className="transition-all"
              ></circle>
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-green-600">82</span>
            </div>
          </div>

          <p className="mt-4 text-gray-500 text-sm">Your resume matches 82% of ATS criteria</p>
        </div>

        
        {/* JOB MATCHES */}
        <div className="p-8 bg-white rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Top Job Matches</h2>

          {/* JOB 1 */}
          <div className="p-4 border rounded-xl mb-4 bg-gray-50 hover:bg-gray-100 transition">
            <div className="flex items-center gap-3">
              <Briefcase className="text-blue-500" />
              <div>
                <p className="font-semibold">Backend Engineer</p>
                <p className="text-gray-600 text-sm">Stripe — 88% Match</p>
              </div>
            </div>
          </div>

          {/* JOB 2 */}
          <div className="p-4 border rounded-xl bg-gray-50 hover:bg-gray-100 transition">
            <div className="flex items-center gap-3">
              <Briefcase className="text-blue-500" />
              <div>
                <p className="font-semibold">Full Stack Developer</p>
                <p className="text-gray-600 text-sm">Google — 83% Match</p>
              </div>
            </div>
          </div>
        </div>

      </div>


      {/* MISSING SKILLS */}
      <div className="mt-10 p-8 bg-white rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-3">Missing Skills</h2>

        <div className="flex gap-3 flex-wrap">
          <span className="px-4 py-2 bg-gray-200 rounded-full">GraphQL</span>
          <span className="px-4 py-2 bg-gray-200 rounded-full">Redis</span>
          <span className="px-4 py-2 bg-gray-200 rounded-full">Next.js Advanced</span>
        </div>
      </div>


      {/* RECENT JOBS */}
      <div className="mt-10 p-8 bg-white rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">Recently Scanned Jobs</h2>

        <div className="space-y-3">
          <div className="p-4 border rounded-xl flex justify-between items-center bg-gray-50">
            <p>Software Engineer — Amazon</p>
            <CheckCircle className="text-green-600" />
          </div>

          <div className="p-4 border rounded-xl flex justify-between items-center bg-gray-50">
            <p>Backend Developer — Meta</p>
            <CheckCircle className="text-green-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

