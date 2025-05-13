#!/usr/bin/env node

/**
 * Caldo Task Updater CLI
 * 
 * This script provides a command-line interface to update tasks in the Caldo app.
 * It directly manipulates the localStorage data that the app uses.
 * 
 * Usage:
 * node update-tasks.js schedule --start "14:45" --end "16:30" --tasks "Apply to easy job application #1:15,Apply to easy job application #2:15,Apply to medium difficulty job application:30,Call the glasses store:15,Rest time:45"
 * 
 * Or to directly set tasks:
 * node update-tasks.js set --tasks '[{"title":"Task 1","start":"09:00","end":"10:00"},{"title":"Task 2","start":"10:30","end":"11:30"}]'
 * 
 * Or to clear tasks:
 * node update-tasks.js clear
 */

const axios = require('axios');

// Caldo server config
const SERVER_URL = process.env.CALDO_SERVER_URL || 'http://localhost:3111';

// Helper functions for server API
const getTasks = async (dateString) => {
  const res = await axios.get(`${SERVER_URL}/tasks/${dateString}`);
  return res.data;
};
const setTasks = async (dateString, tasks) => {
  await axios.post(`${SERVER_URL}/tasks/${dateString}`, tasks);
};
const clearTasks = async (dateString) => {
  await axios.delete(`${SERVER_URL}/tasks/${dateString}`);
};

// Format date to yy-mm-dd
const formatDateForFile = (date = new Date()) => {
  const year = date.getFullYear().toString().slice(2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Schedule tasks based on priorities
const scheduleTasks = (priorityTasks, startTime, endTime) => {
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

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.error('Please provide a command: schedule, set, or clear');
  process.exit(1);
}

// Get today's date
const today = formatDateForFile();

(async () => {
  switch (command) {
    case 'schedule': {
      // Parse arguments
      let startTime = '09:00';
      let endTime = '17:00';
      let tasksString = '';
      
      for (let i = 1; i < args.length; i += 2) {
        if (args[i] === '--start' && args[i + 1]) {
          startTime = args[i + 1];
        } else if (args[i] === '--end' && args[i + 1]) {
          endTime = args[i + 1];
        } else if (args[i] === '--tasks' && args[i + 1]) {
          tasksString = args[i + 1];
        }
      }
      
      if (!tasksString) {
        console.error('Please provide tasks in the format: "Task 1:15,Task 2:30"');
        process.exit(1);
      }
      
      // Parse tasks
      const priorityTasks = tasksString.split(',').map(taskStr => {
        const [title, durationStr] = taskStr.split(':');
        const durationMinutes = parseInt(durationStr, 10);
        return { title, durationMinutes };
      });
      
      // Schedule tasks
      const scheduledTasks = scheduleTasks(priorityTasks, startTime, endTime);
      
      // Save to server
      await setTasks(today, scheduledTasks);
      
      console.log(`Successfully scheduled ${scheduledTasks.length} tasks for today (${today})`);
      console.log('Tasks:');
      scheduledTasks.forEach(task => {
        console.log(`- ${task.title}: ${task.start} - ${task.end}`);
      });
      break;
    }
    
    case 'set': {
      // Parse arguments
      let tasksJson = '';
      
      for (let i = 1; i < args.length; i += 2) {
        if (args[i] === '--tasks' && args[i + 1]) {
          tasksJson = args[i + 1];
        }
      }
      
      if (!tasksJson) {
        console.error('Please provide tasks as a JSON array');
        process.exit(1);
      }
      
      try {
        // Parse tasks
        const tasks = JSON.parse(tasksJson);
        
        // Add IDs and checked status if not present
        const formattedTasks = tasks.map((task, index) => ({
          id: task.id || (index + 1).toString(),
          title: task.title,
          start: task.start,
          end: task.end,
          checked: task.checked !== undefined ? task.checked : false
        }));
        
        // Save to server
        await setTasks(today, formattedTasks);
        
        console.log(`Successfully set ${formattedTasks.length} tasks for today (${today})`);
        console.log('Tasks:');
        formattedTasks.forEach(task => {
          console.log(`- ${task.title}: ${task.start} - ${task.end}`);
        });
      } catch (error) {
        console.error('Error parsing tasks JSON:', error);
        process.exit(1);
      }
      break;
    }
    
    case 'clear': {
      // Clear tasks for today via server
      await clearTasks(today);
      console.log(`Successfully cleared all tasks for today (${today})`);
      break;
    }
    
    default:
      console.error('Unknown command. Please use schedule, set, or clear');
      process.exit(1);
  }
})();
