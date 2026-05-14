import { useState } from 'react'
import { Button, Dropdown, App } from 'antd'
import {
  ExportOutlined,
  ImportOutlined,
  DownloadOutlined,
  UploadOutlined,
  CloudServerOutlined,
  CloudUploadOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { exportJSON, exportCSV, importJSON, importCSV, createBackup, restoreBackup } from '../db/io'

export default function DataActions() {
  const { t } = useTranslation()
  const { message: antMessage } = App.useApp()
  const [loading, setLoading] = useState<string | null>(null)

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setLoading(key)
    try {
      await fn()
    } catch (err) {
      antMessage.error(String(err))
    } finally {
      setLoading(null)
    }
  }

  const menuItems = [
    {
      key: 'group-export',
      label: t('data.export'),
      type: 'group' as const,
      children: [
        {
          key: 'export-json',
          icon: <ExportOutlined />,
          label: t('data.exportJSON'),
          loading: loading === 'export-json',
          onClick: () => run('export-json', exportJSON),
        },
        {
          key: 'export-csv',
          icon: <DownloadOutlined />,
          label: t('data.exportCSV'),
          loading: loading === 'export-csv',
          onClick: () => run('export-csv', exportCSV),
        },
      ],
    },
    {
      key: 'group-import',
      label: t('data.import'),
      type: 'group' as const,
      children: [
        {
          key: 'import-json',
          icon: <ImportOutlined />,
          label: t('data.importJSON'),
          loading: loading === 'import-json',
          onClick: () => run('import-json', importJSON),
        },
        {
          key: 'import-csv',
          icon: <UploadOutlined />,
          label: t('data.importCSV'),
          loading: loading === 'import-csv',
          onClick: () => run('import-csv', importCSV),
        },
      ],
    },
    {
      key: 'group-backup',
      label: t('data.backupRestore'),
      type: 'group' as const,
      children: [
        {
          key: 'backup',
          icon: <CloudServerOutlined />,
          label: t('data.createBackup'),
          loading: loading === 'backup',
          onClick: () => run('backup', createBackup),
        },
        {
          key: 'restore',
          icon: <CloudUploadOutlined />,
          label: t('data.restoreBackup'),
          loading: loading === 'restore',
          onClick: () => run('restore', restoreBackup),
        },
      ],
    },
  ]

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="topRight">
      <Button type="text" icon={<MoreOutlined />} loading={!!loading} block>
        {t('data.title')}
      </Button>
    </Dropdown>
  )
}
