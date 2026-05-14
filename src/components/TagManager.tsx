import { useState } from 'react'
import { Modal, List, Button, Input, Space, Tag, Popconfirm, Empty } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTagStore } from '../stores/tagStore'
import { useTaskStore } from '../stores/taskStore'

const presetColors = [
  '#1677ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1',
  '#13c2c2', '#eb2f96', '#faad14', '#2f54eb', '#a0d911',
  '#fa541c', '#f759ab', '#9254de', '#597ef7', '#389e0d',
]

interface TagManagerProps {
  open: boolean
  onClose: () => void
}

export default function TagManager({ open, onClose }: TagManagerProps) {
  const { t } = useTranslation()
  const tags = useTagStore((s) => s.tags)
  const addTag = useTagStore((s) => s.addTag)
  const updateTag = useTagStore((s) => s.updateTag)
  const removeTag = useTagStore((s) => s.removeTag)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#1677ff')
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#1677ff')

  const startAdd = () => {
    setIsAdding(true)
    setNewName('')
    setNewColor('#1677ff')
  }

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    await addTag({
      id: crypto.randomUUID(),
      name,
      color: newColor,
      createdAt: new Date().toISOString(),
    })
    setIsAdding(false)
  }

  const startEdit = (tag: { id: string; name: string; color: string }) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  const handleEdit = async () => {
    const name = editName.trim()
    if (!name || !editingId) return
    const oldTag = tags.find((t) => t.id === editingId)
    await updateTag(editingId, { name, color: editColor })
    if (oldTag && oldTag.name !== name) {
      const taskStore = useTaskStore.getState()
      for (const task of taskStore.tasks) {
        if (task.tags.includes(oldTag.name)) {
          const newTags = task.tags.map((tn) => (tn === oldTag.name ? name : tn))
          taskStore.updateTask(task.id, { tags: newTags })
        }
      }
    }
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    const tag = tags.find((t) => t.id === id)
    await removeTag(id)
    if (tag) {
      const taskStore = useTaskStore.getState()
      for (const task of taskStore.tasks) {
        if (task.tags.includes(tag.name)) {
          const newTags = task.tags.filter((tn) => tn !== tag.name)
          taskStore.updateTask(task.id, { tags: newTags })
        }
      }
    }
  }

  const ColorPicker = ({
    value,
    onChange,
  }: {
    value: string
    onChange: (c: string) => void
  }) => (
    <Space wrap size={4} style={{ marginTop: 8 }}>
      {presetColors.map((color) => (
        <div
          key={color}
          onClick={() => onChange(color)}
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            backgroundColor: color,
            cursor: 'pointer',
            border: value === color ? '2px solid #000' : '2px solid transparent',
            boxSizing: 'border-box',
          }}
        />
      ))}
    </Space>
  )

  return (
    <Modal
      title={t('tag.manage')}
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
    >
      <List
        dataSource={tags}
        locale={{ emptyText: <Empty description={t('tag.empty')} /> }}
        renderItem={(tag) =>
          editingId === tag.id ? (
            <List.Item>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onPressEnter={handleEdit}
                  placeholder={t('tag.namePlaceholder')}
                />
                <ColorPicker value={editColor} onChange={setEditColor} />
                <Space>
                  <Button size="small" type="primary" onClick={handleEdit}>
                    OK
                  </Button>
                  <Button size="small" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </Space>
              </Space>
            </List.Item>
          ) : (
            <List.Item
              actions={[
                <Button
                  key="edit"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => startEdit(tag)}
                />,
                <Popconfirm
                  key="delete"
                  title={t('tag.deleteConfirm', { name: tag.name })}
                  onConfirm={() => handleDelete(tag.id)}
                  okText="OK"
                  cancelText="Cancel"
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>,
              ]}
            >
              <Tag color={tag.color} style={{ fontSize: 14, padding: '2px 8px' }}>
                {tag.name}
              </Tag>
            </List.Item>
          )
        }
      />

      {isAdding ? (
        <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onPressEnter={handleAdd}
            placeholder={t('tag.namePlaceholder')}
          />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <Space>
            <Button size="small" type="primary" onClick={handleAdd}>
              OK
            </Button>
            <Button size="small" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </Space>
        </Space>
      ) : (
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={startAdd}
          block
          style={{ marginTop: 16 }}
        >
          {t('tag.new')}
        </Button>
      )}
    </Modal>
  )
}
