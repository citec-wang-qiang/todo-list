import { Input, Select, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useUIStore, type SortField } from '../stores/uiStore'

export default function TaskToolbar() {
  const { t } = useTranslation()
  const searchQuery = useUIStore((s) => s.searchQuery)
  const setSearchQuery = useUIStore((s) => s.setSearchQuery)
  const sortField = useUIStore((s) => s.sortField)
  const setSortField = useUIStore((s) => s.setSortField)
  const sortOrder = useUIStore((s) => s.sortOrder)
  const setSortOrder = useUIStore((s) => s.setSortOrder)

  return (
    <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Input
          placeholder={t('task.search')}
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />
        <Space>
          <Select<SortField>
            value={sortField}
            onChange={(value) => setSortField(value)}
            style={{ width: 130 }}
            options={[
              { value: 'priority', label: t('sort.priority') },
              { value: 'dueDate', label: t('sort.dueDate') },
              { value: 'createdAt', label: t('sort.createdAt') },
              { value: 'title', label: t('sort.title') }
            ]}
          />
          <Select
            value={sortOrder}
            onChange={(value) => setSortOrder(value)}
            style={{ width: 70 }}
            options={[
              { value: 'desc', label: '↓' },
              { value: 'asc', label: '↑' }
            ]}
          />
        </Space>
      </Space>
    </div>
  )
}
