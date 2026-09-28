import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import './ui.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  ref?: Ref<HTMLButtonElement>
}

function Button({
  children,
  variant = 'primary',
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
        data-autofocus={props.autoFocus || undefined}
      type={type}
      className={`button button--${variant} ${className}`.trim()}
    >
      {children}
    </button>
  )
}

export default Button
