"use client";

import { useState } from "react";
import type { ScanInput } from "@/lib/types";

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL;
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

function BookCallCta({ topIssueTitle }: { topIssueTitle?: string }) {
  const label = topIssueTitle ? `Book a free 15-min call to fix: ${topIssueTitle}` : "Book your free 15-minute fix-it call";

  if (BOOKING_URL) {
    return (
      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        {label} →
      </a>
    );
  }
  if (CONTACT_EMAIL) {
    return (
      <a
        href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Restaurant Grader — book a fix-it call")}`}
        className="inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        {label} →
      </a>
    );
  }
  return null;
}

export function LeadCaptureCard({
  scanId,
  scanInput,
  overallScore,
  topIssueTitle,
}: {
  scanId: string;
  scanInput: ScanInput;
  overallScore: number;
  topIssueTitle?: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("submitting");
    setError(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanId,
          scanInput,
          overallScore,
          topIssueTitle,
          name: name.trim() || undefined,
          email: email.trim(),
          phone: phone.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl bg-indigo-600 p-6 text-center text-white shadow-sm sm:p-8">
        <p className="text-lg font-semibold">Your full report is on its way to {email}.</p>
        <p className="mt-1 text-sm text-indigo-100">Want it fixed faster? Grab 15 minutes with our team.</p>
        <div className="mt-4">
          <BookCallCta topIssueTitle={topIssueTitle} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
      <div className="mb-4 text-center sm:text-left">
        <h2 className="text-lg font-semibold text-slate-900">Get your full report + a free fix-it call</h2>
        <p className="mt-1 text-sm text-slate-500">
          We&apos;ll email you a copy of this scan and a free 15-minute call to walk through your top issues. No obligation.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <input
            type="email"
            required
            maxLength={120}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@restaurant.com"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div className="flex-1">
          <input
            type="tel"
            maxLength={30}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <button
          type="submit"
          disabled={state === "submitting" || !email.trim()}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "submitting" ? "Sending…" : "Email my report"}
        </button>
      </form>
      {state === "error" && error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
