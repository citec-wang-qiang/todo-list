import { useState } from 'react'
import {
  Modal,
  Input,
  Select,
  DatePicker,
  Progress,
  Button,
  Typography,
  Space,
  Divider,
  Checkbox,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { useTaskStore } from '../stores/taskStore'
import { useListStore } from '../stores/listStore'
import SubTaskList from './SubTaskList'

interface TaskDetailProps {
  taskId: string | null
  onClose: () => void
}

export default function TaskDetail({ taskId, onClose }: TaskDetailProps) {
  const { t } = useTranslation()
  const tasks = useTaskStore((s) => s.tasks)
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const toggleComplete = useTaskStore((s) => s.toggleComplete)
  const toggleCompleteWithSubtasks = useTaskStore((s) => s.toggleCompleteWithSubtasks)
  const addSubtask = useTaskStore((s) => s.addSubtask)
  const getSubtaskProgress = useTaskStore((s) => s.getSubtaskProgress)
  const MAX_LEVEL = useTaskStore((s) => s.MAX_NESTING_LEVEL)
  const lists = useListStore((s) => s.lists)

  const task = tasks.find((t) => t.id === taskId)

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [autoComplete, setAutoComplete] = useState(true)

  if (!task) {
    return (
      <Modal open={taskId !== null} onCancel={onClose} footer={null} title={t('task.empty')}>
        <Typography.Text type="secondary">{t('task.empty')}</Typography.Text>
      </Modal>
    )
  }

  const progress = getSubtaskProgress(task.id)

  const handleToggleComplete = async () => {
    if (autoComplete) {
      await toggleCompleteWithSubtasks(task.id)
    } else {
      await toggleComplete(task.id)
    }
  }

  const handleAddSubtask = async () => {
    const trimmed = newSubtaskTitle.trim()
    if (!trimmed) return
    await addSubtask(task.id, trimmed)
    setNewSubtaskTitle('')
  }

  const handleDeleteTask = async () => {
    await deleteTask(task.id)
    onClose()
  }

  const handleUpdateField = (field: string, value: unknown) => {
    updateTask(task.id, { [field]: value })
  }

  const nestingLevel = (() => {
    let level = 0
    let currentId: string | null = task.parentId
    while (currentId) {
      level++
      const parent = tasks.find((t) => t.id === currentId)
      currentId = parent?.parentId ?? null
    }
    return level
  })()

  const canHaveSubtasks = nestingLevel < MAX_LEVEL

  return (
    <Modal
      open={taskId !== null}
      onCancel={onClose}
      footer={null}
      title={
        <Space>
          <Checkbox
            checked={task.status === 'done'}
            onChange={handleToggleComplete}
          />
          <Typography.Text
            strong
            delete={task.status === 'done'}
            style={{ fontSize: 16 }}
          >
            {task.title}
          </Typography.Text>
        </Space>
      }
      width={560}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input.TextArea
          value={task.description}
          onChange={(e) => handleUpdateField('description', e.target.value)}
          placeholder="添加描述..."
          autoSize={{ minRows: 1, maxRows: 4 }}
        />

        <Space wrap>
          <Select
            value={task.priority}
            onChange={(v) => handleUpdateField('priority', v)}
            style={{ width: 100 }}
            options={[
              { value: 'none', label: t('task.priority.none') },
              { value: 'low', label: t('task.priority.low') },
              { value: 'medium', label: t('task.priority.medium') },
              { value: 'high', label: t('task.priority.high') },
            ]}
          />
          <Select
            value={task.status}
            onChange={(v) => handleUpdateField('status', v)}
            style={{ width: 110 }}
            options={[
              { value: 'todo', label: t('task.status.todo') },
              { value: 'in_progress', label: t('task.status.inProgress') },
              { value: 'done', label: t('task.status.done') },
            ]}
          />
          <DatePicker
            value={task.dueDate ? dayjs(task.dueDate) : null}
            onChange={(d) => handleUpdateField('dueDate', d?.toISOString() ?? null)}
            placeholder="截止日期"
          />
          <Select
            value={task.listId ?? undefined}
            onChange={(v) => handleUpdateField('listId', v ?? null)}
            style={{ width: 110 }}
            allowClear
            placeholder={t('filter.list')}
            options={lists.map((l) => ({ value: l.id, label: l.name }))}
          />
        </Space>

        <Divider style={{ margin: '4px 0' }} />

        {/* Subtask section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Typography.Text strong>{t('subtask.title')}</Typography.Text>
            {progress.total > 0 && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t('subtask.progress', { done: progress.done, total: progress.total })}
              </Typography.Text>
            )}
          </div>

          {progress.total > 0 && (
            <Progress
              percent={Math.round((progress.done / progress.total) * 100)}
              size="small"
              style={{ marginBottom: 8 }}
            />
          )}

          <SubTaskList
            parentId={task.id}
            onToggle={(id) => toggleComplete(id)}
            onDelete={(id) => deleteTask(id)}
          />

          {canHaveSubtasks && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Input
                size="small"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onPressEnter={handleAddSubtask}
                placeholder={t('subtask.add')}
                prefix={<PlusOutlined style={{ color: '#999' }} />}
              />
            </div>
          )}

          {!canHaveSubtasks && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t('subtask.maxLevel')}
            </Typography.Text>
          )}
        </div>

        <Divider style={{ margin: '4px 0' }} />

        <Space>
          <Checkbox
            checked={autoComplete}
            onChange={(e) => setAutoComplete(e.target.checked)}
          >
            {t('subtask.autoComplete')}
          </Checkbox>
        </Space>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <Button danger onClick={handleDeleteTask}>
            删除任务
          </Button>
        </div>
      </div>
    </Modal>
  )
}
