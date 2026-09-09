import { useId, type SVGProps } from 'react'

type NecktieMarkProps = SVGProps<SVGSVGElement> & {
  title?: string
  docked?: boolean
}

const BRAND_BLUE = '#3699FF'
const TIE_PATH =
  'M8.5 4.5Q20 16.5 31.5 4.5L28.8 14.5 27.8 21 28.6 31 29.2 44 20 58 10.8 44 11.4 31 12.2 21 11.2 14.5Z'

/**
 * Gravata / seta estilo Clarial.
 * Aberta: idle escuro + ponta azul suave; hover com fade suave e azul se espalhando.
 * Fechada: azul com fade na ponta, encaixe sob a gola.
 */
export function NecktieMark({
  className,
  title,
  docked = false,
  ...props
}: NecktieMarkProps) {
  const reactId = useId().replace(/:/g, '')
  const dockGid = `tieDock-${reactId}`
  const idleGid = `tieIdle-${reactId}`
  const hoverGid = `tieHover-${reactId}`

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
        {docked ? (
          <linearGradient
            id={dockGid}
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
        ) : (
          <>
            {/* Idle: corpo escuro, ponta azul um pouco mais visível */}
            <linearGradient
              id={idleGid}
              x1="20"
              y1="4"
              x2="20"
              y2="60"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#3F4254" stopOpacity="0.42" />
              <stop offset="50%" stopColor="#3F4254" stopOpacity="0.38" />
              <stop offset="72%" stopColor="#2F5FA0" stopOpacity="0.72" />
              <stop offset="100%" stopColor="#3A6DB0" stopOpacity="1" />
            </linearGradient>
            {/* Hover: azul mais claro se espalhando pelo corpo */}
            <linearGradient
              id={hoverGid}
              x1="20"
              y1="4"
              x2="20"
              y2="60"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#4A5578" stopOpacity="0.55" />
              <stop offset="35%" stopColor="#3A6DB0" stopOpacity="0.7" />
              <stop offset="65%" stopColor="#4A90E2" stopOpacity="0.9" />
              <stop offset="100%" stopColor={BRAND_BLUE} stopOpacity="1" />
            </linearGradient>
          </>
        )}
      </defs>

      {docked ? (
        <path fill={`url(#${dockGid})`} d={TIE_PATH} />
      ) : (
        <>
          <path
            className="necktie-mark__idle"
            fill={`url(#${idleGid})`}
            d={TIE_PATH}
          />
          <path
            className="necktie-mark__hover"
            fill={`url(#${hoverGid})`}
            d={TIE_PATH}
          />
        </>
      )}
    </svg>
  )
}
