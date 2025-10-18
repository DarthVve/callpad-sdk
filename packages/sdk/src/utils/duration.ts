export interface DurationResult {
  seconds: number;
  minutes: number;
  hours: number;
  formatted: string;
}

export const computeDuration = (
  startTime: string | Date | number,
  endTime?: string | Date | number
): DurationResult => {
  const startTimestamp = parseTimeInput(startTime);
  if (startTimestamp === null) {
    throw new Error('Invalid start time provided');
  }

  const endTimestamp = endTime ? parseTimeInput(endTime) : Date.now();
  if (endTimestamp === null) {
    throw new Error('Invalid end time provided');
  }

  const durationMs = endTimestamp - startTimestamp;
  if (durationMs < 0) {
    throw new Error('End time cannot be before start time');
  }

  const totalSeconds = Math.round(durationMs / 1000);
  const totalMinutes = Math.round(totalSeconds / 60);
  const totalHours = Math.round(totalSeconds / 3600);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = hours === 0
    ? `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return {
    seconds: totalSeconds,
    minutes: totalMinutes,
    hours: totalHours,
    formatted,
  };
};

const parseTimeInput = (input: string | Date | number): number | null => {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null;
  }

  if (input instanceof Date) {
    return Number.isFinite(input.getTime()) ? input.getTime() : null;
  }

    const timestamp = Date.parse(input);
    return Number.isFinite(timestamp) ? timestamp : null;
};
