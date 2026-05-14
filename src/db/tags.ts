import { getDb } from './index'
import type { Tag } from '../stores/tagStore'

interface TagRow {
  id: string
  name: string
  color: string
  created_at: string
}

function rowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
  }
}

export async function loadTags(): Promise<Tag[]> {
  const db = await getDb()
  const rows = await db.select<TagRow[]>(
    'SELECT * FROM tags ORDER BY created_at ASC'
  )
  return rows.map(rowToTag)
}

export async function insertTag(tag: Tag): Promise<void> {
  const db = await getDb()
  await db.execute(
    `INSERT INTO tags (id, name, color, created_at) VALUES ($1, $2, $3, $4)`,
    [tag.id, tag.name, tag.color, tag.createdAt]
  )
}

export async function updateTag(id: string, patch: Partial<Tag>): Promise<void> {
  const db = await getDb()
  const fields: string[] = []
  const values: string[] = []
  let idx = 1

  const fieldMap: Record<string, string> = {
    name: 'name',
    color: 'color',
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
      `UPDATE tags SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    )
  }
}

export async function deleteTag(id: string): Promise<void> {
  const db = await getDb()
  await db.execute('DELETE FROM tags WHERE id = $1', [id])
}
