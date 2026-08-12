import { useId, type SVGProps } from 'react'

type NecktieMarkProps = SVGProps<SVGSVGElement> & {
  title?: string
  docked?: boolean
}

const BRAND_BLUE = '#3699FF'

/**
 * Gravata azul Clarial (cor normal).
 * Aberta: sólida.
 * Fechada: fade na ponta, encaixe sob a gola.
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
      viewBox="0 0 40 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-docked={docked ? 'true' : 'false'}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}

      {docked ? (
        <defs>
          <linearGradient
            id={gid}
            x1="20"
            y1="4"
            x2="20"
            y2="60"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={BRAND_BLUE} stopOpacity="1" />
            <stop offset="42%" stopColor={BRAND_BLUE} stopOpacity="1" />
            <stop offset="72%" stopColor={BRAND_BLUE} stopOpacity="0.5" />
            <stop offset="100%" stopColor={BRAND_BLUE} stopOpacity="0" />
          </linearGradient>
        </defs>
      ) : null}

      {/* Silhueta um pouco mais curta — ponta mais perto da gola */}
      <path
        fill={docked ? `url(#${gid})` : BRAND_BLUE}
        d="M8.5 4.5Q20 16.5 31.5 4.5L28.8 14.5 27.8 21 28.6 31 29.2 44 20 58 10.8 44 11.4 31 12.2 21 11.2 14.5Z"
      />
    </svg>
  )
}
