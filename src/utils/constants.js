// Calendar display constants
export const SCALE_FACTOR = 2; // 2 pixels per minute
export const HEADER_HEIGHT = 35;
export const TOP_PADDING = 5;
export const TIME_COLUMN_WIDTH = 48;
export const TASK_BUFFER = 2;

// Default time range when no tasks are present
export const DEFAULT_TIME_RANGE = {
  startHour: 8,
  endHour: 18,
  startMinuteRemainder: 0
};

// Time range buffer settings
export const TIME_BUFFER = {
  top: 2, // minutes before earliest task
  bottom: 10 // minutes after latest task
};
