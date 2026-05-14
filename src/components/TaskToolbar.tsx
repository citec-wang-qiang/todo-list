import { Input, Select, Space, Button } from 'antd'
import { SearchOutlined, ClearOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '../stores/uiStore'
import type { Priority, TaskStatus } from '../stores/taskStore'
import { useTaskStore } from '../stores/taskStore'
import { useListStore } from '../stores/listStore'

const priorityOptions: { value: Priority | 'all'; labelKey: string }[] = [
  { value: 'all', labelKey: 'filter.allPriority' },
  { value: 'high', labelKey: 'task.priority.high' },
  { value: 'medium', labelKey: 'task.priority.medium' },
  { value: 'low', labelKey: 'task.priority.low' },
  { value: 'none', labelKey: 'task.priority.none' }
]

const statusOptions: { value: TaskStatus | 'all'; labelKey: string }[] = [
  { value: 'all', labelKey: 'filter.allStatus' },
  { value: 'todo', labelKey: 'task.status.todo' },
  { value: 'in_progress', labelKey: 'task.status.inProgress' },
  { value: 'done', labelKey: 'task.status.done' }
]

const selectStyle: React.CSSProperties = { width: 120 }

export default function TaskToolbar() {
  const { t } = useTranslation()
  const searchQuery = useUIStore((s) => s.searchQuery)
  const setSearchQuery = useUIStore((s) => s.setSearchQuery)
  const sortField = useUIStore((s) => s.sortField)
  const setSortField = useUIStore((s) => s.setSortField)
  const sortOrder = useUIStore((s) => s.sortOrder)
  const setSortOrder = useUIStore((s) => s.setSortOrder)
  const filters = useUIStore((s) => s.filters)
  const setFilter = useUIStore((s) => s.setFilter)
  const clearFilters = useUIStore((s) => s.clearFilters)
  const tasks = useTaskStore((s) => s.tasks)
  const lists = useListStore((s) => s.lists)

  const allTags = [...new Set(tasks.flatMap((t) => t.tags))].sort()

  const hasFilters =
    filters.priority !== 'all' ||
    filters.status !== 'all' ||
    filters.listId !== 'all' ||
    filters.tags.length > 0 ||
    searchQuery !== ''

  return (
    <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input
            placeholder={t('task.search')}
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />
          <Space>
            <Select
              value={sortField}
              onChange={(value) => setSortField(value)}
              style={{ width: 130 }}
              options={[
                { value: 'priority', label: t('sort.priority') },
                { value: 'dueDate', label: t('sort.dueDate') },
                { value: 'createdAt', label: t('sort.createdAt') },
                { value: 'title', label: t('sort.title') }
              ]}
            />
            <Select
              value={sortOrder}
              onChange={(value) => setSortOrder(value)}
              style={{ width: 70 }}
              options={[
                { value: 'desc', label: '↓' },
                { value: 'asc', label: '↑' }
              ]}
            />
          </Space>
        </Space>
        <Space wrap>
          <Select
            value={filters.priority}
            onChange={(v) => setFilter('priority', v)}
            style={selectStyle}
            placeholder={t('filter.priority')}
            options={priorityOptions.map((opt) => ({
              value: opt.value,
              label: t(opt.labelKey)
            }))}
          />
          <Select
            value={filters.status}
            onChange={(v) => setFilter('status', v)}
            style={selectStyle}
            placeholder={t('filter.status')}
            options={statusOptions.map((opt) => ({
              value: opt.value,
              label: t(opt.labelKey)
            }))}
          />
          <Select
            value={filters.listId}
            onChange={(v) => setFilter('listId', v)}
            style={selectStyle}
            placeholder={t('filter.list')}
            allowClear
            options={[
              { value: 'all', label: t('filter.allList') },
              ...lists.map((list) => ({
                value: list.id,
                label: list.name
              }))
            ]}
          />
          {allTags.length > 0 && (
            <Select
              mode="multiple"
              value={filters.tags}
              onChange={(v) => setFilter('tags', v)}
              style={{ minWidth: 120, maxWidth: 200 }}
              placeholder={t('filter.tags')}
              maxTagCount={1}
              options={allTags.map((tag) => ({ value: tag, label: tag }))}
            />
          )}
          {hasFilters && (
            <Button
              icon={<ClearOutlined />}
              size="small"
              onClick={clearFilters}
            >
              {t('filter.clear')}
            </Button>
          )}
        </Space>
      </Space>
    </div>
  )
}
