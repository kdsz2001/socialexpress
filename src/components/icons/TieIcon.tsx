import type { SVGProps } from 'react'

/** Gravata — ícone de Produtos no Clarial */
export function TieIcon({
  size = 24,
  strokeWidth = 1.5,
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
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M10 7h4l-1.2 3.2L14 17l-2 2-2-2 1.2-6.8L10 7Z" />
    </svg>
  )
}
