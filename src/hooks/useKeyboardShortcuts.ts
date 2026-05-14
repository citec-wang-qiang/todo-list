import { useEffect } from 'react'
import { useHistoryStore } from '../stores/historyStore'
import { useTaskStore } from '../stores/taskStore'
import { useUIStore } from '../stores/uiStore'

const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)

function modKey(e: KeyboardEvent): boolean {
  return isMac ? e.metaKey : e.ctrlKey
}

export const focusHandlers: { search?: () => void; add?: () => void } = {}

export function useKeyboardShortcuts() {
  const setCurrentView = useUIStore((s) => s.setCurrentView)
  const selectedTaskId = useUIStore((s) => s.selectedTaskId)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const setShortcutHelpOpen = useUIStore((s) => s.setShortcutHelpOpen)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // ? key shows help panel (only when not in input)
      if (e.key === '?' && !isInput) {
        e.preventDefault()
        setShortcutHelpOpen(true)
        return
      }

      // Ctrl/Cmd shortcuts
      if (modKey(e)) {
        switch (e.key) {
          case 'n':
          case 'N': {
            e.preventDefault()
            focusHandlers.add?.()
            break
          }
          case 'f':
          case 'F': {
            e.preventDefault()
            focusHandlers.search?.()
            break
          }
          case '1': {
            e.preventDefault()
            setCurrentView('list')
            break
          }
          case '2': {
            e.preventDefault()
            setCurrentView('kanban')
            break
          }
          case '3': {
            e.preventDefault()
            setCurrentView('today')
            break
          }
          case 'z':
          case 'Z': {
            if (e.shiftKey) {
              e.preventDefault()
              useHistoryStore.getState().redo()
            } else {
              e.preventDefault()
              useHistoryStore.getState().undo()
            }
            break
          }
          case 'Enter': {
            e.preventDefault()
            focusHandlers.add?.()
            break
          }
        }
        return
      }

      // Delete key deletes selected task (only when not in input)
      if (e.key === 'Delete' && !isInput && selectedTaskId) {
        e.preventDefault()
        deleteTask(selectedTaskId)
        setSelectedTaskId(null)
      }

      // Escape to close
      if (e.key === 'Escape' && !isInput) {
        setSelectedTaskId(null)
        setShortcutHelpOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedTaskId, setCurrentView, deleteTask, setSelectedTaskId, setShortcutHelpOpen])
}
