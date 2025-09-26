import './CallDemo.css'

export function CallDemo() {
  return (
    <div className="call-demo">
      <div className="video-container">
        <div className="video-placeholder">
          <div className="placeholder-content">
            <div className="camera-icon">📹</div>
            <p>Video will appear here when connected</p>
            <button className="connect-btn">Connect to Call</button>
          </div>
        </div>
      </div>
      
      <div className="demo-info">
        <h2>CallPad SDK Integration</h2>
        <p>This demo showcases the key features of the CallPad SDK:</p>
        <ul>
          <li>Real-time video and audio communication</li>
          <li>Participant management</li>
          <li>Call controls (mute, camera, screen share)</li>
          <li>Connection status tracking</li>
        </ul>
      </div>
    </div>
  )
}