import type { SVGProps } from 'react'

type NecktieMarkProps = SVGProps<SVGSVGElement> & {
  title?: string
  /** true = encaixada sob a gola (sem laterais/cintura do pescoço) */
  docked?: boolean
}

/** Logo completa — crescente U, pescoço, corpo, ponta */
const D_FULL =
  'M8.5 5Q20 16.2 31.5 5L30.2 12 28.2 18 26.5 23 27.8 30 30.5 42 31 52.5 20 62.5 9 52.5 9.5 42 12.2 30 13.5 23 11.8 18 9.8 12Z'

/** Encaixe — mesmo crescente + ponta, sem cintura do pescoço */
const D_DOCKED =
  'M8.5 5Q20 16.2 31.5 5L29.5 14 30.2 28 31 52.5 20 62.5 9 52.5 9.8 28 10.5 14Z'

/**
 * Gravata da logo Social Express — crescente (U) no topo.
 * Aberta: silhueta completa. Encaixada: sem laterais do pescoço.
 */
export function NecktieMark({
  className,
  title,
  docked = false,
  ...props
}: NecktieMarkProps) {
  return (
    <svg
      viewBox="0 0 40 64"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-docked={docked ? 'true' : 'false'}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path
        className="necktie__full"
        style={{ opacity: docked ? 0 : 1 }}
        d={D_FULL}
      />
      <path
        className="necktie__docked"
        style={{ opacity: docked ? 1 : 0 }}
        d={D_DOCKED}
      />
    </svg>
  )
}
