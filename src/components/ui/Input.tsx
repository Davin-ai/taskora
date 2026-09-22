import type { InputHTMLAttributes } from 'react'
import './ui.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

function Input({ label, id, ...props }: InputProps) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} className="input" {...props} />
    </label>
  )
}

export default Input