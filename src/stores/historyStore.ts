import { create } from 'zustand'

export interface HistoryCommand {
  undo: () => Promise<void>
  redo: () => Promise<void>
  description: string
}

interface HistoryState {
  past: HistoryCommand[]
  future: HistoryCommand[]
  maxDepth: number

  push: (command: HistoryCommand) => void
  undo: () => Promise<void>
  redo: () => Promise<void>
  clear: () => void
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  past: [],
  future: [],
  maxDepth: 50,

  push: (command) => {
    set((s) => {
      const past = [...s.past, command]
      if (past.length > s.maxDepth) {
        past.splice(0, past.length - s.maxDepth)
      }
      return { past, future: [] }
    })
  },

  undo: async () => {
    const { past } = get()
    if (past.length === 0) return
    const command = past[past.length - 1]
    await command.undo()
    set((s) => ({
      past: s.past.slice(0, -1),
      future: [...s.future, command],
    }))
  },

  redo: async () => {
    const { future } = get()
    if (future.length === 0) return
    const command = future[future.length - 1]
    await command.redo()
    set((s) => ({
      past: [...s.past, command],
      future: s.future.slice(0, -1),
    }))
  },

  clear: () => set({ past: [], future: [] }),
}))
