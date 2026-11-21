/** Brand logo: the "P" node symbol plus the wordmark in the display font (Lato Bold). */
export function Sygnet({ size = 32, color = "#1B3F8F" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M22 52V21A11 11 0 1 1 36.4 31.46" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" />
      <circle cx="22" cy="52" r="6" fill={color} />
      <circle cx="36.4" cy="31.46" r="6" fill={color} />
    </svg>
  );
}

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Sygnet color={inverted ? "#FFD93D" : "#1B3F8F"} />
      <span className={`font-display text-2xl font-bold tracking-tight ${inverted ? "text-papier" : "text-atrament"}`}>
        Pomysłownik
      </span>
    </span>
  );
}
