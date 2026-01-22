"use client";

import { useState } from "react";
import { Search, Briefcase, Building2, MapPin } from "lucide-react";

export default function ScraperPage() {
  const [jobUrl, setJobUrl] = useState("");
  const [showResult, setShowResult] = useState(false);

  const handleScan = () => {
    if (!jobUrl.trim()) return;
    setShowResult(true);
  };

  return (
    <div className="p-10 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8">Job Scanner</h1>

      {/* INPUT SECTION */}
      <div className="w-full max-w-xl flex gap-3">
        <input
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          placeholder="Paste job link (LinkedIn or Indeed)"
          className="flex-1 border rounded-xl p-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleScan}
          className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 flex items-center gap-2"
        >
          <Search size={18} />
          Scan
        </button>
      </div>

      {/* JOB RESULT CARD */}
      {showResult && (
        <div className="w-full max-w-xl mt-10 p-6 border rounded-2xl bg-gray-50 shadow">
          <h2 className="text-xl font-semibold mb-4">Job Details</h2>

          <div className="flex items-center gap-3 mb-2">
            <Briefcase size={20} className="text-blue-600" />
            <p className="font-medium">Backend Engineer</p>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <Building2 size={20} className="text-gray-700" />
            <p>Google</p>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <MapPin size={20} className="text-red-500" />
            <p>Remote</p>
          </div>

          <hr className="my-4" />

          <div>
            <h3 className="font-semibold">Minimum Qualifications</h3>
            <ul className="list-disc ml-6 mt-2 text-gray-700 space-y-1">
              <li>3+ years backend development experience</li>
              <li>Knowledge of Java, Go, or Python</li>
              <li>Experience building APIs</li>
            </ul>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold">Preferred Qualifications</h3>
            <ul className="list-disc ml-6 mt-2 text-gray-700 space-y-1">
              <li>Experience with AWS or GCP</li>
              <li>Distributed systems experience</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
