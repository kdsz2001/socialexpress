import type { SVGProps } from 'react'

/** Seta curva (retirada) — estilo share/reply do Clarial */
export function CurveRightIcon({
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
      {...props}
    >
      <path d="M15 14l5-5-5-5" />
      <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
    </svg>
  )
}
