/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — overlay host
   Sheets/modals portal into a layer that is pinned to the phone screen, so
   they never scroll or clip with the page content.
   ══════════════════════════════════════════════════════════════════════════ */
import { createContext, useContext } from 'react'

export const OverlayCtx = createContext(null)
export const useOverlayHost = () => useContext(OverlayCtx)
