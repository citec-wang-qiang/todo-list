import { useState, useRef, useEffect } from 'react'
import { Input } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTaskStore } from '../stores/taskStore'
import { useUIStore } from '../stores/uiStore'
import { focusHandlers } from '../hooks/useKeyboardShortcuts'
import type { InputRef } from 'antd'

export default function QuickAddBar() {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const addTask = useTaskStore((s) => s.addTask)
  const selectedListId = useUIStore((s) => s.selectedListId)
  const inputRef = useRef<InputRef>(null)

  useEffect(() => {
    focusHandlers.add = () => {
      inputRef.current?.focus()
    }
    return () => {
      delete focusHandlers.add
    }
  }, [])

  const handleAdd = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    const now = new Date().toISOString()
    await addTask({
      id: crypto.randomUUID(),
      title: trimmed,
      description: '',
      priority: 'none',
      status: 'todo',
      dueDate: null,
      listId: selectedListId,
      tags: [],
      isStarred: false,
      parentId: null,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    })
    setTitle('')
  }

  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onPressEnter={handleAdd}
        placeholder={t('task.addPlaceholder')}
        prefix={<PlusOutlined style={{ color: '#999' }} />}
      />
    </div>
  )
}
