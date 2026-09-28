import { useEffect, useId, useRef, type ReactNode } from 'react'
import Button from './Button'
import Icon from './Icon'
import './Modal.css'

export default function Modal({ title, children, onClose }: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const headingId = useId()
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    // React autofocus runs before the native dialog becomes visible.
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    return () => dialog?.close()
  }, [])

  return (
    <dialog ref={ref} className="modal" aria-labelledby={headingId}
      onCancel={event => { event.preventDefault(); onClose() }}>
      <header className="modal__header">
        <h2 id={headingId}>{title}</h2>
        <Button variant="secondary" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></Button>
      </header>
      {children}
    </dialog>
  )
}
