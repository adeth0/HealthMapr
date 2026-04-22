import { type ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
  as?: 'div' | 'button' | 'article'
  style?: React.CSSProperties
}

export default function GlassCard({
  children,
  className = '',
  onClick,
  hoverable = false,
  as: Tag = 'div',
  style,
}: GlassCardProps) {
  return (
    <Tag
      className={`glass-card ${hoverable ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </Tag>
  )
}
