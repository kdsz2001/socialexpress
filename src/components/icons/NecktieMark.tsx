import { useId, type SVGProps } from 'react'

type NecktieMarkProps = SVGProps<SVGSVGElement> & {
  title?: string
  docked?: boolean
}

const BRAND_BLUE = '#3699FF'

/**
 * Gravata no modelo da logo — azul Clarial, sem riscos.
 * Aberta: preenchimento sólido.
 * Fechada: fade na ponta para encaixar na gola oficial.
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

      {docked ? (
        <defs>
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
        </defs>
      ) : null}

      <path
        fill={docked ? `url(#${gid})` : BRAND_BLUE}
        d="M8.5 4.8Q20 17.5 31.5 4.8L28.8 15.2 27.8 22.5 28.6 34 29.5 50 20 67.5 10.5 50 11.4 34 12.2 22.5 11.2 15.2Z"
      />
    </svg>
  )
}
