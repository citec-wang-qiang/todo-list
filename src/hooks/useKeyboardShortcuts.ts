import { useEffect } from 'react'
import { useHistoryStore } from '../stores/historyStore'

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useHistoryStore.getState().undo()
      }

      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        useHistoryStore.getState().redo()
      }

      if (mod && e.key === 'Z' && e.shiftKey) {
        e.preventDefault()
        useHistoryStore.getState().redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
