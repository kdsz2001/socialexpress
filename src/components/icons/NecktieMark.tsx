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
        Silhueta sólida estilo logo antiga:
        - topo em U (encaixa no V da gola)
        - ombros do nó
        - corpo afilando até a ponta
      */}
      <path d="M8.2 5.2c.35-.45 1-.65 1.6-.55 2.35.4 4.55 2.85 6.2 2.85 1.65 0 3.85-2.45 6.2-2.85.6-.1 1.25.1 1.6.55.4.5.45 1.15.2 1.7L22.2 12l2.85 2.55c.45.4.6 1.05.4 1.6l-1.35 3.15c-.2.5-.65.8-1.15.9L19.8 21.2 22.7 43.6c.1.75-.35 1.45-1.05 1.7-.3.1-.65.12-1 .05-.5-.1-.9-.4-1.15-.85L16 33.4l-3.5 11.1c-.25.45-.65.75-1.15.85-.35.07-.7.05-1-.05-.7-.25-1.15-.95-1.05-1.7l2.9-22.4-3.15-1.05c-.5-.1-.95-.4-1.15-.9L6.55 16.15c-.2-.55-.05-1.2.4-1.6L9.8 12l-1.8-5.1c-.25-.55-.2-1.2.2-1.7Z" />
    </svg>
  )
}
