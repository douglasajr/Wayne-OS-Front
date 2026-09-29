export function Skeleton({ className = '', height }: { className?: string; height?: number }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ borderRadius: 'var(--radius)', ...(height ? { height } : {}) }}
    />
  );
}
