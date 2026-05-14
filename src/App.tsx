import { useEffect } from 'react'
import { ConfigProvider, theme, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useUIStore } from './stores/uiStore'
import { useTaskStore } from './stores/taskStore'
import { useListStore } from './stores/listStore'
import { useTagStore } from './stores/tagStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useReminder } from './hooks/useReminder'
import AppLayout from './components/AppLayout'
import ShortcutHelpModal from './components/ShortcutHelpModal'

export default function App() {
  const themeMode = useUIStore((s) => s.themeMode)

  useReminder()

  useEffect(() => {
    useTaskStore.getState().init()
    useListStore.getState().init()
    useTagStore.getState().init()
  }, [])

  useKeyboardShortcuts()

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff'
        }
      }}
    >
      <AntApp>
        <AppLayout />
        <ShortcutHelpModal />
      </AntApp>
    </ConfigProvider>
  )
}
