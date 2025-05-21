---
description: Start both the data server and web UI server for Caldo
---

## Usage
Type `/start-servers` to initialize both the data server and web UI server for the Caldo application.

## Details
This workflow will:
1. Start the data server on port 3111 (localhost:3111)
2. Start the web UI server on port 3001 (localhost:3001)

## Steps
1. Start the data server:
   ```bash
   cd /Users/jonamar/Documents/caldo/server
   npm start
   ```
   *Note: If the server directory is elsewhere, the path will be adjusted accordingly*

2. Open a new terminal window for the UI server

3. Start the web UI server:
   ```bash
   cd /Users/jonamar/Documents/caldo
   npm start
   ```

4. Verify both servers are running:
   - Data server should be accessible at http://localhost:3111
   - Web UI should be accessible at http://localhost:3001

5. Open the application in a browser if needed (will navigate to http://localhost:3001)
