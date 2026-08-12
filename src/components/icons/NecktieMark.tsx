import { useId, type SVGProps } from 'react'

type NecktieMarkProps = SVGProps<SVGSVGElement> & {
  title?: string
  docked?: boolean
}

const BRAND_BLUE = '#3699FF'
/** Cinzas do << do menu (claro + escuro) */
const ARROW_GRAY_LIGHT = '#A2A3B7'
const ARROW_GRAY_DARK = '#637099'

/**
 * Gravata-seta: azul Clarial + cinzas em chevron (<<<) quando aberta.
 * Fechada: azul com fade na ponta, sem riscos (encaixe limpo).
 */
export function NecktieMark({
  className,
  title,
  docked = false,
  ...props
}: NecktieMarkProps) {
  const reactId = useId().replace(/:/g, '')
  const gid = `tieFade-${reactId}`
  const clipId = `tieClip-${reactId}`

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
        <path
          id={`${clipId}-shape`}
          d="M8.5 4.8Q20 17.5 31.5 4.8L28.8 15.2 27.8 22.5 28.6 34 29.5 50 20 67.5 10.5 50 11.4 34 12.2 22.5 11.2 15.2Z"
        />
        <clipPath id={clipId}>
          <use href={`#${clipId}-shape`} />
        </clipPath>

        {docked ? (
          <linearGradient
            id={gid}
            x1="20"
            y1="4"
            x2="20"
            y2="70"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={BRAND_BLUE} stopOpacity="1" />
            <stop offset="45%" stopColor={BRAND_BLUE} stopOpacity="1" />
            <stop offset="75%" stopColor={BRAND_BLUE} stopOpacity="0.5" />
            <stop offset="100%" stopColor={BRAND_BLUE} stopOpacity="0" />
          </linearGradient>
        ) : (
          /* Azul → cinza na direção da ponta (seta) */
          <linearGradient
            id={gid}
            x1="20"
            y1="8"
            x2="20"
            y2="62"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={BRAND_BLUE} />
            <stop offset="42%" stopColor={BRAND_BLUE} />
            <stop offset="78%" stopColor={ARROW_GRAY_LIGHT} />
            <stop offset="100%" stopColor={ARROW_GRAY_DARK} />
          </linearGradient>
        )}
      </defs>

      <use
        href={`#${clipId}-shape`}
        fill={docked ? `url(#${gid})` : `url(#${gid})`}
      />

      {/* Chevrons cinza só quando aberta — leem como <<< após rotate(90°) */}
      {!docked ? (
        <g
          className="necktie__chevrons"
          clipPath={`url(#${clipId})`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M14.2 27 20 33.2 25.8 27"
            stroke={ARROW_GRAY_LIGHT}
            strokeWidth="2.35"
          />
          <path
            d="M14.5 36.5 20 42.5 25.5 36.5"
            stroke={ARROW_GRAY_DARK}
            strokeWidth="2.35"
          />
          <path
            d="M15 46 20 51.5 25 46"
            stroke={ARROW_GRAY_LIGHT}
            strokeWidth="2.2"
          />
        </g>
      ) : null}
    </svg>
  )
}
