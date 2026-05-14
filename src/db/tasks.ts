import { getDb } from './index'
import type { Task } from '../stores/taskStore'

interface TaskRow {
  id: string
  title: string
  description: string
  priority: string
  status: string
  due_date: string | null
  list_id: string | null
  is_starred: number
  parent_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
  tags: string | null
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority as Task['priority'],
    status: row.status as Task['status'],
    dueDate: row.due_date,
    listId: row.list_id,
    tags: row.tags ? row.tags.split(',').filter(Boolean) : [],
    isStarred: row.is_starred === 1,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function loadTasks(): Promise<Task[]> {
  const db = await getDb()
  const rows = await db.select<TaskRow[]>(
    `SELECT t.*, GROUP_CONCAT(tg.name) AS tags
     FROM tasks t
     LEFT JOIN task_tags tt ON t.id = tt.task_id
     LEFT JOIN tags tg ON tt.tag_id = tg.id
     GROUP BY t.id
     ORDER BY t.sort_order ASC, t.created_at DESC`
  )
  return rows.map(rowToTask)
}

export async function insertTask(task: Task): Promise<void> {
  const db = await getDb()
  await db.execute(
    `INSERT INTO tasks (id, title, description, priority, status, due_date, list_id, is_starred, parent_id, sort_order, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      task.id,
      task.title,
      task.description,
      task.priority,
      task.status,
      task.dueDate,
      task.listId,
      task.isStarred ? 1 : 0,
      task.parentId,
      task.sortOrder,
      task.createdAt,
      task.updatedAt,
    ]
  )
  await syncTaskTags(db, task.id, task.tags)
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  const db = await getDb()
  const fields: string[] = []
  const values: (string | number | null)[] = []
  let idx = 1

  const fieldMap: Record<string, string> = {
    title: 'title',
    description: 'description',
    priority: 'priority',
    status: 'status',
    dueDate: 'due_date',
    listId: 'list_id',
    isStarred: 'is_starred',
    parentId: 'parent_id',
    sortOrder: 'sort_order',
    updatedAt: 'updated_at',
  }

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in patch) {
      const val = patch[key as keyof typeof patch]
      if (key === 'isStarred') {
        fields.push(`${col} = $${idx++}`)
        values.push(val ? 1 : 0)
      } else {
        fields.push(`${col} = $${idx++}`)
        values.push(val as string | null)
      }
    }
  }

  if (fields.length > 0) {
    fields.push(`updated_at = $${idx++}`)
    values.push(new Date().toISOString())
    values.push(id)
    await db.execute(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx - 1}`,
      values
    )
  }

  if (patch.tags !== undefined) {
    await syncTaskTags(db, id, patch.tags)
  }
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb()
  await db.execute('DELETE FROM tasks WHERE id = $1', [id])
}

export async function batchUpdateSortOrders(
  updates: { id: string; sortOrder: number }[]
): Promise<void> {
  const db = await getDb()
  for (const { id, sortOrder } of updates) {
    await db.execute(
      'UPDATE tasks SET sort_order = $1, updated_at = $2 WHERE id = $3',
      [sortOrder, new Date().toISOString(), id]
    )
  }
}

async function syncTaskTags(db: Awaited<ReturnType<typeof getDb>>, taskId: string, tagNames: string[]): Promise<void> {
  await db.execute('DELETE FROM task_tags WHERE task_id = $1', [taskId])

  for (const name of tagNames) {
    let existing = await db.select<{ id: string }[]>(
      'SELECT id FROM tags WHERE name = $1',
      [name]
    )
    let tagId: string
    if (existing.length === 0) {
      tagId = crypto.randomUUID()
      await db.execute(
        'INSERT INTO tags (id, name) VALUES ($1, $2)',
        [tagId, name]
      )
    } else {
      tagId = existing[0].id
    }
    await db.execute(
      'INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2)',
      [taskId, tagId]
    )
  }
}
