"use client";

import { useState } from "react";
import { Bell, Clock } from "lucide-react";

export default function SettingsPage() {
  const [scanFrequency, setScanFrequency] = useState("Hourly");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [telegramAlerts, setTelegramAlerts] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(false);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* SETTINGS CARD */}
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-2xl">

        {/* Scan Frequency */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Clock className="text-blue-500" size={20} />
            Scan Frequency
          </h2>

          <select
            value={scanFrequency}
            onChange={(e) => setScanFrequency(e.target.value)}
            className="w-full p-3 border rounded-xl bg-gray-100 focus:ring-2 focus:ring-blue-500"
          >
            <option>Hourly</option>
            <option>Every 2 hours</option>
            <option>Daily</option>
          </select>
        </div>

        <hr className="my-6" />

        {/* Alerts Section */}
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Bell className="text-yellow-500" size={20} />
            Notifications
          </h2>

          {/* Email Alert */}
          <div className="flex justify-between items-center mb-4">
            <span>Email Alerts</span>
            <button
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`w-14 h-7 rounded-full p-1 transition ${
                emailAlerts ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition ${
                  emailAlerts ? "translate-x-7" : ""
                }`}
              ></div>
            </button>
          </div>

          {/* Telegram Alert */}
          <div className="flex justify-between items-center mb-4">
            <span>Telegram Alerts</span>
            <button
              onClick={() => setTelegramAlerts(!telegramAlerts)}
              className={`w-14 h-7 rounded-full p-1 transition ${
                telegramAlerts ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition ${
                  telegramAlerts ? "translate-x-7" : ""
                }`}
              ></div>
            </button>
          </div>

          {/* SMS Alert */}
          <div className="flex justify-between items-center mb-4">
            <span>SMS Alerts</span>
            <button
              onClick={() => setSmsAlerts(!smsAlerts)}
              className={`w-14 h-7 rounded-full p-1 transition ${
                smsAlerts ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition ${
                  smsAlerts ? "translate-x-7" : ""
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

