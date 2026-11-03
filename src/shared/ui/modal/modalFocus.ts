type ModalEntry = { overlay: HTMLElement; dialog: HTMLElement; close: () => void }
const stack: ModalEntry[] = []
const inertBefore = new Map<HTMLElement, boolean>()
let overflowBefore = ''

function focusable(dialog: HTMLElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]'))
    .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && !element.closest('[inert], [hidden], [aria-hidden="true"]') && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden')
}

function focusInside(entry: ModalEntry) {
  const autofocus = entry.dialog.querySelector<HTMLElement>('[autofocus]')
  ;(autofocus && focusable(entry.dialog).includes(autofocus) ? autofocus : focusable(entry.dialog)[0] ?? entry.dialog).focus()
}

function syncBackground() {
  const top = stack.at(-1)
  for (const [element, original] of inertBefore) element.inert = original
  inertBefore.clear()
  if (!top) return
  for (const child of document.body.children) {
    if (!(child instanceof HTMLElement) || child === top.overlay) continue
    // Only our non-interrupting feedback portal stays available for announcements.
    if (child.matches('[data-modal-feedback]')) continue
    inertBefore.set(child, child.inert)
    child.inert = true
  }
  stack.forEach((entry, index) => {
    entry.overlay.style.zIndex = String(1200 + index)
    entry.overlay.setAttribute('aria-hidden', String(entry !== top))
  })
}

export function manageModal(entry: ModalEntry) {
  const launcher = document.activeElement instanceof HTMLElement ? document.activeElement : null
  if (!stack.length) {
    overflowBefore = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  stack.push(entry)
  syncBackground()
  focusInside(entry)
  const onKeyDown = (event: KeyboardEvent) => {
    if (stack.at(-1) !== entry) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      entry.close()
    } else if (event.key === 'Tab') {
      const controls = focusable(entry.dialog)
      const first = controls[0] ?? entry.dialog
      const last = controls.at(-1) ?? entry.dialog
      if (!controls.length || !entry.dialog.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      }
    }
  }
  const onFocus = (event: FocusEvent) => {
    if (stack.at(-1) === entry && !entry.dialog.contains(event.target as Node)) focusInside(entry)
  }
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('focusin', onFocus)
  return () => {
    const wasTop = stack.at(-1) === entry
    const index = stack.indexOf(entry)
    if (index !== -1) stack.splice(index, 1)
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('focusin', onFocus)
    syncBackground()
    if (!stack.length) document.body.style.overflow = overflowBefore
    if (wasTop) {
      const top = stack.at(-1)
      if (launcher?.isConnected && !launcher.closest('[inert]') && (!top || top.dialog.contains(launcher))) launcher.focus()
      else if (top) focusInside(top)
    }
  }
}
