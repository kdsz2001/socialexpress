import type { SVGProps } from 'react'

/** Cabide — gancho aberto + corpo triangular limpo */
export function HangerIcon({
  size = 24,
  strokeWidth = 2,
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
      <path d="M9.6 5.1a2.4 2.4 0 1 1 3.2 2.25" />
      <path d="M12 7.5 4.7 15.1a1.45 1.45 0 0 0 1.05 2.4h12.5a1.45 1.45 0 0 0 1.05-2.4L12 7.5Z" />
    </svg>
  )
}
