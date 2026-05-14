import { Layout } from 'antd'
import { useUIStore } from '../stores/uiStore'
import AppSider from './AppSider'
import MainContent from './MainContent'

const { Sider, Content } = Layout

export default function AppLayout() {
  const siderCollapsed = useUIStore((s) => s.siderCollapsed)
  const toggleSider = useUIStore((s) => s.toggleSider)

  return (
    <Layout style={{ height: '100%' }}>
      <Sider
        collapsible
        collapsed={siderCollapsed}
        onCollapse={toggleSider}
        width={240}
        style={{
          overflow: 'auto',
          borderRight: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <AppSider collapsed={siderCollapsed} />
      </Sider>
      <Content style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <MainContent />
      </Content>
    </Layout>
  )
}
