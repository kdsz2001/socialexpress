import type { SVGProps } from 'react'

/** Terno / smoking — Provas */
export function BlazerIcon({
  size = 24,
  strokeWidth = 1.75,
  width,
  height,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }) {
  const w = width ?? size
  const h = height ?? size
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* gola / pescoço */}
      <path d="M9.4 3.2c.7 1.15 1.6 1.75 2.6 1.75s1.9-.6 2.6-1.75" />
      {/* ombros do paletó */}
      <path d="M4.2 9.6 7.8 4.6" />
      <path d="M19.8 9.6 16.2 4.6" />
      {/* lapelas */}
      <path d="M7.8 4.6 12 9.2 16.2 4.6" />
      <path d="M7.8 4.6 12 12.4 16.2 4.6" />
      {/* corpo do paletó */}
      <path d="M4.2 9.6V20.8h15.6V9.6" />
      {/* abertura frontal */}
      <path d="M12 9.2V20.8" />
      {/* gravata */}
      <path d="M11.15 5.6h1.7L12 7.15 11.15 5.6Z" />
      <path d="M12 7.15 10.85 12.2h2.3L12 7.15Z" />
      {/* bolsos */}
      <path d="M5.6 14.4h3.1" />
      <path d="M15.3 14.4h3.1" />
      {/* botão */}
      <circle cx="12" cy="15.6" r="0.55" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.8" r="0.55" fill="currentColor" stroke="none" />
    </svg>
  )
}
