import type { SVGProps } from 'react'

type CollarMarkProps = SVGProps<SVGSVGElement> & {
  /** true = só o V interno (sem bordinhas externas) */
  docked?: boolean
  title?: string
}

/**
 * Gola. Encaixada: remove bordinhas — só o V para a gravata.
 */
export function CollarMark({
  className,
  docked = false,
  title,
  ...props
}: CollarMarkProps) {
  return (
    <svg
      viewBox="0 0 48 30"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-docked={docked ? 'true' : 'false'}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}

      {docked ? (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3 24 25" />
          <path d="M36 3 24 25" />
        </g>
      ) : (
        <g>
          <path d="M2 2h14L24 26 6 10Z" />
          <path d="M46 2H32L24 26 42 10Z" />
        </g>
      )}
    </svg>
  )
}
