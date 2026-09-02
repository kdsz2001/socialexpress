import type { SVGProps } from 'react'

/** Blazer / smoking — Provas */
export function BlazerIcon({
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
      {/* gola */}
      <path d="M9.2 3.5c.8 1.2 1.7 1.8 2.8 1.8s2-.6 2.8-1.8" />
      {/* lapelas em V */}
      <path d="M7.5 5 12 9.5 16.5 5" />
      {/* ombros */}
      <path d="M4 10 7.5 5" />
      <path d="M20 10 16.5 5" />
      {/* corpo */}
      <path d="M4 10v10.5h16V10" />
      {/* abertura */}
      <path d="M12 9.5V20.5" />
      {/* lapela interna */}
      <path d="M7.5 5 12 12.5 16.5 5" />
      {/* botões */}
      <circle cx="12" cy="14.5" r="0.65" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.2" r="0.65" fill="currentColor" stroke="none" />
    </svg>
  )
}
