import { useId, type InputHTMLAttributes } from 'react'
import './ui.css'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

function Input({
  label,
  id,
  error,
  className = '',
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const descriptionIds = [describedBy, error ? errorId : undefined]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input
        {...props}
        data-autofocus={props.autoFocus || undefined}
        id={inputId}
        className={`input ${className}`.trim()}
        aria-invalid={error ? true : invalid}
        aria-describedby={descriptionIds}
      />
      {error && (
        <span id={errorId} className="field__error">{error}</span>
      )}
    </div>
  )
}

export default Input
