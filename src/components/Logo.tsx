export function LogoMark({ size = 8 }: { size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(160deg, var(--feather-light) 0%, var(--feather-medium) 55%, var(--feather-dark) 100%)",
      }}
      aria-hidden
    />
  );
}

export function Logotype({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`}>
      <span>unKAGEd</span>
      <span className="border-b-2 border-accent-line">Media</span>
    </span>
  );
}
