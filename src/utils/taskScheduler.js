/**
 * Task Scheduler Utility
 * 
 * This module provides functions to easily schedule and update tasks based on priorities
 * and time windows. It works with the existing localStorage data structure.
 */

import { formatDateForFile, loadTasksForDate, saveTasksForDate } from './taskLoader';

/**
 * Schedules tasks automatically based on priorities within a time window
 * @param {Array} priorityTasks - Array of tasks with title and duration in minutes
 * @param {string} startTime - Start time in 24h format (HH:MM)
 * @param {string} endTime - End time in 24h format (HH:MM)
 * @returns {Array} - Array of scheduled tasks with start and end times
 */
export const scheduleTasks = (priorityTasks, startTime, endTime) => {
  // Convert start and end times to minutes since midnight
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // If tasks don't fit in the window, we'll need to adjust
  let currentMinutes = startMinutes;
  const scheduledTasks = [];
  
  // Schedule each task
  priorityTasks.forEach((task, index) => {
    // Calculate this task's start and end times
    const taskStartMinutes = currentMinutes;
    const taskEndMinutes = Math.min(endMinutes, taskStartMinutes + task.durationMinutes);
    
    // Convert back to HH:MM format
    const taskStartHour = Math.floor(taskStartMinutes / 60);
    const taskStartMin = taskStartMinutes % 60;
    const taskEndHour = Math.floor(taskEndMinutes / 60);
    const taskEndMin = taskEndMinutes % 60;
    
    const formattedStartTime = `${String(taskStartHour).padStart(2, '0')}:${String(taskStartMin).padStart(2, '0')}`;
    const formattedEndTime = `${String(taskEndHour).padStart(2, '0')}:${String(taskEndMin).padStart(2, '0')}`;
    
    // Create the scheduled task
    scheduledTasks.push({
      id: (index + 1).toString(),
      title: task.title,
      start: formattedStartTime,
      end: formattedEndTime,
      checked: false
    });
    
    // Move current time pointer
    currentMinutes = taskEndMinutes;
  });
  
  return scheduledTasks;
};

/**
 * Updates today's tasks based on a list of priorities and a time window
 * @param {Array} priorityList - Array of objects with title and durationMinutes properties
 * @param {string} startTime - Start time in 24h format (HH:MM)
 * @param {string} endTime - End time in 24h format (HH:MM)
 * @param {Date} [targetDate=new Date()] - Optional target date, defaults to today
 * @returns {Promise<boolean>} - Success status
 */
export const updateTasksFromPriorities = async (priorityList, startTime, endTime, targetDate = new Date()) => {
  try {
    // Format the date for storage
    const dateString = formatDateForFile(targetDate);
    
    // Generate scheduled tasks
    const scheduledTasks = scheduleTasks(priorityList, startTime, endTime);
    
    // Save the tasks directly to localStorage
    return await saveTasksForDate(dateString, scheduledTasks);
  } catch (error) {
    console.error('Error updating tasks from priorities:', error);
    return false;
  }
};

/**
 * Utility function to create a priority task object
 * @param {string} title - Task title
 * @param {number} durationMinutes - Duration in minutes
 * @returns {Object} - Priority task object
 */
export const createPriorityTask = (title, durationMinutes) => {
  return { title, durationMinutes };
};

/**
 * Directly updates tasks for a specific date
 * @param {Array} tasks - Array of task objects with title, start, end properties
 * @param {Date} [targetDate=new Date()] - Optional target date, defaults to today
 * @returns {Promise<boolean>} - Success status
 */
export const setTasksForDate = async (tasks, targetDate = new Date()) => {
  try {
    // Format the date for storage
    const dateString = formatDateForFile(targetDate);
    
    // Add IDs and checked status if not present
    const formattedTasks = tasks.map((task, index) => ({
      id: task.id || (index + 1).toString(),
      title: task.title,
      start: task.start,
      end: task.end,
      checked: task.checked !== undefined ? task.checked : false
    }));
    
    // Save the tasks directly to localStorage
    return await saveTasksForDate(dateString, formattedTasks);
  } catch (error) {
    console.error('Error setting tasks for date:', error);
    return false;
  }
};

/**
 * Gets tasks for a specific date
 * @param {Date} [targetDate=new Date()] - Optional target date, defaults to today
 * @returns {Promise<Array>} - Array of tasks for the specified date
 */
export const getTasksForDate = async (targetDate = new Date()) => {
  const dateString = formatDateForFile(targetDate);
  return await loadTasksForDate(dateString);
};

/**
 * Clears all tasks for a specific date
 * @param {Date} [targetDate=new Date()] - Optional target date, defaults to today
 * @returns {Promise<boolean>} - Success status
 */
export const clearTasksForDate = async (targetDate = new Date()) => {
  const dateString = formatDateForFile(targetDate);
  return await saveTasksForDate(dateString, []);
};
