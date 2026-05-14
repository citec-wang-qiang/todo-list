import { Card, Empty, Typography, Flex } from 'antd'
import { useTranslation } from 'react-i18next'
import { useTaskStore, type Task, type TaskStatus } from '../stores/taskStore'
import { useUIStore } from '../stores/uiStore'
import { filterTasks } from '../utils/filter'
import HighlightText from './HighlightText'

const columns: { status: TaskStatus; titleKey: string; color: string }[] = [
  { status: 'todo', titleKey: 'task.status.todo', color: '#1677ff' },
  { status: 'in_progress', titleKey: 'task.status.inProgress', color: '#fa8c16' },
  { status: 'done', titleKey: 'task.status.done', color: '#52c41a' }
]

function KanbanColumn({ titleKey, color, tasks }: {
  status: TaskStatus
  titleKey: string
  color: string
  tasks: Task[]
}) {
  const { t } = useTranslation()
  const searchQuery = useUIStore((s) => s.searchQuery)

  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{ padding: '8px 0', borderBottom: `2px solid ${color}`, marginBottom: 8 }}>
        <Typography.Text strong>{t(titleKey)}</Typography.Text>
        <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
          {tasks.length}
        </Typography.Text>
      </div>
      <div style={{ minHeight: 200 }}>
        {tasks.map((task) => (
          <Card key={task.id} size="small" style={{ marginBottom: 8 }}>
            <HighlightText
              text={task.title}
              query={searchQuery}
              delete={task.status === 'done'}
            />
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function TaskKanban() {
  const { t } = useTranslation()
  const tasks = useTaskStore((s) => s.tasks)
  const searchQuery = useUIStore((s) => s.searchQuery)
  const filters = useUIStore((s) => s.filters)
  const selectedListId = useUIStore((s) => s.selectedListId)

  const filtered = filterTasks(tasks, searchQuery, filters, selectedListId)

  if (filtered.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Empty description={t('task.empty')} />
      </div>
    )
  }

  return (
    <Flex gap={16} style={{ padding: '8px 0', overflow: 'auto' }}>
      {columns.map((col) => (
        <KanbanColumn
          key={col.status}
          status={col.status}
          titleKey={col.titleKey}
          color={col.color}
          tasks={filtered.filter((t) => t.status === col.status)}
        />
      ))}
    </Flex>
  )
}
