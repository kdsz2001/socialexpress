import type { SVGProps } from 'react'

/**
 * Gravata clássica (logo antiga) — topo côncavo em U
 * para encaixar sob a gola (logo 1).
 */
export function NecktieMark({
  className,
  title,
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 32 48"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {/*
        Silhueta da logo antiga (sólida):
        entalhe em U no topo → nó → corpo → ponta.
      */}
      <path d="M5.5 5c0 0 3.8 8.8 10.5 8.8S26.5 5 26.5 5c0 0-1.2 5.8-1.8 7.6l3.1 2.8c.55.5.7 1.3.35 1.95l-1.6 2.95c-.25.45-.7.75-1.2.85L21 22.5l3.15 20.4c.12.8-.4 1.55-1.2 1.75-.35.1-.7.08-1.05-.05-.5-.18-.9-.55-1.1-1.05L16 32.2l-4.8 11.35c-.2.5-.6.87-1.1 1.05-.35.13-.7.15-1.05.05-.8-.2-1.32-.95-1.2-1.75L11 22.5l-4.25-1.2c-.5-.1-.95-.4-1.2-.85L4.0 17.5c-.35-.65-.2-1.45.35-1.95l3.1-2.8C6.7 10.8 5.5 5 5.5 5Z" />
    </svg>
  )
}
