import { useState } from 'react'
import { Input, Checkbox, Button, Typography, Space } from 'antd'
import { PlusOutlined, DeleteOutlined, HolderOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTaskStore, type Task } from '../stores/taskStore'

function SortableSubTask({
  task,
  level,
  onToggle,
  onDelete,
}: {
  task: Task
  level: number
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { t } = useTranslation()
  const getSubtasks = useTaskStore((s) => s.getSubtasks)
  const MAX_LEVEL = useTaskStore((s) => s.MAX_NESTING_LEVEL)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const addSubtask = useTaskStore((s) => s.addSubtask)

  const children = getSubtasks(task.id)
  const hasChildren = children.length > 0
  const canNest = level < MAX_LEVEL

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: level * 20,
  }

  const handleAddSubtask = async () => {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    await addSubtask(task.id, trimmed)
    setNewTitle('')
    setShowAdd(false)
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 0',
          gap: 4,
        }}
      >
        <span {...attributes} {...listeners} style={{ cursor: 'grab', color: '#999' }}>
          <HolderOutlined />
        </span>
        <Checkbox
          checked={task.status === 'done'}
          onChange={() => onToggle(task.id)}
        />
        <Typography.Text
          delete={task.status === 'done'}
          style={{ flex: 1, fontSize: 13 }}
        >
          {task.title}
        </Typography.Text>
        <Space size={4}>
          {canNest && (
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setShowAdd(!showAdd)}
            />
          )}
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(task.id)}
          />
        </Space>
      </div>

      {showAdd && (
        <div style={{ paddingLeft: level * 20 + 28, paddingBottom: 4 }}>
          <Input
            size="small"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onPressEnter={handleAddSubtask}
            placeholder={t('subtask.add')}
            autoFocus
            onBlur={() => {
              if (!newTitle.trim()) setShowAdd(false)
            }}
          />
        </div>
      )}

      {hasChildren && (
        <div>
          {children.map((child) => (
            <SortableSubTask
              key={child.id}
              task={child}
              level={level + 1}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SubTaskList({
  parentId,
  onToggle,
  onDelete,
}: {
  parentId: string
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const getSubtasks = useTaskStore((s) => s.getSubtasks)
  const reorderSubtasks = useTaskStore((s) => s.reorderSubtasks)
  const subtasks = getSubtasks(parentId)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = subtasks.map((s) => s.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    const reordered = [...ids]
    reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, active.id as string)
    reorderSubtasks(parentId, reordered)
  }

  if (subtasks.length === 0) return null

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={subtasks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        {subtasks.map((task) => (
          <SortableSubTask
            key={task.id}
            task={task}
            level={1}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}
