import type { SVGProps } from 'react'

/** Pessoa devolvendo peça/pacote — Devoluções */
export function HandoffInIcon({
  size = 24,
  strokeWidth = 1.75,
  width,
  height,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }) {
  const w = width ?? size
  const h = height ?? size
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* pessoa devolvendo */}
      <circle cx="6.4" cy="5.5" r="2.3" />
      <path d="M2 21v-3.5a4.4 4.4 0 0 1 8.8 0V21" />
      {/* pacote / peça */}
      <rect x="13.3" y="9.2" width="8.2" height="6.2" rx="1.2" />
      <path d="M13.3 12.3h8.2" />
      {/* mão recebendo */}
      <path d="M20.8 17.2c-1.8-.15-3.6.25-4.8 1.35-.8.7-1.2 1.6-1.3 2.55" />
      {/* seta de devolução (da pessoa para a mão) */}
      <path d="M9.3 11.5h3.2" />
      <path d="M11 9.7 13.2 11.5 11 13.3" />
    </svg>
  )
}
