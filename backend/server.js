const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error("Database error:", err.message);
    else {
        console.log('Connected to SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            status TEXT,
            accuracy INTEGER
        )`);
    }
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "https://ai-work-radar-1.onrender.com",
            "http://localhost:3000"
        ],
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

app.get('/api/tasks', (req, res) => {
    db.all('SELECT * FROM tasks ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/add-task', (req, res) => {
    const { name, status, accuracy } = req.body;
    console.log(`Bot adding task: ${name}`);
    db.run(`INSERT INTO tasks (name, status, accuracy) VALUES (?,?,?)`, 
        [name, status, accuracy], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            io.emit("updateTasks");
            res.json({ id: this.lastID });
        }
    );
});

app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

let lastID = 0;
function scanForWork() {
    db.get("SELECT MAX(id) as maxID FROM tasks", [], (err, row) => {
        if (err) return;
        const currentMax = row ? row.maxID : 0;
        if (currentMax > lastID) {
            console.log(`New Task Found! ID: ${currentMax}`);
            lastID = currentMax;
            io.emit("updateTasks");
        }
    });
}
setInterval(scanForWork, 5000);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
