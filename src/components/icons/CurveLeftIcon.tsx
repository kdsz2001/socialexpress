import type { SVGProps } from 'react'

/** Seta curva (devolução) — estilo undo do Clarial */
export function CurveLeftIcon({
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
      <path d="M9 14L4 9l5-5" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
  )
}
