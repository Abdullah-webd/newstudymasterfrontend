'use client'

import { useEffect } from 'react'

/**
 * Guard against accidentally leaving an in-progress session (exam, past
 * questions). While `active`:
 *  - closing/refreshing the tab shows the browser's confirm dialog
 *  - clicking any in-app link (sidebar, bottom nav, ...) asks for confirmation
 *    first — leaving ends the session, so the student must explicitly agree.
 */
export default function useLeaveGuard(active, message = 'Leaving this page will end your current session. Are you sure?') {
  useEffect(() => {
    if (!active) return

    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = message
      return message
    }

    const onClickCapture = (e) => {
      const link = e.target.closest && e.target.closest('a[href]')
      if (!link) return
      const href = link.getAttribute('href') || ''
      if (!href || href.startsWith('#')) return
      if (!window.confirm(message)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClickCapture, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClickCapture, true)
    }
  }, [active, message])
}
