import type { SVGProps } from 'react'

type NecktieMarkProps = SVGProps<SVGSVGElement> & {
  title?: string
  docked?: boolean
}

/**
 * Gravata-seta profissional.
 * Aberta: horizontal nativa, fina, ponta ← + nó + corpo + crescente → + <<< .
 * Fechada: vertical fina no V da gola.
 */
export function NecktieMark({
  className,
  title,
  docked = false,
  ...props
}: NecktieMarkProps) {
  if (docked) {
    return (
      <svg
        viewBox="0 0 32 56"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        data-docked="true"
        aria-hidden={title ? undefined : true}
        role={title ? 'img' : undefined}
        {...props}
      >
        {title ? <title>{title}</title> : null}
        {/* Crescente → corpo fino → ponta */}
        <path d="M9.5 3.5Q16 14 22.5 3.5L21 12.5 21.5 26 22 46 16 54.5 10 46 10.5 26 11 12.5Z" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 72 18"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-docked="false"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}

      {/*
        Silhueta de gravata deitada (fina):
        ponta ← · nó losango · corpo · crescente →
      */}
      <path d="M1.5 9 13 2.8 16.2 5.6 18.8 3.4 22.5 5.8H50L59.5 1.6Q49.5 9 59.5 16.4L50 12.2H22.5L18.8 14.6 16.2 12.4 13 15.2Z" />

      {/* Chevrons <<< preenchidos — legíveis em tamanho pequeno */}
      <g className="necktie__chevrons" fill="#4a4a58">
        <path d="M28.8 5.2 24.2 9 28.8 12.8 27.1 12.8 23.6 9 27.1 5.2Z" />
        <path d="M36.2 5.2 31.6 9 36.2 12.8 34.5 12.8 31 9 34.5 5.2Z" />
        <path d="M43.6 5.2 39 9 43.6 12.8 41.9 12.8 38.4 9 41.9 5.2Z" />
      </g>
    </svg>
  )
}
