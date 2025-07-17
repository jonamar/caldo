import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { calculateDuration, formatDuration } from '../../utils/timeCalculations';
import { calculateHeight, calculateTaskPosition } from '../../utils/positioning';
import { TASK_BUFFER } from '../../utils/constants';

const TaskItem = ({ task, index, timeRange, onToggleCheck }) => {
  const duration = calculateDuration(task.start, task.end);
  const height = calculateHeight(duration);
  const position = calculateTaskPosition(task.start, timeRange);
  
  return (
    <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
      {(providedDraggable, snapshotDraggable) => (
        <div
          ref={providedDraggable.innerRef}
          {...providedDraggable.draggableProps}
          {...providedDraggable.dragHandleProps}
          className={`flex items-start py-0.5 px-1 rounded-lg shadow-sm bg-white transition border-l-4 overflow-hidden ${
            task.checked ? "border-green-400 opacity-60" : "border-blue-400"
          } relative`}
          style={{
            ...providedDraggable.draggableProps.style,
            height: `${height - (TASK_BUFFER * 2)}px`,
            position: 'absolute',
            top: `${position}px`,
            left: 0,
            right: 0,
            zIndex: snapshotDraggable.isDragging ? 200 : index + 10,
            boxShadow: snapshotDraggable.isDragging ? '0 4px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <input
            type="checkbox"
            checked={task.checked}
            onChange={() => onToggleCheck(task.id)}
            className="w-3 h-3 accent-blue-500 mr-2 mt-1"
          />
          <div className="flex-1 group flex justify-between items-start">
            <div className={`font-medium text-[0.625rem] ${task.checked ? "line-through text-gray-400" : "text-gray-800"}`}>
              {task.title}
            </div>
            <div className="text-[0.55rem] text-gray-400 whitespace-nowrap ml-2">
              {task.start} - {task.end} ({formatDuration(duration)})
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskItem;
