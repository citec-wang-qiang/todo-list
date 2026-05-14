import { create } from 'zustand'
import { loadTasks, insertTask, updateTask, deleteTask } from '../db/tasks'

export type Priority = 'high' | 'medium' | 'low' | 'none'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  status: TaskStatus
  dueDate: string | null
  listId: string | null
  tags: string[]
  isStarred: boolean
  parentId: string | null
  createdAt: string
  updatedAt: string
}

interface TaskState {
  tasks: Task[]
  loaded: boolean

  init: () => Promise<void>
  addTask: (task: Task) => Promise<void>
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleComplete: (id: string) => Promise<void>
  toggleStar: (id: string) => Promise<void>
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  loaded: false,

  init: async () => {
    if (get().loaded) return
    const tasks = await loadTasks()
    set({ tasks, loaded: true })
  },

  addTask: async (task) => {
    await insertTask(task)
    set((s) => ({ tasks: [task, ...s.tasks] }))
  },

  updateTask: async (id, patch) => {
    await updateTask(id, patch)
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
      ),
    }))
  },

  deleteTask: async (id) => {
    await deleteTask(id)
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },

  toggleComplete: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    await updateTask(id, { status: newStatus })
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
          : t
      ),
    }))
  },

  toggleStar: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    const newStarred = !task.isStarred
    await updateTask(id, { isStarred: newStarred })
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, isStarred: newStarred } : t
      ),
    }))
  },
}))
