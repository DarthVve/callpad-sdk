import { useState } from 'react';
import { useEvent } from 'vg-x07df';
import './CallNotifications.css';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
}

export function CallNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Listen for call-declined events
  useEvent('call:declined', (event) => {
    const notification: Notification = {
      id: `declined-${Date.now()}`,
      message: `Call declined${event.payload.reason ? `: ${event.payload.reason}` : ''}`,
      type: 'warning',
      timestamp: Date.now(),
    };
    
    addNotification(notification);
  });

  // Listen for call ended events
  useEvent('call:ended', (event) => {
    const notification: Notification = {
      id: `ended-${Date.now()}`,
      message: `Call ended${event.payload.reason ? `: ${event.payload.reason}` : ''}`,
      type: 'info',
      timestamp: Date.now(),
    };
    
    addNotification(notification);
  });

  // Listen for participant left events
  useEvent('call:participant-left', (event) => {
    const notification: Notification = {
      id: `left-${Date.now()}`,
      message: `${event.payload.participant.id} left the call`,
      type: 'info',
      timestamp: Date.now(),
    };
    
    addNotification(notification);
  });

  // Listen for call accepted events
  useEvent('call:accepted', (event) => {
    const notification: Notification = {
      id: `accepted-${Date.now()}`,
      message: `Participant ${event.payload.participantId} joined the call`,
      type: 'success',
      timestamp: Date.now(),
    };
    
    addNotification(notification);
  });

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep max 5 notifications
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="call-notifications">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'success' && '✅'}
              {notification.type === 'warning' && '⚠️'}
              {notification.type === 'error' && '❌'}
              {notification.type === 'info' && 'ℹ️'}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
          <button 
            className="notification-close"
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}