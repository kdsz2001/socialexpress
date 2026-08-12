import type { SVGProps } from 'react'

/**
 * Gravata geométrica meio-seta (branca via currentColor).
 * Vertical → encaixa no V da gola.
 * rotate(-90deg) → seta ← (recolher).
 */
export function NecktieMark({
  className,
  title,
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 24 48"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {/* Cauda em V → nó → corpo → ponta (lê como seta deitada) */}
      <path d="M5 1.5h5.5L12 6l1.5-4.5H19v3.2L14.2 9.5l3.8 4.8-2.7 2.5 1.2 18.7L12 46.8 7.5 35.5l1.2-18.7-2.7-2.5 3.8-4.8L5 4.7V1.5Z" />
    </svg>
  )
}
