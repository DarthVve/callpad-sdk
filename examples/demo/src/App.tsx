import './App.css'
import { Header } from './components/Header'
import { CallDemo } from './components/CallDemo'
import { ParticipantsPanel } from './components/ParticipantsPanel'
import { ControlsPanel } from './components/ControlsPanel'

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <div className="demo-container">
          <CallDemo />
          <div className="panels">
            <ParticipantsPanel />
            <ControlsPanel />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App