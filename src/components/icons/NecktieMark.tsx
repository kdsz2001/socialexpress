import { useId, type SVGProps } from 'react'

type NecktieMarkProps = SVGProps<SVGSVGElement> & {
  title?: string
  docked?: boolean
}

const BRAND_BLUE = '#3699FF'
const BODY_MUTED = '#3F4254'
const TIE_PATH =
  'M8.5 4.5Q20 16.5 31.5 4.5L28.8 14.5 27.8 21 28.6 31 29.2 44 20 58 10.8 44 11.4 31 12.2 21 11.2 14.5Z'

/**
 * Gravata / seta estilo Clarial.
 * Aberta: corpo escuro + leve azul escuro na ponta; hover só clareia a ponta.
 * Fechada: azul com fade na ponta, encaixe sob a gola.
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
      preserveAspectRatio="xMidYMid meet"
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
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          {docked ? (
            <>
              <stop offset="0%" stopColor={BRAND_BLUE} stopOpacity="1" />
              <stop offset="42%" stopColor={BRAND_BLUE} stopOpacity="1" />
              <stop offset="72%" stopColor={BRAND_BLUE} stopOpacity="0.5" />
              <stop offset="100%" stopColor={BRAND_BLUE} stopOpacity="0" />
            </>
          ) : (
            <>
              {/* Corpo escuro; ponta = --tie-tip (azul escuro, clareia no hover) */}
              <stop offset="0%" stopColor={BODY_MUTED} stopOpacity="0.45" />
              <stop offset="48%" stopColor={BODY_MUTED} stopOpacity="0.4" />
              <stop offset="70%" stopColor="var(--tie-tip)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--tie-tip)" stopOpacity="0.95" />
            </>
          )}
        </linearGradient>
      </defs>

      <path fill={`url(#${gid})`} d={TIE_PATH} />
    </svg>
  )
}
