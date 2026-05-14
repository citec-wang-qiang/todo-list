import { List, Checkbox, Empty } from 'antd'
import { useTranslation } from 'react-i18next'
import { useTaskStore } from '../stores/taskStore'
import { useUIStore } from '../stores/uiStore'
import { filterTasks } from '../utils/filter'
import HighlightText from './HighlightText'

export default function TodayView() {
  const { t } = useTranslation()
  const tasks = useTaskStore((s) => s.tasks)
  const toggleComplete = useTaskStore((s) => s.toggleComplete)
  const searchQuery = useUIStore((s) => s.searchQuery)
  const filters = useUIStore((s) => s.filters)
  const selectedListId = useUIStore((s) => s.selectedListId)

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayTasks = tasks.filter((t) => t.dueDate?.startsWith(todayStr))
  const filtered = filterTasks(todayTasks, searchQuery, filters, selectedListId)

  if (filtered.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Empty description={t('task.empty')} />
      </div>
    )
  }

  return (
    <List
      dataSource={filtered}
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
              <HighlightText
                text={task.title}
                query={searchQuery}
                delete={task.status === 'done'}
              />
            }
          />
        </List.Item>
      )}
      style={{ marginTop: 8 }}
    />
  )
}
