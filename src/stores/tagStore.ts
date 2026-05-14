import { create } from 'zustand'
import { loadTags, insertTag, updateTag, deleteTag } from '../db/tags'

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
}

interface TagState {
  tags: Tag[]
  loaded: boolean

  init: () => Promise<void>
  addTag: (tag: Tag) => Promise<void>
  updateTag: (id: string, patch: Partial<Tag>) => Promise<void>
  removeTag: (id: string) => Promise<void>
}

export const useTagStore = create<TagState>()((set, get) => ({
  tags: [],
  loaded: false,

  init: async () => {
    if (get().loaded) return
    const tags = await loadTags()
    set({ tags, loaded: true })
  },

  addTag: async (tag) => {
    await insertTag(tag)
    set((s) => ({ tags: [...s.tags, tag] }))
  },

  updateTag: async (id, patch) => {
    await updateTag(id, patch)
    set((s) => ({
      tags: s.tags.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  },

  removeTag: async (id) => {
    await deleteTag(id)
    set((s) => ({ tags: s.tags.filter((t) => t.id !== id) }))
  },
}))
