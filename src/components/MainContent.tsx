import ViewTabs from './ViewTabs'
import TaskToolbar from './TaskToolbar'
import QuickAddBar from './QuickAddBar'
import TaskList from './TaskList'
import TaskKanban from './TaskKanban'
import TodayView from './TodayView'
import { useUIStore } from '../stores/uiStore'

export default function MainContent() {
  const currentView = useUIStore((s) => s.currentView)

  const renderView = () => {
    switch (currentView) {
      case 'kanban':
        return <TaskKanban />
      case 'today':
        return <TodayView />
      default:
        return <TaskList />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ViewTabs />
      <TaskToolbar />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
        {renderView()}
      </div>
      <QuickAddBar />
    </div>
  )
}
