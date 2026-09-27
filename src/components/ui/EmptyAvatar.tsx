import './EmptyAvatar.css'

/** Silhueta única, no mesmo desenho do placeholder do Clarial. */
export function EmptyAvatar() {
  return (
    <svg className="empty-avatar" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <rect className="empty-avatar__bg" width="100" height="100" />
      <circle className="empty-avatar__fg" cx="50" cy="37" r="23" />
      <ellipse className="empty-avatar__fg" cx="50" cy="103" rx="40" ry="46" />
    </svg>
  )
}
