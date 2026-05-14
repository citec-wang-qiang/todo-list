import { Modal, Table, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '../stores/uiStore'

interface ShortcutRow {
  key: string
  shortcut: string
  description: string
}

export default function ShortcutHelpModal() {
  const { t } = useTranslation()
  const open = useUIStore((s) => s.shortcutHelpOpen)
  const setShortcutHelpOpen = useUIStore((s) => s.setShortcutHelpOpen)

  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
  const mod = isMac ? 'Cmd' : 'Ctrl'

  const shortcuts: ShortcutRow[] = [
    { key: '1', shortcut: `${mod}+N`, description: t('shortcut.newTask') },
    { key: '2', shortcut: `${mod}+Enter`, description: t('shortcut.save') },
    { key: '3', shortcut: `${mod}+Z`, description: t('shortcut.undo') },
    { key: '4', shortcut: `${mod}+Shift+Z`, description: t('shortcut.redo') },
    { key: '5', shortcut: 'Delete', description: t('shortcut.delete') },
    { key: '6', shortcut: `${mod}+F`, description: t('shortcut.search') },
    { key: '7', shortcut: `${mod}+1`, description: t('shortcut.viewList') },
    { key: '8', shortcut: `${mod}+2`, description: t('shortcut.viewKanban') },
    { key: '9', shortcut: `${mod}+3`, description: t('shortcut.viewToday') },
    { key: '10', shortcut: '?', description: t('shortcut.help') },
  ]

  const columns = [
    {
      title: t('shortcut.key'),
      dataIndex: 'shortcut',
      key: 'shortcut',
      width: 180,
      render: (text: string) => (
        <Typography.Text code style={{ fontSize: 13 }}>{text}</Typography.Text>
      ),
    },
    {
      title: t('shortcut.description'),
      dataIndex: 'description',
      key: 'description',
    },
  ]

  return (
    <Modal
      title={t('shortcut.title')}
      open={open}
      onCancel={() => setShortcutHelpOpen(false)}
      footer={null}
      width={480}
    >
      <Table
        dataSource={shortcuts}
        columns={columns}
        pagination={false}
        size="small"
        showHeader={false}
      />
    </Modal>
  )
}
