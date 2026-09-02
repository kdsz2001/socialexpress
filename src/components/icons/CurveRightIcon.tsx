import type { SVGProps } from 'react'

/** Seta curva direita — Retiradas */
export function CurveRightIcon({
  size = 24,
  strokeWidth = 2.6,
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
      <path d="M3 12a7 7 0 0 1 7-7h8" />
      <path d="M14 2l4 3-4 3" />
    </svg>
  )
}
