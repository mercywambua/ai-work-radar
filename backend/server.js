const express = require('express');
const http = require('http');                // <--- NEW: Required for WebSockets
const { Server } = require("socket.io");     // <--- NEW: Required for WebSockets
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
// (Note: If your database file has a different name, update './database.db' below)
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error("Database error:", err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            status TEXT,
            accuracy INTEGER
        )`);
    }
});

// --- THE FIX: Wrap Express in an HTTP Server ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",  // Allow your frontend to connect from anywhere
        methods: ["GET", "POST"]
    }
});

// Global variable to track the last task ID
let lastID = 0;

// 1. Worker Function: Scan for new tasks in the database
function scanForWork() {
    db.get("SELECT MAX(id) as maxID FROM tasks", [], (err, row) => {
        if (err) return console.error(err.message);
        
        const currentMax = row ? row.maxID : 0;

        if (currentMax > lastID) {
            console.log(`🚨 ALERT: New Task Found! ID: ${currentMax}`);
            lastID = currentMax;
            io.emit("updateTasks"); // Notify Frontend
        } else {
            // console.log("...No new tasks found."); // Uncomment to debug
        }
    });
}

// Run the scanner every 5 seconds
setInterval(scanForWork, 5000);


// 2. API Route: Allow External Bot to Add Tasks
app.post('/api/add-task', (req, res) => {
    const { name, status, accuracy } = req.body;
    console.log(`🤖 Bot is adding a task: ${name}`);

    const sql = `INSERT INTO tasks (name, status, accuracy) VALUES (?,?,?)`;
    db.run(sql, [name, status, accuracy], function(err) {
        if (err) return res.status(500).json({ error: err.message });

        // Update the live dashboard immediately
        io.emit("updateTasks");
        res.json({ message: "Task added successfully!", id: this.lastID });
    });
});

// 3. API Route: Get all tasks (For the frontend to load initially)
app.get('/api/tasks', (req, res) => {
    db.all("SELECT * FROM tasks ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- IMPORTANT: Listen using 'server', not 'app' ---
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
