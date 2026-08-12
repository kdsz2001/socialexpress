import { useId, type SVGProps } from 'react'

type NecktieMarkProps = SVGProps<SVGSVGElement> & {
  title?: string
  docked?: boolean
}

const BRAND_BLUE = '#3699FF'
/* Idle aberto — cinza-azulado apagado estilo seta Clarial */
const IDLE_MUTED = '#5E6278'
const IDLE_MUTED_MID = '#6D6F88'
const IDLE_MUTED_TIP = '#8A8DA8'
const TIE_PATH =
  'M8.5 4.5Q20 16.5 31.5 4.5L28.8 14.5 27.8 21 28.6 31 29.2 44 20 58 10.8 44 11.4 31 12.2 21 11.2 14.5Z'

/**
 * Gravata / seta estilo Clarial.
 * Aberta: cinza-azulada apagada; azul vivo só no hover.
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
              {/* Idle: cinza-azulado (img 2); ponta um pouco mais clara → ← após rotate */}
              <stop offset="0%" stopColor={IDLE_MUTED} stopOpacity="0.75" />
              <stop offset="40%" stopColor={IDLE_MUTED_MID} stopOpacity="0.85" />
              <stop offset="72%" stopColor={IDLE_MUTED_TIP} stopOpacity="0.95" />
              <stop offset="100%" stopColor={IDLE_MUTED_TIP} stopOpacity="1" />
            </>
          )}
        </linearGradient>
      </defs>

      <path className="necktie-mark__idle" fill={`url(#${gid})`} d={TIE_PATH} />

      {!docked && (
        <path
          className="necktie-mark__lit"
          fill={BRAND_BLUE}
          d={TIE_PATH}
        />
      )}
    </svg>
  )
}
