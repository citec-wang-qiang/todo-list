import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, Button, Avatar, Typography, Space, Divider, Tag } from 'antd'
import {
  UnorderedListOutlined,
  StarOutlined,
  CalendarOutlined,
  TagsOutlined,
  FolderOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useUIStore } from '../stores/uiStore'
import { useListStore } from '../stores/listStore'
import { useTagStore } from '../stores/tagStore'
import TagManager from './TagManager'
import DataActions from './DataActions'

const iconMap: Record<string, React.ReactNode> = {
  FolderOutlined: <FolderOutlined />,
  UserOutlined: <UserOutlined />,
  ShoppingCartOutlined: <ShoppingCartOutlined />
}

interface AppSiderProps {
  collapsed: boolean
}

export default function AppSider({ collapsed }: AppSiderProps) {
  const { t } = useTranslation()
  const currentView = useUIStore((s) => s.currentView)
  const setCurrentView = useUIStore((s) => s.setCurrentView)
  const selectedListId = useUIStore((s) => s.selectedListId)
  const setSelectedListId = useUIStore((s) => s.setSelectedListId)
  const filters = useUIStore((s) => s.filters)
  const setFilter = useUIStore((s) => s.setFilter)
  const lists = useListStore((s) => s.lists)
  const tags = useTagStore((s) => s.tags)
  const [tagManagerOpen, setTagManagerOpen] = useState(false)

  const listMenuItems = lists.map((list) => ({
    key: `list:${list.id}`,
    icon: list.icon in iconMap ? iconMap[list.icon] : <FolderOutlined />,
    label: list.name
  }))

  const tagMenuItems = tags.map((tag) => ({
    key: `tag:${tag.id}`,
    icon: (
      <span style={{
        display: 'inline-block',
        width: 12,
        height: 12,
        borderRadius: 3,
        backgroundColor: tag.color,
        marginRight: 8,
      }} />
    ),
    label: tag.name,
  }))

  const menuItems = [
    {
      key: 'smart-filters',
      label: collapsed ? '' : t('nav.allTasks'),
      type: 'group' as const,
      children: [
        { key: 'view:list', icon: <UnorderedListOutlined />, label: t('nav.allTasks') },
        { key: 'view:starred', icon: <StarOutlined />, label: t('nav.starred') },
        { key: 'view:today', icon: <CalendarOutlined />, label: t('nav.today') }
      ]
    },
    {
      key: 'lists',
      label: collapsed ? '' : t('nav.allTasks'),
      type: 'group' as const,
      children: listMenuItems
    },
    {
      key: 'tags-group',
      label: collapsed ? '' : t('nav.tags'),
      type: 'group' as const,
      children: [
        ...tagMenuItems,
        {
          key: 'tags-manage',
          icon: <SettingOutlined />,
          label: collapsed ? '' : t('tag.manage')
        }
      ]
    }
  ]

  const selectedKeys: string[] = []
  if (selectedListId) {
    selectedKeys.push(`list:${selectedListId}`)
  } else if (filters.tags.length > 0) {
    const tag = tags.find((t) => t.name === filters.tags[0])
    if (tag) selectedKeys.push(`tag:${tag.id}`)
  } else {
    selectedKeys.push(`view:${currentView}`)
  }

  const handleMenuClick = (info: { key: string }) => {
    const key = info.key
    if (key.startsWith('view:')) {
      const view = key.replace('view:', '') as 'list' | 'kanban' | 'today'
      setCurrentView(view)
      setSelectedListId(null)
      setFilter('tags', [])
    } else if (key.startsWith('list:')) {
      setSelectedListId(key.replace('list:', ''))
      setFilter('tags', [])
    } else if (key.startsWith('tag:')) {
      const tagId = key.replace('tag:', '')
      const tag = tags.find((t) => t.id === tagId)
      if (tag) {
        setSelectedListId(null)
        setFilter('tags', [tag.name])
      }
    } else if (key === 'tags-manage') {
      setTagManagerOpen(true)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!collapsed && (
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Space direction="vertical" size={4}>
            <Avatar size={48} icon={<UserOutlined />} />
            <Typography.Text strong>Todo List</Typography.Text>
          </Space>
        </div>
      )}
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        onClick={handleMenuClick}
        items={menuItems}
        style={{ flex: 1, borderInlineEnd: 'none' }}
      />
      {!collapsed && (
        <div style={{ padding: '8px 16px 16px' }}>
          <DataActions />
          <Divider style={{ margin: '8px 0' }} />
          <Button type="dashed" icon={<PlusOutlined />} block>
            {t('nav.newList')}
          </Button>
        </div>
      )}
      <TagManager open={tagManagerOpen} onClose={() => setTagManagerOpen(false)} />
    </div>
  )
}
