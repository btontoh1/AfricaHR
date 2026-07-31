export function Logo({ className, src }: { className?: string; src?: string | null }) {
  return <img src={src ?? '/logo.png'} alt="Logo" className={`object-contain ${className ?? ''}`} />;
}
