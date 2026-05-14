import { create } from 'zustand'
import { loadLists, insertList, updateList, deleteList, seedDefaultLists } from '../db/lists'

export interface TodoList {
  id: string
  name: string
  color: string
  icon: string
  createdAt: string
}

interface ListState {
  lists: TodoList[]
  loaded: boolean

  init: () => Promise<void>
  addList: (list: TodoList) => Promise<void>
  updateList: (id: string, patch: Partial<TodoList>) => Promise<void>
  deleteList: (id: string) => Promise<void>
}

export const useListStore = create<ListState>()((set, get) => ({
  lists: [],
  loaded: false,

  init: async () => {
    if (get().loaded) return
    await seedDefaultLists()
    const lists = await loadLists()
    set({ lists, loaded: true })
  },

  addList: async (list) => {
    await insertList(list)
    set((s) => ({ lists: [...s.lists, list] }))
  },

  updateList: async (id, patch) => {
    await updateList(id, patch)
    set((s) => ({
      lists: s.lists.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }))
  },

  deleteList: async (id) => {
    await deleteList(id)
    set((s) => ({ lists: s.lists.filter((l) => l.id !== id) }))
  },
}))
