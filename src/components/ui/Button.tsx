import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './ui.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary'
}

function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button