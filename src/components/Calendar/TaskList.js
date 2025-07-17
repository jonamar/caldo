import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import TaskItem from './TaskItem';
import CurrentTimeIndicator from './CurrentTimeIndicator';
import LoadingSpinner from '../shared/LoadingSpinner';
import { SCALE_FACTOR, HEADER_HEIGHT, TOP_PADDING, TIME_COLUMN_WIDTH } from '../../utils/constants';

const TaskList = ({ 
  tasks, 
  isLoading, 
  timeRange, 
  currentTime, 
  onToggleCheck, 
  onDragEnd 
}) => {
  const visibleHours = Math.max(0, timeRange.endHour - timeRange.startHour);

  if (isLoading) {
    return <LoadingSpinner message="Loading tasks..." />;
  }

  return (
    <Droppable droppableId="calendar-tasks">
      {(provided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          style={{
            minHeight: `${visibleHours * 60 * SCALE_FACTOR + TOP_PADDING}px`,
            position: 'relative',
            marginLeft: `${TIME_COLUMN_WIDTH}px`,
            paddingTop: `${HEADER_HEIGHT + TOP_PADDING}px`,
            zIndex: 1
          }}
        >
          <CurrentTimeIndicator currentTime={currentTime} timeRange={timeRange} />

          {tasks.length === 0 ? (
            <div className="text-center py-2 text-gray-500">No tasks for this date</div>
          ) : (
            tasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                index={index}
                timeRange={timeRange}
                onToggleCheck={onToggleCheck}
              />
            ))
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default TaskList;
