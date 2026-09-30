import {
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Camera, Clock, ExternalLink, History, SquarePen, Trash2 } from 'lucide-react'
import './IconAction.css'

const ICONS = {
  edit: SquarePen,
  view: SquarePen,
  image: Camera,
  history: Clock,
  orders: History,
  link: ExternalLink,
  delete: Trash2,
} as const

type IconActionProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  kind: keyof typeof ICONS
  tip: string
}

function clampBounds(anchor: HTMLElement) {
  let node: HTMLElement | null = anchor.parentElement
  while (node && node !== document.body) {
    const style = getComputedStyle(node)
    if (style.overflowX !== 'visible' || style.overflowY !== 'visible') {
      return node.getBoundingClientRect()
    }
    node = node.parentElement
  }
  return new DOMRect(0, 0, window.innerWidth, window.innerHeight)
}

function UiTip({ anchor, text }: { anchor: HTMLElement; text: string }) {
  const tipRef = useRef<HTMLSpanElement>(null)
  const [box, setBox] = useState<{ style: CSSProperties; side: 'top' | 'bottom' } | null>(null)

  useLayoutEffect(() => {
    const tip = tipRef.current
    if (!tip) return

    const place = () => {
      const button = anchor.getBoundingClientRect()
      const tipBox = tip.getBoundingClientRect()
      const limit = clampBounds(anchor)
      const margin = 8
      const gap = 6
      let left = button.left + button.width / 2 - tipBox.width / 2
      let top = button.top - gap - tipBox.height
      let side: 'top' | 'bottom' = 'top'
      if (top < limit.top + margin) {
        top = button.bottom + gap
        side = 'bottom'
      }
      const minLeft = limit.left + margin
      const maxLeft = limit.right - tipBox.width - margin
      left = Math.max(minLeft, Math.min(left, Math.max(minLeft, maxLeft)))
      const arrow = button.left + button.width / 2 - left
      const arrowLeft = Math.max(14, Math.min(arrow, tipBox.width - 14))
      setBox({
        side,
        style: {
          left,
          top,
          '--ui-tip-arrow': `${arrowLeft}px`,
        } as CSSProperties,
      })
    }

    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [anchor, text])

  return createPortal(
    <span
      ref={tipRef}
      className={`ui-tip is-fixed${box ? ' is-placed' : ''}`}
      data-side={box?.side ?? 'top'}
      style={box?.style}
      role="tooltip"
    >
      {text}
    </span>,
    document.body,
  )
}

export function IconAction({
  kind,
  tip,
  className,
  type = 'button',
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: IconActionProps) {
  const Icon = ICONS[kind]
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  return (
    <button
      ref={anchorRef}
      type={type}
      aria-label={tip}
      className={`icon-action${kind === 'delete' ? ' is-danger' : ''}${className ? ` ${className}` : ''}`}
      {...props}
      onMouseEnter={(event) => {
        setOpen(true)
        onMouseEnter?.(event)
      }}
      onMouseLeave={(event) => {
        setOpen(false)
        onMouseLeave?.(event)
      }}
      onFocus={(event) => {
        setOpen(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        setOpen(false)
        onBlur?.(event)
      }}
    >
      <Icon size={15} strokeWidth={2} />
      {open && anchorRef.current ? <UiTip anchor={anchorRef.current} text={tip} /> : null}
    </button>
  )
}

export function IconActions({ children }: { children: ReactNode }) {
  return <div className="icon-actions">{children}</div>
}
