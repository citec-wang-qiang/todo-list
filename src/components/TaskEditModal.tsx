import { useState, useEffect } from 'react'
import { Modal, Input, Select, Form } from 'antd'
import { useTranslation } from 'react-i18next'
import { useTaskStore, type Task } from '../stores/taskStore'
import { useTagStore } from '../stores/tagStore'

interface TaskEditModalProps {
  task: Task | null
  open: boolean
  onClose: () => void
}

export default function TaskEditModal({ task, open, onClose }: TaskEditModalProps) {
  const { t } = useTranslation()
  const updateTask = useTaskStore((s) => s.updateTask)
  const allTags = useTagStore((s) => s.tags)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setTags([...task.tags])
    }
  }, [task])

  const handleOk = async () => {
    if (!task) return
    await updateTask(task.id, { title: title.trim(), description, tags })
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
      okText="OK"
      cancelText="Cancel"
      width={480}
    >
      <Form layout="vertical">
        <Form.Item label={t('task.title')}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Form.Item>
        <Form.Item label={t('task.description')}>
          <Input.TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
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
      </Form>
    </Modal>
  )
}
