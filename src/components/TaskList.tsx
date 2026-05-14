import { useState } from 'react'
import { Checkbox, Tag, Empty, Space, Typography } from 'antd'
import { StarOutlined, StarFilled, HolderOutlined, BellOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTaskStore, type Priority, type Task } from '../stores/taskStore'
import { useUIStore } from '../stores/uiStore'
import { filterTasks } from '../utils/filter'
import HighlightText from './HighlightText'
import TaskEditModal from './TaskEditModal'

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

function SortableTaskItem({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const { t } = useTranslation()
  const searchQuery = useUIStore((s) => s.searchQuery)
  const selectedTaskId = useUIStore((s) => s.selectedTaskId)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)
  const toggleComplete = useTaskStore((s) => s.toggleComplete)
  const toggleStar = useTaskStore((s) => s.toggleStar)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const isSelected = selectedTaskId === task.id

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 0',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    background: isSelected ? 'rgba(22,119,255,0.06)' : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      id={`task-${task.id}`}
      style={style}
      onClick={() => { setSelectedTaskId(task.id); onEdit() }}
    >
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', color: '#999', padding: 4, flexShrink: 0 }}
      >
        <HolderOutlined />
      </span>
      <Checkbox
        checked={task.status === 'done'}
        onChange={() => toggleComplete(task.id)}
        style={{ flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div>
          <Space size={4}>
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
        </div>
        {(task.description || task.dueDate) && (
          <div>
            {task.description && searchQuery.trim() && (
              <HighlightText
                text={task.description}
                query={searchQuery}
              />
            )}
            {task.dueDate && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {task.description && searchQuery.trim() ? ' · ' : ''}
                {new Date(task.dueDate).toLocaleDateString()}
                {task.reminderAt && (
                  <span style={{ marginLeft: 4 }}><BellOutlined style={{ fontSize: 11 }} /></span>
                )}
              </Typography.Text>
            )}
          </div>
        )}
      </div>
      <span
        onClick={(e) => { e.stopPropagation(); toggleStar(task.id) }}
        style={{ cursor: 'pointer', flexShrink: 0, padding: 4 }}
      >
        {task.isStarred ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
      </span>
    </div>
  )
}

export default function TaskList() {
  const { t } = useTranslation()
  const tasks = useTaskStore((s) => s.tasks)
  const reorderTasks = useTaskStore((s) => s.reorderTasks)
  const searchQuery = useUIStore((s) => s.searchQuery)
  const filters = useUIStore((s) => s.filters)
  const selectedListId = useUIStore((s) => s.selectedListId)
  const sortField = useUIStore((s) => s.sortField)
  const sortOrder = useUIStore((s) => s.sortOrder)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

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
        return a.sortOrder - b.sortOrder
    }
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = sorted.findIndex((t) => t.id === active.id)
      const newIndex = sorted.findIndex((t) => t.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = [...sorted]
        const [moved] = reordered.splice(oldIndex, 1)
        reordered.splice(newIndex, 0, moved)
        reorderTasks(reordered.map((t) => t.id))
      }
    }
  }

  if (sorted.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Empty description={t('task.empty')} />
      </div>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sorted.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div style={{ padding: '4px 0' }}>
            {sorted.map((task) => (
              <SortableTaskItem key={task.id} task={task} onEdit={() => setEditingTask(task)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <TaskEditModal
        task={editingTask}
        open={editingTask !== null}
        onClose={() => setEditingTask(null)}
      />
    </>
  )
}
