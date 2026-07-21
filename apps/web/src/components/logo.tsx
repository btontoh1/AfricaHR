export function Logo({ className }: { className?: string }) {
  return <img src="/logo.png" alt="ParrotHR" className={`object-contain ${className ?? ''}`} />;
}
