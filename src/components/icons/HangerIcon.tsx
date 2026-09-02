import type { SVGProps } from 'react'

/** Cabide — traço mais grosso no dashboard */
export function HangerIcon({
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
      <circle cx="12" cy="5" r="1.75" />
      <path d="M12 6.75 4.35 14.35A1.85 1.85 0 0 0 5.7 17.5h12.6a1.85 1.85 0 0 0 1.35-3.15L12 6.75Z" />
    </svg>
  )
}
