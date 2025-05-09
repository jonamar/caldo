# Mobile Calendar App

A simple, mobile-optimized React calendar web app that displays tasks with start and end times. Tasks can be checked off as they're completed, and the app visually represents task duration by sizing the task cards proportionally.

## Features

- Mobile-first responsive design
- Tasks sized proportionally to their duration
- Simple task check-off functionality
- Clean UI using Tailwind CSS
- YAML-based data layer for easy task management

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

## YAML Data Structure

The app uses YAML files to store task data. Each day's tasks are stored in a separate YAML file named in the format `yy-mm-dd.yaml` (e.g., `25-05-09.yaml` for May 9, 2025).

### File Location

YAML files should be placed in two locations:
- Source files: `/src/data/tasks/`
- Public files: `/public/data/tasks/`

When editing task data, always edit the source file first, then copy it to the public directory.

### YAML Structure

Each task in the YAML file should have the following properties:

```yaml
- id: 1                      # Unique identifier for the task
  title: "Task Title"        # Title/description of the task
  start: "09:00"             # Start time in 24-hour format (HH:MM)
  end: "10:30"               # End time in 24-hour format (HH:MM)
  checked: false             # Whether the task is completed (true/false)
```

Example of a complete YAML file:

```yaml
- id: 1
  title: "Morning Meeting"
  start: "09:00"
  end: "09:30"
  checked: false

- id: 2
  title: "Project Planning"
  start: "10:00"
  end: "11:00"
  checked: false
```

### Task Duration Visualization

The app automatically calculates the duration of each task and sizes the task cards accordingly. Tasks are sized in 15-minute increments, with longer tasks appearing larger in the UI.

### Editing Tasks

To edit or add tasks:

1. Edit the YAML file in the source directory (`/src/data/tasks/`)
2. Copy the updated file to the public directory:
   ```
   cp /src/data/tasks/yy-mm-dd.yaml /public/data/tasks/yy-mm-dd.yaml
   ```
3. Refresh the browser to see your changes

## License

This project is licensed under the CC0 1.0 Universal License - see the [LICENSE](LICENSE) file for details.
