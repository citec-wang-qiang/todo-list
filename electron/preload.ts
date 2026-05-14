import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  onTaskReminder: (callback: (taskId: string) => void) => {
    ipcRenderer.on('task-reminder', (_event, taskId) => callback(taskId))
  }
})
