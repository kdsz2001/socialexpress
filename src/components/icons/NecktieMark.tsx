import type { SVGProps } from 'react'

type NecktieMarkProps = SVGProps<SVGSVGElement> & {
  title?: string
  /** true = encaixada sob a gola (sem laterais/cintura do pescoço) */
  docked?: boolean
}

/** Silhueta mais fina — crescente U + corpo + ponta */
const D_FULL =
  'M12 4.2Q20 15.2 28 4.2L27 11 25.6 16.5 24.5 20.5 25.4 27 27.2 39 27.6 51 20 61 12.4 51 12.8 39 14.6 27 15.5 20.5 14.4 16.5 13 11Z'

const D_DOCKED =
  'M12 4.2Q20 15.2 28 4.2L26.6 13 27.2 28 27.6 51 20 61 12.4 51 12.8 28 13.4 13Z'

/**
 * Gravata-seta: branca, fina, com chevrons cinza (<<<) apontando à ponta.
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

      {/*
        Chevrons preenchidos (visíveis em tamanho pequeno).
        Apontam para a ponta; com rotate(90°) viram <<< .
      */}
      <g
        className="necktie__chevrons"
        fill="#6e6e7c"
        style={{ opacity: docked ? 0.25 : 1 }}
      >
        <path d="M14.5 25.2 20 30.4 25.5 25.2 23.6 25.2 20 28.4 16.4 25.2Z" />
        <path d="M14.8 32.2 20 37.2 25.2 32.2 23.4 32.2 20 35.2 16.6 32.2Z" />
        <path d="M15.2 39.2 20 43.8 24.8 39.2 23.1 39.2 20 41.9 16.9 39.2Z" />
      </g>
    </svg>
  )
}
