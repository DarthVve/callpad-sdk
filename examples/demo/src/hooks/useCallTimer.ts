import { useState, useEffect } from 'react';
import { useCallState } from 'vg-x07df';

export function useCallTimer() {
  const [duration, setDuration] = useState(0);
  const { status } = useCallState();

  useEffect(() => {
    if (status !== 'ACTIVE') {
      setDuration(0);
      return;
    }

    // Start timer when call becomes active
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    duration,
    formattedDuration: formatDuration(duration),
    isActive: status === 'ACTIVE',
  };
}