import React from 'react';
import { timeToPosition } from '../../utils/positioning';
import { HEADER_HEIGHT, TOP_PADDING, TIME_COLUMN_WIDTH } from '../../utils/constants';

const TimeGrid = ({ timeRange }) => {
  const visibleHours = Math.max(0, timeRange.endHour - timeRange.startHour);
  const minuteOffsetPx = (timeRange.startMinuteRemainder || 0) * 2; // 2px per minute

  return (
    <>
      {/* Time Labels */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-12 border-r border-gray-200 pr-1 z-0" 
        style={{ paddingTop: `${HEADER_HEIGHT}px` }}
      >
        {Array.from({ length: Math.max(0, visibleHours) }, (_, i) => {
          const hourToDisplay = timeRange.startHour + i;
          if (hourToDisplay > timeRange.endHour) return null;
          
          const position = timeToPosition(hourToDisplay, 0, { includeHeaderOffset: false }, timeRange) - minuteOffsetPx;
          if (position < 0 && i > 0) return null; // Skip if before visible start due to startMinuteRemainder

          return (
            <div key={`time-marker-${hourToDisplay}`} className="relative">
              <div 
                className="absolute text-[0.6rem] text-gray-400 right-1"
                style={{ top: `${position}px` }}
              >
                {hourToDisplay}:00
              </div>
            </div>
          );
        })}
      </div>

      {/* Horizontal Grid Lines */}
      <div 
        className="absolute left-[48px] right-0 top-0 bottom-0 pointer-events-none z-0" 
        style={{ paddingTop: `${HEADER_HEIGHT + TOP_PADDING}px` }}
      >
        {Array.from({ length: Math.max(0, visibleHours) }, (_, i) => {
          const hourToDisplay = timeRange.startHour + i;
          if (hourToDisplay > timeRange.endHour) return null;
          
          const position = timeToPosition(hourToDisplay, 0, { includeHeaderOffset: false }, timeRange);
          if (position < 0 && i > 0) return null;

          return (
            <div 
              key={`grid-line-${hourToDisplay}`} 
              className="border-t border-gray-100"
              style={{ position: 'absolute', left: 0, right: 0, top: `${position}px` }}
            />
          );
        })}
      </div>
    </>
  );
};

export default TimeGrid;
