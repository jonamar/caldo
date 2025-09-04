# Caldo Mobile Calendar UI

A simple, mobile-optimized React calendar UI that displays tasks from the Caldo data server. Tasks show start/end times and scale visually with duration.

## Features

- Mobile-first responsive design
- Tasks sized proportionally to their duration
- Simple task check-off functionality
- Clean UI using Tailwind CSS
- Server-backed storage with automatic localStorage fallback on first failed load
- CLI tool for quick task updates

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

From the `caldo-ui/` directory, start both the data server and the web UI:

```
bash scripts/start-servers.sh
```

Defaults:
- Data server: `http://localhost:8422`
- Web UI: `http://localhost:8421`

## Data Storage

- Server-first: tasks are loaded from and saved to the Caldo server at `http://localhost:8422` by default.
- Fallback: on the very first failed server load, sample data is initialized into `localStorage` for today and tomorrow to allow offline viewing. Subsequent server operations will continue to target the server.

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

Use `scripts/update-tasks.js` to update tasks via the server. Default server is `http://localhost:8422`. You can override with `CALDO_SERVER_URL`.

#### Schedule Tasks Based on Priorities

Automatically schedule tasks within a time window based on their durations:

```bash
CALDO_SERVER_URL=http://localhost:8422 node scripts/update-tasks.js schedule --start "14:45" --end "16:30" --tasks "Apply to easy job application #1:15,Apply to easy job application #2:15,Apply to medium difficulty job application:30,Call the glasses store:15,Rest time:45"
```

Format: `Task Title:DurationInMinutes,Task Title:DurationInMinutes,...`

#### Append New Tasks to Existing Schedule

Add new tasks to your day without replacing existing ones:

```bash
CALDO_SERVER_URL=http://localhost:8422 node scripts/update-tasks.js schedule --append --start "16:30" --end "18:00" --tasks "Follow up on applications:20,Evening planning:15"
```

Using the `--append` flag preserves all existing tasks for the day and adds the new tasks at the end.

#### Directly Set Tasks

Set specific tasks with exact start and end times:

```bash
CALDO_SERVER_URL=http://localhost:8422 node scripts/update-tasks.js set --tasks '[{"title":"Task 1","start":"09:00","end":"10:00"},{"title":"Task 2","start":"10:30","end":"11:30"}]'
```

#### Clear All Tasks

Remove all tasks for today:

```bash
CALDO_SERVER_URL=http://localhost:8422 node scripts/update-tasks.js clear
```

### Example: Updating Today's Schedule

```bash
CALDO_SERVER_URL=http://localhost:8422 node scripts/update-tasks.js schedule --start "14:45" --end "16:30" --tasks "Apply to easy job application #1:15,Apply to easy job application #2:15,Apply to medium difficulty job application:30,Call the glasses store:15,Rest time:45"
```

This will create tasks in the server for today and display the scheduled blocks.

## License

This project is licensed under the CC0 1.0 Universal License - see the [LICENSE](LICENSE) file for details.
