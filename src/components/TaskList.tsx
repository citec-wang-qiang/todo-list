import { List, Checkbox, Tag, Typography, Empty, Space } from 'antd'
import { StarOutlined, StarFilled } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTaskStore, type Priority, type Task } from '../stores/taskStore'

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
            <Typography.Text
              delete={task.status === 'done'}
              style={{ fontWeight: task.status === 'done' ? 'normal' : 500 }}
            >
              {task.title}
            </Typography.Text>
            {task.priority !== 'none' && (
              <Tag color={priorityColor[task.priority]}>
                {t(priorityLabelKey[task.priority])}
              </Tag>
            )}
          </Space>
        }
        description={
          task.dueDate && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(task.dueDate).toLocaleDateString()}
            </Typography.Text>
          )
        }
      />
    </List.Item>
  )
}

export default function TaskList() {
  const { t } = useTranslation()
  const tasks = useTaskStore((s) => s.tasks)

  if (tasks.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Empty description={t('task.empty')} />
      </div>
    )
  }

  return (
    <List
      dataSource={tasks}
      renderItem={(task) => <TaskItem task={task} />}
      style={{ marginTop: 8 }}
    />
  )
}
