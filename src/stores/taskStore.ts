import { create } from 'zustand'
import { loadTasks, insertTask, updateTask, deleteTask, batchUpdateSortOrders } from '../db/tasks'
import { useHistoryStore } from './historyStore'
import { cancelReminder, scheduleReminder } from '../hooks/useReminder'

export type Priority = 'high' | 'medium' | 'low' | 'none'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  status: TaskStatus
  dueDate: string | null
  reminderAt: string | null
  listId: string | null
  tags: string[]
  isStarred: boolean
  parentId: string | null
  sortOrder: number
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
  reorderTasks: (orderedIds: string[]) => Promise<void>
  moveTask: (taskId: string, newStatus: TaskStatus, insertAfterId: string | null) => Promise<void>

  getSubtasks: (parentId: string) => Task[]
  getNestingLevel: (taskId: string) => number
  getSubtaskProgress: (parentId: string) => { done: number; total: number }
  addSubtask: (parentId: string, title: string) => Promise<void>
  toggleCompleteWithSubtasks: (id: string) => Promise<void>
  reorderSubtasks: (parentId: string | null, orderedIds: string[]) => Promise<void>
  MAX_NESTING_LEVEL: number
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  loaded: false,
  MAX_NESTING_LEVEL: 3,

  init: async () => {
    if (get().loaded) return
    const tasks = await loadTasks()
    set({ tasks, loaded: true })
  },

  addTask: async (task) => {
    const tasks = get().tasks
    const maxOrder = tasks.reduce((max, t) => Math.max(max, t.sortOrder), 0)
    const taskWithOrder = { ...task, sortOrder: maxOrder + 1 }
    await insertTask(taskWithOrder)
    set((s) => ({ tasks: [taskWithOrder, ...s.tasks] }))

    useHistoryStore.getState().push({
      description: `添加任务: ${task.title}`,
      undo: async () => {
        await deleteTask(task.id)
        useTaskStore.setState((s) => ({
          tasks: s.tasks.filter((t) => t.id !== task.id),
        }))
      },
      redo: async () => {
        await insertTask(taskWithOrder)
        useTaskStore.setState((s) => ({
          tasks: [taskWithOrder, ...s.tasks],
        }))
      },
    })
  },

  updateTask: async (id, patch) => {
    const oldTask = get().tasks.find((t) => t.id === id)
    if (!oldTask) return

    await updateTask(id, patch)
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
      ),
    }))

    const oldFields: Partial<Task> = {}
    for (const key of Object.keys(patch) as (keyof Task)[]) {
      ;(oldFields as Record<string, unknown>)[key] = oldTask[key]
    }

    useHistoryStore.getState().push({
      description: `编辑任务: ${oldTask.title}`,
      undo: async () => {
        await updateTask(id, oldFields)
        useTaskStore.setState((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...oldFields } : t
          ),
        }))
      },
      redo: async () => {
        await updateTask(id, patch)
        useTaskStore.setState((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
          ),
        }))
      },
    })
  },

  deleteTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return

    await deleteTask(id)
    cancelReminder(id)
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))

    useHistoryStore.getState().push({
      description: `删除任务: ${task.title}`,
      undo: async () => {
        await insertTask(task)
        useTaskStore.setState((s) => ({
          tasks: [task, ...s.tasks],
        }))
      },
      redo: async () => {
        await deleteTask(task.id)
        useTaskStore.setState((s) => ({
          tasks: s.tasks.filter((t) => t.id !== task.id),
        }))
      },
    })
  },

  toggleComplete: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    const oldStatus = task.status
    const newStatus = oldStatus === 'done' ? 'todo' : 'done'
    await updateTask(id, { status: newStatus })
    if (newStatus === 'done') {
      cancelReminder(id)
    } else if (task.reminderAt) {
      scheduleReminder(id, task.title, task.reminderAt)
    }
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
          : t
      ),
    }))

    useHistoryStore.getState().push({
      description: `${oldStatus === 'done' ? '取消完成' : '完成任务'}: ${task.title}`,
      undo: async () => {
        await updateTask(id, { status: oldStatus })
        useTaskStore.setState((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: oldStatus } : t
          ),
        }))
      },
      redo: async () => {
        await updateTask(id, { status: newStatus })
        useTaskStore.setState((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
              : t
          ),
        }))
      },
    })
  },

  toggleStar: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    const oldStarred = task.isStarred
    const newStarred = !oldStarred
    await updateTask(id, { isStarred: newStarred })
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, isStarred: newStarred } : t
      ),
    }))

    useHistoryStore.getState().push({
      description: `${newStarred ? '标记重要' : '取消重要'}: ${task.title}`,
      undo: async () => {
        await updateTask(id, { isStarred: oldStarred })
        useTaskStore.setState((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, isStarred: oldStarred } : t
          ),
        }))
      },
      redo: async () => {
        await updateTask(id, { isStarred: newStarred })
        useTaskStore.setState((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, isStarred: newStarred } : t
          ),
        }))
      },
    })
  },

  reorderTasks: async (orderedIds) => {
    const updates = orderedIds.map((id, index) => ({
      id,
      sortOrder: index,
    }))
    const idToOrder = new Map(updates.map((u) => [u.id, u.sortOrder]))
    await batchUpdateSortOrders(updates)
    set((s) => ({
      tasks: s.tasks.map((t) =>
        idToOrder.has(t.id)
          ? { ...t, sortOrder: idToOrder.get(t.id)!, updatedAt: new Date().toISOString() }
          : t
      ),
    }))
  },

  moveTask: async (taskId, newStatus, insertAfterId) => {
    const tasks = get().tasks
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const sameStatusTasks = tasks
      .filter((t) => t.status === newStatus && t.id !== taskId)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    let newOrder: number
    if (insertAfterId) {
      const afterIdx = sameStatusTasks.findIndex((t) => t.id === insertAfterId)
      if (afterIdx >= 0) {
        const after = sameStatusTasks[afterIdx]
        const next = sameStatusTasks[afterIdx + 1]
        if (next) {
          newOrder = (after.sortOrder + next.sortOrder) / 2
        } else {
          newOrder = after.sortOrder + 1
        }
      } else {
        newOrder = sameStatusTasks.length > 0
          ? sameStatusTasks[sameStatusTasks.length - 1].sortOrder + 1
          : 0
      }
    } else {
      newOrder = sameStatusTasks.length > 0
        ? sameStatusTasks[0].sortOrder - 1
        : 0
    }

    await updateTask(taskId, { status: newStatus, sortOrder: newOrder })
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, sortOrder: newOrder, updatedAt: new Date().toISOString() }
          : t
      ),
    }))
  },

  getSubtasks: (parentId) => {
    return get()
      .tasks.filter((t) => t.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  },

  getNestingLevel: (taskId) => {
    let level = 0
    let currentId: string | null = taskId
    const tasks = get().tasks
    while (currentId) {
      const task = tasks.find((t) => t.id === currentId)
      if (!task || !task.parentId) break
      level++
      currentId = task.parentId
    }
    return level
  },

  getSubtaskProgress: (parentId) => {
    const subtasks = get().getSubtasks(parentId)
    const done = subtasks.filter((t) => t.status === 'done').length
    return { done, total: subtasks.length }
  },

  addSubtask: async (parentId, title) => {
    const siblings = get().getSubtasks(parentId)
    const now = new Date().toISOString()
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      description: '',
      priority: 'none',
      status: 'todo',
      dueDate: null,
      listId: null,
      tags: [],
      isStarred: false,
      reminderAt: null,
      parentId,
      sortOrder: siblings.length,
      createdAt: now,
      updatedAt: now,
    }
    await insertTask(task)
    set((s) => ({ tasks: [task, ...s.tasks] }))

    useHistoryStore.getState().push({
      description: `添加子任务: ${title}`,
      undo: async () => {
        await deleteTask(task.id)
        useTaskStore.setState((s) => ({
          tasks: s.tasks.filter((t) => t.id !== task.id),
        }))
      },
      redo: async () => {
        await insertTask(task)
        useTaskStore.setState((s) => ({
          tasks: [task, ...s.tasks],
        }))
      },
    })
  },

  toggleCompleteWithSubtasks: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    const oldStatus = task.status
    const newStatus = oldStatus === 'done' ? 'todo' : 'done'

    const collectDescendants = (parentId: string): string[] => {
      const children = get().tasks.filter((t) => t.parentId === parentId)
      const ids = children.map((c) => c.id)
      for (const child of children) {
        ids.push(...collectDescendants(child.id))
      }
      return ids
    }

    const allIds = [id, ...collectDescendants(id)]

    const oldStatuses = new Map<string, string>()
    for (const tid of allIds) {
      const t = get().tasks.find((t) => t.id === tid)
      if (t) oldStatuses.set(tid, t.status)
    }

    for (const tid of allIds) {
      await updateTask(tid, { status: newStatus })
    }

    set((s) => ({
      tasks: s.tasks.map((t) =>
        allIds.includes(t.id)
          ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
          : t
      ),
    }))

    useHistoryStore.getState().push({
      description: `${oldStatus === 'done' ? '取消完成' : '完成任务'}及其子任务: ${task.title}`,
      undo: async () => {
        for (const [tid, st] of oldStatuses) {
          await updateTask(tid, { status: st as TaskStatus })
        }
        useTaskStore.setState((s) => ({
          tasks: s.tasks.map((t) => {
            const oldSt = oldStatuses.get(t.id)
            return oldSt ? { ...t, status: oldSt as TaskStatus } : t
          }),
        }))
      },
      redo: async () => {
        for (const tid of allIds) {
          await updateTask(tid, { status: newStatus })
        }
        useTaskStore.setState((s) => ({
          tasks: s.tasks.map((t) =>
            allIds.includes(t.id)
              ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
              : t
          ),
        }))
      },
    })
  },

  reorderSubtasks: async (parentId, orderedIds) => {
    const oldTasks = get().tasks
      .filter((t) => t.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    for (let i = 0; i < orderedIds.length; i++) {
      await updateTask(orderedIds[i], { sortOrder: i })
    }

    set((s) => ({
      tasks: s.tasks.map((t) =>
        orderedIds.includes(t.id)
          ? { ...t, sortOrder: orderedIds.indexOf(t.id) }
          : t
      ),
    }))

    useHistoryStore.getState().push({
      description: '重新排序子任务',
      undo: async () => {
        for (const ot of oldTasks) {
          await updateTask(ot.id, { sortOrder: ot.sortOrder })
        }
        useTaskStore.setState((s) => ({
          tasks: s.tasks.map((t) => {
            const old = oldTasks.find((o) => o.id === t.id)
            return old ? { ...t, sortOrder: old.sortOrder } : t
          }),
        }))
      },
      redo: async () => {
        for (let i = 0; i < orderedIds.length; i++) {
          await updateTask(orderedIds[i], { sortOrder: i })
        }
        useTaskStore.setState((s) => ({
          tasks: s.tasks.map((t) =>
            orderedIds.includes(t.id)
              ? { ...t, sortOrder: orderedIds.indexOf(t.id) }
              : t
          ),
        }))
      },
    })
  },
}))
