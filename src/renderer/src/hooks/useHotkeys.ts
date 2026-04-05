import { useEffect } from 'react'

export const useHotkeys = (onHotkey: (combo: string) => void) => {
  useEffect(() => {
    // @ts-ignore
    const unsubscribe = window.api.onGlobalHotkey(onHotkey)

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [onHotkey])
}
