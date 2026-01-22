import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="px-6 py-4 border-b bg-white shadow-sm flex items-center justify-between">
      <h1 className="text-xl font-semibold">AI Job Assistant</h1>

      <div className="flex gap-6 text-gray-700">
        <Link href="/">Home</Link>
        <Link href="/resume">Resume</Link>
        <Link href="/scraper">Scraper</Link>
        <Link href="dashboard/jobs">Jobs</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/chat">Chat</Link>
        <Link href="/settings">Settings</Link>
      </div>
    </nav>
  );
}
