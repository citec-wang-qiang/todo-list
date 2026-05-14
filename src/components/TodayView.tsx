import { Checkbox, Empty } from 'antd'
import { HolderOutlined } from '@ant-design/icons'
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
import { useTaskStore, type Task } from '../stores/taskStore'
import { useUIStore } from '../stores/uiStore'
import { filterTasks } from '../utils/filter'
import HighlightText from './HighlightText'

function SortableTodayItem({ task }: { task: Task }) {
  const searchQuery = useUIStore((s) => s.searchQuery)
  const selectedTaskId = useUIStore((s) => s.selectedTaskId)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)
  const toggleComplete = useTaskStore((s) => s.toggleComplete)

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
    <div ref={setNodeRef} style={style} onClick={() => setSelectedTaskId(task.id)}>
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
        <HighlightText
          text={task.title}
          query={searchQuery}
          delete={task.status === 'done'}
        />
      </div>
    </div>
  )
}

export default function TodayView() {
  const { t } = useTranslation()
  const tasks = useTaskStore((s) => s.tasks)
  const reorderTasks = useTaskStore((s) => s.reorderTasks)
  const searchQuery = useUIStore((s) => s.searchQuery)
  const filters = useUIStore((s) => s.filters)
  const selectedListId = useUIStore((s) => s.selectedListId)

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayTasks = tasks.filter((t) => t.dueDate?.startsWith(todayStr))
  const filtered = filterTasks(todayTasks, searchQuery, filters, selectedListId)
  const sorted = [...filtered].sort((a, b) => a.sortOrder - b.sortOrder)

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
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sorted.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div style={{ padding: '4px 0' }}>
          {sorted.map((task) => (
            <SortableTodayItem key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
