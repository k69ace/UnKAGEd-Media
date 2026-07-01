"use client";

import { useEffect, useState } from "react";

const AGENT_LABELS = [
  "Crawling your website…",
  "Analyzing Google Business Profile…",
  "Scoring photos for quality…",
  "Reading customer reviews…",
  "Checking local SEO signals…",
  "Benchmarking local competitors…",
];

export function AgentProgress() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % AGENT_LABELS.length);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
      <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      <p className="text-lg font-semibold text-slate-900">10 AI agents are scanning your online presence</p>
      <p className="mt-2 h-6 text-sm text-slate-500">{AGENT_LABELS[activeIndex]}</p>
      <ul className="mt-6 grid grid-cols-2 gap-2 text-left text-xs text-slate-500 sm:grid-cols-3">
        {AGENT_LABELS.map((label, i) => (
          <li key={label} className={`flex items-center gap-1.5 ${i <= activeIndex ? "text-indigo-600" : ""}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${i <= activeIndex ? "bg-indigo-600" : "bg-slate-300"}`} />
            {label.replace("…", "")}
          </li>
        ))}
      </ul>
    </div>
  );
}
