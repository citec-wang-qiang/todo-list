import type { Task } from '../stores/taskStore'
import type { Filters } from '../stores/uiStore'

export function filterTasks(
  tasks: Task[],
  searchQuery: string,
  filters: Filters,
  selectedListId: string | null,
  options?: { excludeChildren?: boolean }
): Task[] {
  const query = searchQuery.trim().toLowerCase()
  const listId = selectedListId || (filters.listId !== 'all' ? filters.listId : null)
  const excludeChildren = options?.excludeChildren ?? true

  return tasks.filter((task) => {
    if (excludeChildren && task.parentId != null) return false
    if (listId && task.listId !== listId) return false
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false
    if (filters.status !== 'all' && task.status !== filters.status) return false
    if (filters.tags.length > 0 && !filters.tags.some((tag) => task.tags.includes(tag))) return false
    if (query) {
      const inTitle = task.title.toLowerCase().includes(query)
      const inDesc = task.description.toLowerCase().includes(query)
      if (!inTitle && !inDesc) return false
    }
    return true
  })
}

export function getMatchRanges(text: string, query: string): [number, number][] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const lower = text.toLowerCase()
  const ranges: [number, number][] = []
  let start = 0
  while ((start = lower.indexOf(q, start)) !== -1) {
    ranges.push([start, start + q.length])
    start += q.length
  }
  return ranges
}

export function highlightText(text: string, query: string): { text: string; highlight: boolean }[] {
  const ranges = getMatchRanges(text, query)
  if (ranges.length === 0) return [{ text, highlight: false }]

  const segments: { text: string; highlight: boolean }[] = []
  let lastEnd = 0
  for (const [start, end] of ranges) {
    if (start > lastEnd) {
      segments.push({ text: text.slice(lastEnd, start), highlight: false })
    }
    segments.push({ text: text.slice(start, end), highlight: true })
    lastEnd = end
  }
  if (lastEnd < text.length) {
    segments.push({ text: text.slice(lastEnd), highlight: false })
  }
  return segments
}
