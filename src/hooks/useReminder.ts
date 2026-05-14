import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useTaskStore } from '../stores/taskStore'

export function scheduleReminder(taskId: string, title: string, reminderAt: string) {
  const reminderMs = new Date(reminderAt).getTime()
  invoke('schedule_reminder', { taskId, title, reminderAtMs: reminderMs })
}

export function cancelReminder(taskId: string) {
  invoke('cancel_reminder', { taskId })
}

export function useReminder() {
  const loaded = useTaskStore((s) => s.loaded)
  const tasks = useTaskStore((s) => s.tasks)

  useEffect(() => {
    if (!loaded) return
    const now = Date.now()
    const reminders: [string, string, number][] = []
    for (const task of tasks) {
      if (task.reminderAt) {
        const reminderMs = new Date(task.reminderAt).getTime()
        if (reminderMs > now) {
          reminders.push([task.id, task.title, reminderMs])
        }
      }
    }
    if (reminders.length > 0) {
      invoke('init_reminders', { reminders })
    }
  }, [loaded])

  useEffect(() => {
    let unlisten: (() => void) | null = null
    listen<string>('reminder-triggered', (event) => {
      const taskId = event.payload
      useTaskStore.getState().updateTask(taskId, { reminderAt: null })
      const el = document.getElementById(`task-${taskId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('task-highlight')
        setTimeout(() => el.classList.remove('task-highlight'), 2000)
      }
    }).then((fn) => {
      unlisten = fn
    })

    return () => {
      unlisten?.()
    }
  }, [])
}
