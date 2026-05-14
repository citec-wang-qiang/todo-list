import { create } from 'zustand'

export interface TodoList {
  id: string
  name: string
  color: string
  icon: string
  createdAt: string
}

interface ListState {
  lists: TodoList[]

  addList: (list: TodoList) => void
  updateList: (id: string, patch: Partial<TodoList>) => void
  deleteList: (id: string) => void
}

export const useListStore = create<ListState>()((set) => ({
  lists: [
    { id: 'default-work', name: '工作', color: '#1677ff', icon: 'FolderOutlined', createdAt: new Date().toISOString() },
    { id: 'default-personal', name: '个人', color: '#52c41a', icon: 'UserOutlined', createdAt: new Date().toISOString() },
    { id: 'default-shopping', name: '购物', color: '#fa8c16', icon: 'ShoppingCartOutlined', createdAt: new Date().toISOString() }
  ],

  addList: (list) =>
    set((s) => ({ lists: [...s.lists, list] })),

  updateList: (id, patch) =>
    set((s) => ({
      lists: s.lists.map((l) => (l.id === id ? { ...l, ...patch } : l))
    })),

  deleteList: (id) =>
    set((s) => ({ lists: s.lists.filter((l) => l.id !== id) }))
}))
