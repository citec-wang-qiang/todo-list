import { useTranslation } from 'react-i18next'
import { Menu, Button, Avatar, Typography, Space } from 'antd'
import {
  UnorderedListOutlined,
  StarOutlined,
  CalendarOutlined,
  TagsOutlined,
  FolderOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { useUIStore } from '../stores/uiStore'
import { useListStore } from '../stores/listStore'

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
  const lists = useListStore((s) => s.lists)

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
      children: lists.map((list) => ({
        key: `list:${list.id}`,
        icon: list.icon in iconMap ? iconMap[list.icon] : <FolderOutlined />,
        label: list.name
      }))
    },
    {
      key: 'tags',
      label: collapsed ? '' : t('nav.tags'),
      type: 'group' as const,
      children: [
        { key: 'tags-manage', icon: <TagsOutlined />, label: t('nav.tags') }
      ]
    }
  ]

  const selectedKeys: string[] = []
  if (selectedListId) {
    selectedKeys.push(`list:${selectedListId}`)
  } else {
    selectedKeys.push(`view:${currentView}`)
  }

  const handleMenuClick = (info: { key: string }) => {
    const key = info.key
    if (key.startsWith('view:')) {
      const view = key.replace('view:', '') as 'list' | 'kanban' | 'today'
      setCurrentView(view)
      setSelectedListId(null)
    } else if (key.startsWith('list:')) {
      setSelectedListId(key.replace('list:', ''))
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
          <Button type="dashed" icon={<PlusOutlined />} block>
            {t('nav.newList')}
          </Button>
        </div>
      )}
    </div>
  )
}
