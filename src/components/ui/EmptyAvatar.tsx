import './EmptyAvatar.css'

/** Silhueta única para conta sem foto. O mesmo desenho vale em qualquer tamanho. */
export function EmptyAvatar() {
  return (
    <svg className="empty-avatar" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <rect className="empty-avatar__bg" width="100" height="100" />
      <circle className="empty-avatar__fg" cx="50" cy="38" r="14" />
      <ellipse className="empty-avatar__fg" cx="50" cy="78" rx="28.6" ry="20.8" />
    </svg>
  )
}
