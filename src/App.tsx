import { useEffect } from 'react'
import { ConfigProvider, theme, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useUIStore } from './stores/uiStore'
import { useTaskStore } from './stores/taskStore'
import { useListStore } from './stores/listStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import AppLayout from './components/AppLayout'

export default function App() {
  const themeMode = useUIStore((s) => s.themeMode)

  useEffect(() => {
    useTaskStore.getState().init()
    useListStore.getState().init()
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
      </AntApp>
    </ConfigProvider>
  )
}
