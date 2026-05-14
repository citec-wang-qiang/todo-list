import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark'
export type ViewType = 'list' | 'kanban' | 'today'
export type SortField = 'priority' | 'dueDate' | 'createdAt' | 'title'
export type SortOrder = 'asc' | 'desc'

interface UIState {
  themeMode: ThemeMode
  siderCollapsed: boolean
  currentView: ViewType
  searchQuery: string
  sortField: SortField
  sortOrder: SortOrder
  selectedListId: string | null

  toggleTheme: () => void
  toggleSider: () => void
  setCurrentView: (view: ViewType) => void
  setSearchQuery: (query: string) => void
  setSortField: (field: SortField) => void
  setSortOrder: (order: SortOrder) => void
  setSelectedListId: (id: string | null) => void
}

export const useUIStore = create<UIState>()((set) => ({
  themeMode: 'light',
  siderCollapsed: false,
  currentView: 'list',
  searchQuery: '',
  sortField: 'createdAt',
  sortOrder: 'desc',
  selectedListId: null,

  toggleTheme: () =>
    set((s) => ({ themeMode: s.themeMode === 'light' ? 'dark' : 'light' })),
  toggleSider: () =>
    set((s) => ({ siderCollapsed: !s.siderCollapsed })),
  setCurrentView: (view) => set({ currentView: view }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortField: (field) => set({ sortField: field }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setSelectedListId: (id) => set({ selectedListId: id })
}))
