import { List, Checkbox, Empty, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { useTaskStore } from '../stores/taskStore'

export default function TodayView() {
  const { t } = useTranslation()
  const tasks = useTaskStore((s) => s.tasks)
  const toggleComplete = useTaskStore((s) => s.toggleComplete)

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayTasks = tasks.filter((t) => t.dueDate?.startsWith(todayStr))

  if (todayTasks.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Empty description={t('task.empty')} />
      </div>
    )
  }

  return (
    <List
      dataSource={todayTasks}
      renderItem={(task) => (
        <List.Item>
          <List.Item.Meta
            avatar={
              <Checkbox
                checked={task.status === 'done'}
                onChange={() => toggleComplete(task.id)}
              />
            }
            title={
              <Typography.Text delete={task.status === 'done'}>
                {task.title}
              </Typography.Text>
            }
          />
        </List.Item>
      )}
      style={{ marginTop: 8 }}
    />
  )
}
