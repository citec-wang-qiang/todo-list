import { useState, useEffect } from 'react'
import { Modal, Input, Select, Form, DatePicker, App } from 'antd'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { useTaskStore, type Priority, type TaskStatus, type Task } from '../stores/taskStore'
import { useTagStore } from '../stores/tagStore'
import { scheduleReminder, cancelReminder } from '../hooks/useReminder'

const REMINDER_OPTIONS = [
  { value: -1, labelKey: 'task.reminder.none' },
  { value: 0, labelKey: 'task.reminder.atDue' },
  { value: 5, labelKey: 'task.reminder.5min' },
  { value: 15, labelKey: 'task.reminder.15min' },
  { value: 60, labelKey: 'task.reminder.1hour' },
  { value: 1440, labelKey: 'task.reminder.1day' },
]

function resolveReminderBefore(reminderAt: string | null, dueDate: string | null): number {
  if (!reminderAt || !dueDate) return -1
  const diffMs = new Date(dueDate).getTime() - new Date(reminderAt).getTime()
  const diffMin = Math.round(diffMs / 60000)
  const match = REMINDER_OPTIONS.find((o) => o.value === diffMin)
  return match ? match.value : -1
}

function calcReminderAt(dueDate: string | null, reminderBefore: number): string | null {
  if (!dueDate || reminderBefore < 0) return null
  const due = new Date(dueDate).getTime()
  return new Date(due - reminderBefore * 60000).toISOString()
}

interface TaskEditModalProps {
  task: Task | null
  open: boolean
  onClose: () => void
}

export default function TaskEditModal({ task, open, onClose }: TaskEditModalProps) {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const updateTask = useTaskStore((s) => s.updateTask)
  const allTags = useTagStore((s) => s.tags)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [priority, setPriority] = useState<Priority>('none')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [reminderBefore, setReminderBefore] = useState(-1)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setTags([...task.tags])
      setPriority(task.priority)
      setStatus(task.status)
      setDueDate(task.dueDate)
      setReminderBefore(resolveReminderBefore(task.reminderAt, task.dueDate))
    }
  }, [task])

  const handleOk = async () => {
    if (!task) return
    const reminderAt = calcReminderAt(dueDate, reminderBefore)

    await updateTask(task.id, {
      title: title.trim(),
      description,
      tags,
      priority,
      status,
      dueDate,
      reminderAt,
    })

    if (reminderAt) {
      scheduleReminder(task.id, title, reminderAt)
    } else {
      cancelReminder(task.id)
    }

    message.success(t('task.saved'))
    onClose()
  }

  const tagOptions = allTags.map((tag) => ({
    value: tag.name,
    label: tag.name,
  }))

  return (
    <Modal
      title={title || t('task.edit')}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText={t('task.save')}
      cancelText={t('task.cancel')}
      width={480}
    >
      <Form layout="vertical">
        <Form.Item label={t('task.title')}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Form.Item>
        <Form.Item label={t('task.description')}>
          <Input.TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </Form.Item>
        <Form.Item label={t('filter.tags')}>
          <Select
            mode="multiple"
            value={tags}
            onChange={setTags}
            placeholder={t('filter.tags')}
            style={{ width: '100%' }}
            options={tagOptions}
          />
        </Form.Item>
        <Form.Item label={t('filter.priority')}>
          <Select<Priority>
            value={priority}
            onChange={setPriority}
            style={{ width: '100%' }}
            options={[
              { value: 'none', label: t('task.priority.none') },
              { value: 'low', label: t('task.priority.low') },
              { value: 'medium', label: t('task.priority.medium') },
              { value: 'high', label: t('task.priority.high') },
            ]}
          />
        </Form.Item>
        <Form.Item label={t('filter.status')}>
          <Select<TaskStatus>
            value={status}
            onChange={setStatus}
            style={{ width: '100%' }}
            options={[
              { value: 'todo', label: t('task.status.todo') },
              { value: 'in_progress', label: t('task.status.inProgress') },
              { value: 'done', label: t('task.status.done') },
            ]}
          />
        </Form.Item>
        <Form.Item label={t('task.dueDate')}>
          <DatePicker
            showTime
            value={dueDate ? dayjs(dueDate) : null}
            onChange={(d) => setDueDate(d ? d.toISOString() : null)}
            placeholder={t('task.dueDate')}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label={t('task.reminder.label')}>
          <Select
            value={reminderBefore}
            onChange={setReminderBefore}
            style={{ width: '100%' }}
            options={REMINDER_OPTIONS.map((o) => ({
              value: o.value,
              label: t(o.labelKey),
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
