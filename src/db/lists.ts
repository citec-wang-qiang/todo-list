import { getDb } from './index'
import type { TodoList } from '../stores/listStore'

interface ListRow {
  id: string
  name: string
  color: string
  icon: string
  created_at: string
}

function rowToList(row: ListRow): TodoList {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: row.created_at,
  }
}

export async function loadLists(): Promise<TodoList[]> {
  const db = await getDb()
  const rows = await db.select<ListRow[]>(
    'SELECT * FROM lists ORDER BY created_at ASC'
  )
  return rows.map(rowToList)
}

export async function insertList(list: TodoList): Promise<void> {
  const db = await getDb()
  await db.execute(
    `INSERT INTO lists (id, name, color, icon, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [list.id, list.name, list.color, list.icon, list.createdAt]
  )
}

export async function updateList(id: string, patch: Partial<TodoList>): Promise<void> {
  const db = await getDb()
  const fields: string[] = []
  const values: (string | null)[] = []
  let idx = 1

  const fieldMap: Record<string, string> = {
    name: 'name',
    color: 'color',
    icon: 'icon',
  }

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in patch) {
      fields.push(`${col} = $${idx++}`)
      values.push(patch[key as keyof typeof patch] as string)
    }
  }

  if (fields.length > 0) {
    values.push(id)
    await db.execute(
      `UPDATE lists SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    )
  }
}

export async function deleteList(id: string): Promise<void> {
  const db = await getDb()
  await db.execute('DELETE FROM lists WHERE id = $1', [id])
}

export async function seedDefaultLists(): Promise<void> {
  const db = await getDb()
  const existing = await db.select<{ cnt: number }[]>(
    'SELECT COUNT(*) AS cnt FROM lists'
  )
  if (existing[0].cnt > 0) return

  const defaults = [
    { id: 'default-work', name: '工作', color: '#1677ff', icon: 'FolderOutlined' },
    { id: 'default-personal', name: '个人', color: '#52c41a', icon: 'UserOutlined' },
    { id: 'default-shopping', name: '购物', color: '#fa8c16', icon: 'ShoppingCartOutlined' },
  ]

  const now = new Date().toISOString()
  for (const list of defaults) {
    await db.execute(
      `INSERT INTO lists (id, name, color, icon, created_at) VALUES ($1, $2, $3, $4, $5)`,
      [list.id, list.name, list.color, list.icon, now]
    )
  }
}
