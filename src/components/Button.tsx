import { type ReactNode, type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'glass' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  fullWidth?: boolean
}

const variants = {
  primary: 'btn-primary',
  glass: 'btn-glass',
  ghost: 'text-white/60 hover:text-white/90 transition-colors',
  danger: 'bg-signal-red/15 border border-signal-red/30 text-signal-red rounded-2xl font-semibold transition-all hover:bg-signal-red/25 active:scale-[0.97]',
}

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-3 text-[15px]',
  lg: 'px-6 py-4 text-[16px]',
}

export default function Button({
  variant = 'glass',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
        inline-flex items-center justify-center gap-2
        font-semibold rounded-2xl select-none
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
