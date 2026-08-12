import type { SVGProps } from 'react'

/** Seta curva esquerda — Devoluções (Clarial) */
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
      aria-hidden="true"
      {...props}
    >
      <path d="M21 12a7 7 0 0 0-7-7H6" />
      <path d="M10 2L6 5l4 3" />
    </svg>
  )
}
