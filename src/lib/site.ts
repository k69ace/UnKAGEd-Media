export const site = {
  name: "unKAGEd Media",
  legalName: "unKAGEd Media",
  url: "https://unkaged.media",
  domain: "unkaged.media",
  founder: "Kirk Ahlquist",
  email: "kirk@unkagedmedia.com",
  description:
    "AI-powered business systems for restaurants, bars, and catering operations, built by a 30-year hospitality operator.",
  bookingUrl: "https://growth.unkaged.media/free-digital-marketing-consultation",
  social: {
    linkedin: "https://www.linkedin.com/in/kirkahlquist",
  },
} as const;

export type NavItem = {
  label: string;
  href: string;
};

// The Lab is added once it ships content (Phase 3).
export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Apps", href: "/apps" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "About Kirk", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const footerNav: NavItem[] = [...primaryNav];
