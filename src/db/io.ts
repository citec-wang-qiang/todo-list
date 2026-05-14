import { invoke } from '@tauri-apps/api/core'
import { save, open, message, ask } from '@tauri-apps/plugin-dialog'
import Papa, { type ParseError } from 'papaparse'
import { getDb, closeDb } from './index'
import { useTaskStore } from '../stores/taskStore'
import { useListStore } from '../stores/listStore'

interface ExportSnapshot {
  version: number
  exportedAt: string
  lists: Record<string, unknown>[]
  tasks: Record<string, unknown>[]
  tags: Record<string, unknown>[]
  taskTags: Record<string, unknown>[]
}

interface ImportResult {
  lists: number
  tasks: number
}

function timestamp(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

export async function exportJSON(): Promise<void> {
  const db = await getDb()

  const lists = await db.select<Record<string, unknown>[]>('SELECT * FROM lists')
  const tasks = await db.select<Record<string, unknown>[]>('SELECT * FROM tasks')
  const tags = await db.select<Record<string, unknown>[]>('SELECT * FROM tags')
  const taskTags = await db.select<Record<string, unknown>[]>('SELECT * FROM task_tags')

  const snapshot: ExportSnapshot = {
    version: 1,
    exportedAt: new Date().toISOString(),
    lists,
    tasks,
    tags,
    taskTags,
  }

  const content = JSON.stringify(snapshot, null, 2)
  const filePath = await save({
    defaultPath: `todo-data-${timestamp()}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })

  if (!filePath) return

  await invoke('write_file', { path: filePath, content })
  await message('JSON data exported successfully.', { kind: 'info' })
}

export async function exportCSV(): Promise<void> {
  const db = await getDb()

  const rows = await db.select<Record<string, unknown>[]>(
    `SELECT t.id, t.title, t.description, t.priority, t.status,
            t.due_date, t.list_id, t.is_starred, t.parent_id,
            t.created_at, t.updated_at,
            GROUP_CONCAT(tg.name) AS tags
     FROM tasks t
     LEFT JOIN task_tags tt ON t.id = tt.task_id
     LEFT JOIN tags tg ON tt.tag_id = tg.id
     GROUP BY t.id
     ORDER BY t.created_at DESC`
  )

  const csv = Papa.unparse(rows as Array<Record<string, unknown>>)
  const filePath = await save({
    defaultPath: `todo-tasks-${timestamp()}.csv`,
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  })

  if (!filePath) return

  await invoke('write_file', { path: filePath, content: csv })
  await message('CSV data exported successfully.', { kind: 'info' })
}

export async function importJSON(): Promise<ImportResult> {
  const filePath = await open({
    filters: [{ name: 'JSON', extensions: ['json'] }],
    multiple: false,
  })

  if (!filePath) return { lists: 0, tasks: 0 }

  const content = await invoke<string>('read_file', { path: filePath })
  let snapshot: ExportSnapshot
  try {
    snapshot = JSON.parse(content)
  } catch {
    await message('Invalid JSON file.', { kind: 'error' })
    throw new Error('Invalid JSON file')
  }

  if (!snapshot.version || !Array.isArray(snapshot.tasks)) {
    await message('Invalid data format.', { kind: 'error' })
    throw new Error('Invalid data format')
  }

  const confirmed = await ask('Import will replace all existing data. Continue?', {
    kind: 'warning',
  })
  if (!confirmed) return { lists: 0, tasks: 0 }

  const db = await getDb()

  // Clear existing data in reverse dependency order
  await db.execute('DELETE FROM task_tags')
  await db.execute('DELETE FROM tasks')
  await db.execute('DELETE FROM tags')
  await db.execute('DELETE FROM lists')

  // Insert lists
  if (snapshot.lists) {
    for (const list of snapshot.lists) {
      await db.execute(
        'INSERT INTO lists (id, name, color, icon, created_at) VALUES ($1, $2, $3, $4, $5)',
        [list.id, list.name, list.color, list.icon, list.created_at || new Date().toISOString()]
      )
    }
  }

  // Insert tasks
  for (const task of snapshot.tasks) {
    await db.execute(
      `INSERT INTO tasks (id, title, description, priority, status, due_date, list_id, is_starred, parent_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        task.id, task.title, task.description || '',
        task.priority || 'none', task.status || 'todo',
        task.due_date || null, task.list_id || null,
        task.is_starred ?? 0, task.parent_id || null,
        task.created_at || new Date().toISOString(),
        task.updated_at || new Date().toISOString(),
      ]
    )
  }

  // Insert tags
  if (snapshot.tags) {
    for (const tag of snapshot.tags) {
      try {
        await db.execute(
          'INSERT INTO tags (id, name, color, created_at) VALUES ($1, $2, $3, $4)',
          [tag.id, tag.name, tag.color || '#1677ff', tag.created_at || new Date().toISOString()]
        )
      } catch {
        // Tag may already exist, skip
      }
    }
  }

  // Insert task_tags
  if (snapshot.taskTags) {
    for (const tt of snapshot.taskTags) {
      try {
        await db.execute(
          'INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2)',
          [tt.task_id, tt.tag_id]
        )
      } catch {
        // Duplicate entry, skip
      }
    }
  }

  // Reset and reload stores
  useTaskStore.setState({ tasks: [], loaded: false })
  useListStore.setState({ lists: [], loaded: false })
  await useTaskStore.getState().init()
  await useListStore.getState().init()

  await message(
    `Imported ${snapshot.tasks.length} tasks and ${snapshot.lists?.length || 0} lists.`,
    { kind: 'info' }
  )

  return { lists: snapshot.lists?.length || 0, tasks: snapshot.tasks.length }
}

export async function importCSV(): Promise<number> {
  const filePath = await open({
    filters: [{ name: 'CSV', extensions: ['csv'] }],
    multiple: false,
  })

  if (!filePath) return 0

  const content = await invoke<string>('read_file', { path: filePath })
  const result = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true })

  if (result.errors.length > 0) {
    const msg = result.errors.slice(0, 3).map((e: ParseError) => e.message).join('\n')
    await message(`CSV parse errors:\n${msg}`, { kind: 'error' })
    throw new Error('CSV parse errors')
  }

  const db = await getDb()
  let imported = 0

  for (const row of result.data) {
    const id = row.id || crypto.randomUUID()
    const title = row.title?.trim()
    if (!title) continue

    // Check if task with this id already exists
    const existing = await db.select<{ cnt: number }[]>(
      'SELECT COUNT(*) AS cnt FROM tasks WHERE id = $1',
      [id]
    )
    if (existing[0].cnt > 0) continue

    await db.execute(
      `INSERT INTO tasks (id, title, description, priority, status, due_date, list_id, is_starred, parent_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        title,
        row.description || '',
        row.priority || 'none',
        row.status || 'todo',
        row.due_date || null,
        row.list_id || null,
        row.is_starred === '1' ? 1 : 0,
        row.parent_id || null,
        row.created_at || new Date().toISOString(),
        row.updated_at || new Date().toISOString(),
      ]
    )

    // Handle tags
    const tagNames = (row.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
    for (const name of tagNames) {
      let existingTag = await db.select<{ id: string }[]>(
        'SELECT id FROM tags WHERE name = $1',
        [name]
      )
      let tagId: string
      if (existingTag.length === 0) {
        tagId = crypto.randomUUID()
        await db.execute(
          'INSERT INTO tags (id, name) VALUES ($1, $2)',
          [tagId, name]
        )
      } else {
        tagId = existingTag[0].id
      }
      try {
        await db.execute(
          'INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2)',
          [id, tagId]
        )
      } catch {
        // Duplicate, skip
      }
    }

    imported++
  }

  useTaskStore.setState({ tasks: [], loaded: false })
  await useTaskStore.getState().init()

  await message(`Imported ${imported} tasks from CSV.`, { kind: 'info' })
  return imported
}

export async function createBackup(): Promise<void> {
  const dbPath = await invoke<string>('get_db_path')
  const backupPath = await save({
    defaultPath: `todo-backup-${timestamp()}.db`,
    filters: [{ name: 'Database', extensions: ['db'] }],
  })

  if (!backupPath) return

  await invoke('copy_file', { src: dbPath, dest: backupPath })
  await message('Backup created successfully.', { kind: 'info' })
}

export async function restoreBackup(): Promise<void> {
  const filePath = await open({
    filters: [{ name: 'Database', extensions: ['db'] }],
    multiple: false,
  })

  if (!filePath) return

  const confirmed = await ask('Restoring will overwrite all current data. Continue?', {
    kind: 'warning',
  })
  if (!confirmed) return

  await closeDb()

  const dbPath = await invoke<string>('get_db_path')
  await invoke('copy_file', { src: filePath, dest: dbPath })

  // Reset and reload stores
  useTaskStore.setState({ tasks: [], loaded: false })
  useListStore.setState({ lists: [], loaded: false })
  await useTaskStore.getState().init()
  await useListStore.getState().init()

  await message('Data restored from backup.', { kind: 'info' })
}
