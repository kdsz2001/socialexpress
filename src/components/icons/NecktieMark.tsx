import { useId, type SVGProps } from 'react'

type NecktieMarkProps = SVGProps<SVGSVGElement> & {
  title?: string
  docked?: boolean
}

/**
 * Gravata no modelo exato da logo:
 * crescente U → corpo → ponta, fade na ponta + linhas de seta.
 */
export function NecktieMark({
  className,
  title,
  docked = false,
  ...props
}: NecktieMarkProps) {
  const reactId = useId().replace(/:/g, '')
  const gid = `tieFade-${reactId}`

  return (
    <svg
      viewBox="0 0 40 72"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-docked={docked ? 'true' : 'false'}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}

      <defs>
        <linearGradient
          id={gid}
          x1="20"
          y1="4"
          x2="20"
          y2="70"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="58%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="78%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Modelo exato: crescente no topo + corpo + ponta */}
      <path
        fill={`url(#${gid})`}
        d="M8.5 4.8Q20 17.5 31.5 4.8L28.8 15.2 27.8 22.5 28.6 34 29.5 50 20 67.5 10.5 50 11.4 34 12.2 22.5 11.2 15.2Z"
      />

      {/* Linhas de seta cinza bem marcadas */}
      <g
        className="necktie__chevrons"
        fill="none"
        stroke="#6e6e7c"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={docked ? 0.65 : 1}
      >
        <path d="M14.5 26.5 20 32 25.5 26.5" />
        <path d="M14.8 35.5 20 40.8 25.2 35.5" />
        <path d="M15.4 44.5 20 49.5 24.6 44.5" />
      </g>
    </svg>
  )
}
