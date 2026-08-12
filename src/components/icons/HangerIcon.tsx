import type { SVGProps } from 'react'

/** Cabide — traço fino estilo ícones do Clarial */
export function HangerIcon({
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
      <circle cx="12" cy="5" r="1.6" />
      <path d="M12 6.6L4.5 14.2A1.6 1.6 0 0 0 5.7 17h12.6a1.6 1.6 0 0 0 1.2-2.8L12 6.6Z" />
    </svg>
  )
}
