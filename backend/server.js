const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors()); // Allow frontend to talk to us
app.use(express.json());

// Database Setup
const db = new sqlite3.Database("./aiRadar.db", (err) => {
  if (err) console.error(err.message);
  console.log("Connected to DB.");
});

// Create Table if missing
db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  status TEXT,
  accuracy INTEGER
)`);

// Socket.io Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// --- API ROUTES ---

// Root URL: Just a simple message (No longer tries to load index.html)
app.get("/", (req, res) => {
  res.send("Backend is running! Access the frontend via your Static Site URL.");
});

// Get all tasks
app.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a task
app.post("/tasks", (req, res) => {
  const { name, status, accuracy } = req.body;
  db.run("INSERT INTO tasks (name, status, accuracy) VALUES (?, ?, ?)", [name, status, accuracy], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    io.emit("updateTasks");
    res.json({ id: this.lastID });
  });
});

// Delete a task
app.delete("/tasks/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM tasks WHERE id = ?", id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    io.emit("updateTasks");
    res.json({ message: "Deleted" });
  });
});

// Start Server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
