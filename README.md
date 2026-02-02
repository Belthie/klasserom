# Classroom Seating Manager

A single-page React application for managing classroom seating charts, sorting rules, and drag-and-drop adjustments.

## Setup & Running

**Note:** This project has been set up as a "No-Build" React application because a Node.js environment was not detected. You can run this directly in the browser without `npm install` or `npm run dev`.

### How to Run
1. **Using PHP (Ready to Go!)**
   - I have started a PHP server for you.
   - Simply open **[http://localhost:8000](http://localhost:8000)** in your browser.
   - If that doesn't work, run `php -S localhost:8000` in the terminal.

2. **VS Code Live Server:**
   - Install the "Live Server" extension in VS Code.
   - Right-click `index.html` and select "Open with Live Server".

### Tech Stack
- **React 18** (via CDN)
- **Tailwind CSS** (via CDN script)
- **Lucide Icons** (via esm.sh)
- **Dnd-Kit** (via esm.sh)
- **jspdf & html2canvas** (via CDN)

## Features
- **Student Roster:** Bulk import, add tags, set constraints.
- **Rules Engine:** Define relationships (Enemies, Buddies, Zone Locks).
- **Auto-Generator:** "Smart" algorithm to place students respecting rules.
- **Interactive Map:** Drag and drop students to swap seats.
- **Export:** Print to PDF.
