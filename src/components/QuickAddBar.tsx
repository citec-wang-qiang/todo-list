import { Input } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

export default function QuickAddBar() {
  const { t } = useTranslation()

  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <Input
        placeholder={t('task.addPlaceholder')}
        prefix={<PlusOutlined style={{ color: '#999' }} />}
      />
    </div>
  )
}
