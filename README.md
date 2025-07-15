# Mobile Calendar App

A simple, mobile-optimized React calendar web app that displays tasks with start and end times. Tasks can be checked off as they're completed, and the app visually represents task duration by sizing the task cards proportionally.

## Features

- Mobile-first responsive design
- Tasks sized proportionally to their duration
- Simple task check-off functionality
- Clean UI using Tailwind CSS
- LocalStorage-based data storage for easy task management
- CLI tool for quick task updates

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

## Data Storage

The app uses localStorage to store task data. Each day's tasks are stored with keys in the format `tasks_yy-mm-dd` (e.g., `tasks_25-05-12` for May 12, 2025).

### Task Structure

Each task has the following properties:

```javascript
{
  id: "1",                // Unique identifier for the task (string)
  title: "Task Title",    // Title/description of the task
  start: "09:00",        // Start time in 24-hour format (HH:MM)
  end: "10:30",          // End time in 24-hour format (HH:MM)
  checked: false         // Whether the task is completed (boolean)
}
```

### Task Duration Visualization

The app automatically calculates the duration of each task and sizes the task cards accordingly. Tasks are sized proportionally to their duration, with longer tasks appearing larger in the UI.

## Task Management Tools

The app includes two powerful tools for managing tasks:

### 1. Task Scheduler Utility

The `src/utils/taskScheduler.js` module provides functions to easily schedule and update tasks programmatically:

```javascript
import { updateTasksFromPriorities, createPriorityTask } from './utils/taskScheduler';

// Define your priorities
const priorities = [
  createPriorityTask('Apply to easy job application #1', 15),
  createPriorityTask('Apply to easy job application #2', 15),
  createPriorityTask('Apply to medium difficulty job application', 30),
  createPriorityTask('Call the glasses store', 15),
  createPriorityTask('Rest time', 45)
];

// Update today's tasks for time window 2:45-4:30 PM
updateTasksFromPriorities(priorities, '14:45', '16:30');
```

### 2. Command Line Interface (CLI)

The app includes a CLI tool (`scripts/update-tasks.js`) that allows you to update tasks directly from the command line:

#### Schedule Tasks Based on Priorities

Automatically schedule tasks within a time window based on their durations:

```bash
node scripts/update-tasks.js schedule --start "14:45" --end "16:30" --tasks "Apply to easy job application #1:15,Apply to easy job application #2:15,Apply to medium difficulty job application:30,Call the glasses store:15,Rest time:45"
```

Format: `Task Title:DurationInMinutes,Task Title:DurationInMinutes,...`

#### Append New Tasks to Existing Schedule

Add new tasks to your day without replacing existing ones:

```bash
node scripts/update-tasks.js schedule --append --start "16:30" --end "18:00" --tasks "Follow up on applications:20,Evening planning:15"
```

Using the `--append` flag preserves all existing tasks for the day and adds the new tasks at the end.

#### Directly Set Tasks

Set specific tasks with exact start and end times:

```bash
node scripts/update-tasks.js set --tasks '[{"title":"Task 1","start":"09:00","end":"10:00"},{"title":"Task 2","start":"10:30","end":"11:30"}]'
```

#### Clear All Tasks

Remove all tasks for today:

```bash
node scripts/update-tasks.js clear
```

### Example: Updating Today's Schedule

To update today's tasks with a schedule for 2:45-4:30 PM:

```bash
node scripts/update-tasks.js schedule --start "14:45" --end "16:30" --tasks "Apply to easy job application #1:15,Apply to easy job application #2:15,Apply to medium difficulty job application:30,Call the glasses store:15,Rest time:45"
```

This will automatically:
1. Create tasks with the specified titles
2. Calculate appropriate start and end times within the given window
3. Save them to localStorage
4. Display the created schedule in the console

## License

This project is licensed under the CC0 1.0 Universal License - see the [LICENSE](LICENSE) file for details.
