import { Card, Empty, Typography, Flex } from 'antd'
import { HolderOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo } from 'react'
import { useTaskStore, type Task, type TaskStatus } from '../stores/taskStore'
import { useUIStore } from '../stores/uiStore'
import { filterTasks } from '../utils/filter'
import HighlightText from './HighlightText'

const columns: { status: TaskStatus; titleKey: string; color: string }[] = [
  { status: 'todo', titleKey: 'task.status.todo', color: '#1677ff' },
  { status: 'in_progress', titleKey: 'task.status.inProgress', color: '#fa8c16' },
  { status: 'done', titleKey: 'task.status.done', color: '#52c41a' }
]

function SortableKanbanItem({ task }: { task: Task }) {
  const searchQuery = useUIStore((s) => s.searchQuery)
  const selectedTaskId = useUIStore((s) => s.selectedTaskId)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } })

  const isSelected = selectedTaskId === task.id

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} onClick={() => setSelectedTaskId(task.id)}>
      <Card size="small" style={{ marginBottom: 8, borderColor: isSelected ? '#1677ff' : undefined }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            {...attributes}
            {...listeners}
            style={{ cursor: 'grab', color: '#999', flexShrink: 0 }}
          >
            <HolderOutlined />
          </span>
          <HighlightText
            text={task.title}
            query={searchQuery}
            delete={task.status === 'done'}
          />
        </div>
      </Card>
    </div>
  )
}

function DroppableColumn({ status, titleKey, color, tasks }: {
  status: TaskStatus
  titleKey: string
  color: string
  tasks: Task[]
}) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: `column:${status}`, data: { status } })

  const style: React.CSSProperties = {
    flex: 1,
    minWidth: 200,
    background: isOver ? 'rgba(0,0,0,0.02)' : undefined,
    borderRadius: 8,
    padding: '8px',
    transition: 'background 0.2s',
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ padding: '8px 0', borderBottom: `2px solid ${color}`, marginBottom: 8 }}>
        <Typography.Text strong>{t(titleKey)}</Typography.Text>
        <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
          {tasks.length}
        </Typography.Text>
      </div>
      <div style={{ minHeight: 200 }}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableKanbanItem key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export default function TaskKanban() {
  const { t } = useTranslation()
  const tasks = useTaskStore((s) => s.tasks)
  const moveTask = useTaskStore((s) => s.moveTask)
  const reorderTasks = useTaskStore((s) => s.reorderTasks)
  const searchQuery = useUIStore((s) => s.searchQuery)
  const filters = useUIStore((s) => s.filters)
  const selectedListId = useUIStore((s) => s.selectedListId)

  const filtered = filterTasks(tasks, searchQuery, filters, selectedListId)

  const columnTasks = useMemo(() => {
    const result: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    }
    for (const t of filtered) {
      result[t.status]?.push(t)
    }
    for (const status of Object.keys(result) as TaskStatus[]) {
      result[status].sort((a, b) => a.sortOrder - b.sortOrder)
    }
    return result
  }, [filtered])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const findColumnByTaskId = (taskId: string): TaskStatus | null => {
    const task = tasks.find((t) => t.id === taskId)
    return task ? task.status : null
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeIdStr = active.id as string
    const overId = over.id as string

    const activeCol = findColumnByTaskId(activeIdStr)
    let overCol: TaskStatus
    let overTaskId: string | null = null

    if (overId.startsWith('column:')) {
      overCol = overId.replace('column:', '') as TaskStatus
    } else {
      overCol = findColumnByTaskId(overId)!
      overTaskId = overId
    }

    if (!activeCol || !overCol) return

    if (activeCol !== overCol) {
      await moveTask(activeIdStr, overCol, overTaskId)
    } else if (activeIdStr !== overId) {
      // Reorder within same column
      const sameColTasks = columnTasks[activeCol].filter((t) => t.id !== activeIdStr)
      const overIdx = sameColTasks.findIndex((t) => t.id === overId)
      if (overIdx === -1) {
        sameColTasks.push(tasks.find((t) => t.id === activeIdStr)!)
      } else {
        sameColTasks.splice(overIdx, 0, tasks.find((t) => t.id === activeIdStr)!)
      }
      await reorderTasks(sameColTasks.map((t) => t.id))
    }
  }

  if (filtered.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Empty description={t('task.empty')} />
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <Flex gap={16} style={{ padding: '8px 0', overflow: 'auto' }}>
        {columns.map((col) => (
          <DroppableColumn
            key={col.status}
            status={col.status}
            titleKey={col.titleKey}
            color={col.color}
            tasks={columnTasks[col.status]}
          />
        ))}
      </Flex>
    </DndContext>
  )
}
