export const metadata = {
  title: "Catering Estimator",
  robots: { index: false, follow: false },
};

export default function EstimatorLayout({ children }: { children: React.ReactNode }) {
  return <main className="flex-1 bg-background text-foreground">{children}</main>;
}
