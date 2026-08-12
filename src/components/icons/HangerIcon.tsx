import type { SVGProps } from 'react'

/** Cabide — ícone usado no Clarial para Provas */
export function HangerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 4a2 2 0 0 1 1.7 3.05L9 12h10l-1.2 7.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 12h4l4.7-4.95A2 2 0 0 0 12 4Z" />
    </svg>
  )
}
