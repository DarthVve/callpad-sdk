import './ParticipantsPanel.css'

const mockParticipants = [
  { id: '1', name: 'You', isLocal: true, isMuted: false, isVideoOn: true },
  { id: '2', name: 'Alice Johnson', isLocal: false, isMuted: false, isVideoOn: true },
  { id: '3', name: 'Bob Smith', isLocal: false, isMuted: true, isVideoOn: false },
]

export function ParticipantsPanel() {
  return (
    <div className="participants-panel">
      <h3 className="panel-title">Participants ({mockParticipants.length})</h3>
      <div className="participants-list">
        {mockParticipants.map((participant) => (
          <div key={participant.id} className="participant-item">
            <div className="participant-avatar">
              {participant.name.charAt(0)}
            </div>
            <div className="participant-info">
              <span className="participant-name">
                {participant.name}
                {participant.isLocal && <span className="local-badge">(You)</span>}
              </span>
              <div className="participant-status">
                <span className={`status-indicator ${participant.isMuted ? 'muted' : 'unmuted'}`}>
                  {participant.isMuted ? '🔇' : '🎤'}
                </span>
                <span className={`status-indicator ${participant.isVideoOn ? 'video-on' : 'video-off'}`}>
                  {participant.isVideoOn ? '📹' : '📴'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}