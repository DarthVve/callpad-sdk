import { useState } from 'react'
import './ControlsPanel.css'

export function ControlsPanel() {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  return (
    <div className="controls-panel">
      <h3 className="panel-title">Call Controls</h3>
      
      <div className="controls-grid">
        <button 
          className={`control-btn ${isMuted ? 'active' : ''}`}
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          <span className="control-icon">
            {isMuted ? '🔇' : '🎤'}
          </span>
          <span className="control-label">
            {isMuted ? 'Unmute' : 'Mute'}
          </span>
        </button>

        <button 
          className={`control-btn ${!isVideoOn ? 'active' : ''}`}
          onClick={() => setIsVideoOn(!isVideoOn)}
          title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
        >
          <span className="control-icon">
            {isVideoOn ? '📹' : '📴'}
          </span>
          <span className="control-label">
            {isVideoOn ? 'Camera On' : 'Camera Off'}
          </span>
        </button>

        <button 
          className={`control-btn ${isScreenSharing ? 'active' : ''}`}
          onClick={() => setIsScreenSharing(!isScreenSharing)}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <span className="control-icon">
            {isScreenSharing ? '🛑' : '🖥️'}
          </span>
          <span className="control-label">
            {isScreenSharing ? 'Stop Share' : 'Share Screen'}
          </span>
        </button>

        <button 
          className="control-btn disconnect"
          title="Leave call"
        >
          <span className="control-icon">📞</span>
          <span className="control-label">Leave</span>
        </button>
      </div>

      <div className="connection-info">
        <h4>Connection Status</h4>
        <div className="status-item">
          <span className="status-label">Status:</span>
          <span className="status-value connected">Connected</span>
        </div>
        <div className="status-item">
          <span className="status-label">Quality:</span>
          <span className="status-value">Good</span>
        </div>
        <div className="status-item">
          <span className="status-label">Latency:</span>
          <span className="status-value">45ms</span>
        </div>
      </div>
    </div>
  )
}