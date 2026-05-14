import { create } from 'zustand'
import type { Priority, TaskStatus } from './taskStore'

export type ThemeMode = 'light' | 'dark'
export type ViewType = 'list' | 'kanban' | 'today'
export type SortField = 'priority' | 'dueDate' | 'createdAt' | 'title'
export type SortOrder = 'asc' | 'desc'

export interface Filters {
  priority: Priority | 'all'
  status: TaskStatus | 'all'
  listId: string | 'all'
  tags: string[]
}

interface UIState {
  themeMode: ThemeMode
  siderCollapsed: boolean
  currentView: ViewType
  searchQuery: string
  sortField: SortField
  sortOrder: SortOrder
  selectedListId: string | null
  filters: Filters
  selectedTaskId: string | null
  shortcutHelpOpen: boolean

  toggleTheme: () => void
  toggleSider: () => void
  setCurrentView: (view: ViewType) => void
  setSearchQuery: (query: string) => void
  setSortField: (field: SortField) => void
  setSortOrder: (order: SortOrder) => void
  setSelectedListId: (id: string | null) => void
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  clearFilters: () => void
  setSelectedTaskId: (id: string | null) => void
  setShortcutHelpOpen: (open: boolean) => void
}

const defaultFilters: Filters = {
  priority: 'all',
  status: 'all',
  listId: 'all',
  tags: []
}

export const useUIStore = create<UIState>()((set) => ({
  themeMode: 'light',
  siderCollapsed: false,
  currentView: 'list',
  searchQuery: '',
  sortField: 'createdAt',
  sortOrder: 'desc',
  selectedListId: null,
  filters: { ...defaultFilters },
  selectedTaskId: null,
  shortcutHelpOpen: false,

  toggleTheme: () =>
    set((s) => ({ themeMode: s.themeMode === 'light' ? 'dark' : 'light' })),
  toggleSider: () =>
    set((s) => ({ siderCollapsed: !s.siderCollapsed })),
  setCurrentView: (view) => set({ currentView: view }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortField: (field) => set({ sortField: field }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setSelectedListId: (id) => set({ selectedListId: id }),
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  clearFilters: () => set({ filters: { ...defaultFilters }, searchQuery: '' }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setShortcutHelpOpen: (open) => set({ shortcutHelpOpen: open }),
}))
