import type { SVGProps } from 'react'

type NecktieMarkProps = SVGProps<SVGSVGElement> & {
  title?: string
  docked?: boolean
}

/** Silhueta fina da logo */
const D_FULL =
  'M12 4.2Q20 15.2 28 4.2L27 11 25.6 16.5 24.5 20.5 25.4 27 27.2 39 27.6 51 20 61 12.4 51 12.8 39 14.6 27 15.5 20.5 14.4 16.5 13 11Z'

const D_DOCKED =
  'M12 4.2Q20 15.2 28 4.2L26.6 13 27.2 28 27.6 51 20 61 12.4 51 12.8 28 13.4 13Z'

/**
 * Gravata-seta: branca + chevrons cinza bem marcados (<<<).
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

      {/* Traços cinza em V — bem grossos para ler em ~15px */}
      <g
        className="necktie__chevrons"
        fill="none"
        stroke="#5c5c6a"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: docked ? 0.2 : 1 }}
      >
        <path d="M14.8 25.5 20 30.8 25.2 25.5" />
        <path d="M15.2 33 20 38 24.8 33" />
        <path d="M15.8 40.5 20 45 24.2 40.5" />
      </g>
    </svg>
  )
}
