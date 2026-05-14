import { List, Checkbox, Tag, Empty, Space, Typography } from 'antd'
import { StarOutlined, StarFilled } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTaskStore, type Priority, type Task } from '../stores/taskStore'
import { useUIStore } from '../stores/uiStore'
import { filterTasks } from '../utils/filter'
import HighlightText from './HighlightText'

const priorityColor: Record<Priority, string> = {
  high: 'red',
  medium: 'orange',
  low: 'blue',
  none: 'default'
}

const priorityLabelKey: Record<Priority, string> = {
  high: 'task.priority.high',
  medium: 'task.priority.medium',
  low: 'task.priority.low',
  none: 'task.priority.none'
}

function TaskItem({ task }: { task: Task }) {
  const { t } = useTranslation()
  const searchQuery = useUIStore((s) => s.searchQuery)
  const toggleComplete = useTaskStore((s) => s.toggleComplete)
  const toggleStar = useTaskStore((s) => s.toggleStar)

  return (
    <List.Item
      actions={[
        <span key="star" onClick={() => toggleStar(task.id)} style={{ cursor: 'pointer' }}>
          {task.isStarred ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
        </span>
      ]}
    >
      <List.Item.Meta
        avatar={
          <Checkbox
            checked={task.status === 'done'}
            onChange={() => toggleComplete(task.id)}
          />
        }
        title={
          <Space>
            <HighlightText
              text={task.title}
              query={searchQuery}
              delete={task.status === 'done'}
            />
            {task.priority !== 'none' && (
              <Tag color={priorityColor[task.priority]}>
                {t(priorityLabelKey[task.priority])}
              </Tag>
            )}
          </Space>
        }
        description={
          <>
            {task.description && searchQuery.trim() && (
              <HighlightText
                text={task.description}
                query={searchQuery}
              />
            )}
            {task.dueDate && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {task.description ? ' · ' : ''}
                {new Date(task.dueDate).toLocaleDateString()}
              </Typography.Text>
            )}
          </>
        }
      />
    </List.Item>
  )
}

export default function TaskList() {
  const { t } = useTranslation()
  const tasks = useTaskStore((s) => s.tasks)
  const searchQuery = useUIStore((s) => s.searchQuery)
  const filters = useUIStore((s) => s.filters)
  const selectedListId = useUIStore((s) => s.selectedListId)
  const sortField = useUIStore((s) => s.sortField)
  const sortOrder = useUIStore((s) => s.sortOrder)

  const filtered = filterTasks(tasks, searchQuery, filters, selectedListId)

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortOrder === 'asc' ? 1 : -1
    switch (sortField) {
      case 'priority': {
        const order = { high: 3, medium: 2, low: 1, none: 0 }
        return (order[b.priority] - order[a.priority]) * dir
      }
      case 'dueDate':
        return ((a.dueDate || '') > (b.dueDate || '') ? 1 : -1) * dir
      case 'title':
        return a.title.localeCompare(b.title) * dir
      case 'createdAt':
      default:
        return ((a.createdAt || '') > (b.createdAt || '') ? 1 : -1) * dir
    }
  })

  if (sorted.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Empty description={t('task.empty')} />
      </div>
    )
  }

  return (
    <List
      dataSource={sorted}
      renderItem={(task) => <TaskItem task={task} />}
      style={{ marginTop: 8 }}
    />
  )
}
