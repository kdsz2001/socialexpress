import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Camera, SquarePen, Trash2 } from 'lucide-react'
import './IconAction.css'

const ICONS = {
  edit: SquarePen,
  view: SquarePen,
  image: Camera,
  delete: Trash2,
} as const

type IconActionProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  kind: keyof typeof ICONS
  tip: string
}

export function IconAction({ kind, tip, className, type = 'button', ...props }: IconActionProps) {
  const Icon = ICONS[kind]
  return (
    <button
      type={type}
      aria-label={tip}
      className={`icon-action${kind === 'delete' ? ' is-danger' : ''}${className ? ` ${className}` : ''}`}
      {...props}
    >
      <Icon size={15} strokeWidth={2} />
      <span className="ui-tip" role="tooltip">
        {tip}
      </span>
    </button>
  )
}

export function IconActions({ children }: { children: ReactNode }) {
  return <div className="icon-actions">{children}</div>
}
