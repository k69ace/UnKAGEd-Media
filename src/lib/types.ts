// Shared types for the Restaurant Grader multi-agent system.

export type ScanInput = {
  restaurantName: string;
  url?: string;
  location?: string; // city, state or zip - used for GBP / competitor lookups
};

export type DataSource = "live" | "estimated" | "unavailable";

export type Severity = "critical" | "warning" | "good" | "info";

export type AgentId =
  | "website"
  | "seo"
  | "photos"
  | "reviews"
  | "gbp"
  | "competitors";

export type Finding = {
  id: string;
  agentId: AgentId;
  severity: Severity;
  title: string;
  detail: string;
  estimatedImpact?: string; // e.g. "Could be costing ~$400/mo in lost orders"
  fixable?: boolean;
};

export type AgentResult = {
  agentId: AgentId;
  label: string;
  status: "ok" | "error" | "skipped";
  dataSource: DataSource;
  score: number; // 0-100
  summary: string;
  findings: Finding[];
  metrics?: Record<string, string | number | boolean | null>;
  competitors?: CompetitorSnapshot[];
  error?: string;
};

export type CompetitorSnapshot = {
  name: string;
  rating: number;
  reviewCount: number;
  priceLevel?: number;
  standing: "ahead" | "behind" | "even";
};

export type ScanResult = {
  scanId: string;
  input: ScanInput;
  generatedAt: string;
  overallScore: number;
  grade: string;
  agents: AgentResult[];
  topIssues: Finding[];
  competitors: CompetitorSnapshot[];
  dataMode: "live" | "mixed" | "demo";
};

export type FixRequest = {
  finding: Finding;
  agentId: AgentId;
  scanInput: ScanInput;
};

export type FixResult = {
  findingId: string;
  title: string;
  before: string;
  after: string;
  explanation: string;
  generatedBy: "ai" | "template";
};

export type LeadRequest = {
  scanId: string;
  scanInput: ScanInput;
  overallScore: number;
  topIssueTitle?: string;
  name?: string;
  email: string;
  phone?: string;
};

export type LeadResult = {
  received: boolean;
};
