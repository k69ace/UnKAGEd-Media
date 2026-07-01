"use client";

import { useState } from "react";
import type { ScanInput } from "@/lib/types";

export function ScanForm({ onSubmit, disabled }: { onSubmit: (input: ScanInput) => void; disabled: boolean }) {
  const [restaurantName, setRestaurantName] = useState("");
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurantName.trim()) return;
    onSubmit({
      restaurantName: restaurantName.trim(),
      url: url.trim() || undefined,
      location: location.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
      <div className="space-y-4">
        <div>
          <label htmlFor="restaurantName" className="mb-1 block text-sm font-medium text-slate-700">
            Restaurant name <span className="text-red-500">*</span>
          </label>
          <input
            id="restaurantName"
            required
            maxLength={120}
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            placeholder="e.g. Mario's Trattoria"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div>
          <label htmlFor="url" className="mb-1 block text-sm font-medium text-slate-700">
            Website URL
          </label>
          <input
            id="url"
            maxLength={500}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g. mariostrattoria.com"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div>
          <label htmlFor="location" className="mb-1 block text-sm font-medium text-slate-700">
            City / ZIP code
          </label>
          <input
            id="location"
            maxLength={120}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Austin, TX"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !restaurantName.trim()}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled ? "Scanning…" : "Scan My Restaurant — Free"}
        </button>
        <p className="text-center text-xs text-slate-400">No sign-up or credit card required.</p>
      </div>
    </form>
  );
}
