import { Segmented } from 'antd'
import { useTranslation } from 'react-i18next'
import { useUIStore, type ViewType } from '../stores/uiStore'

export default function ViewTabs() {
  const { t } = useTranslation()
  const currentView = useUIStore((s) => s.currentView)
  const setCurrentView = useUIStore((s) => s.setCurrentView)

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <Segmented<ViewType>
        value={currentView}
        onChange={(value) => setCurrentView(value)}
        options={[
          { value: 'list', label: t('view.list') },
          { value: 'kanban', label: t('view.kanban') },
          { value: 'today', label: t('view.today') }
        ]}
      />
    </div>
  )
}
