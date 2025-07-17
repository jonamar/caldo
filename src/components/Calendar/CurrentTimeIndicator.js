import React from 'react';
import { calculateCurrentTimePosition } from '../../utils/positioning';
import { isSameDay } from '../../utils/timeCalculations';

const CurrentTimeIndicator = ({ currentTime, timeRange }) => {
  const today = new Date();
  const isToday = isSameDay(currentTime, today);
  
  if (!isToday) return null;
  
  const currentHour = currentTime.getHours();
  const isWithinRange = currentHour >= timeRange.startHour && currentHour <= timeRange.endHour;
  
  if (!isWithinRange) return null;
  
  const position = calculateCurrentTimePosition(currentTime, timeRange);
  
  return (
    <div 
      className="absolute border-t-2 border-red-500 pointer-events-none"
      style={{ 
        top: `${position - 5}px`, // Fine-tune for pixel-perfect alignment
        left: 0,
        right: 0,
        zIndex: 150 // Above static tasks, below dragged item
      }}
    />
  );
};

export default CurrentTimeIndicator;
