const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./aiRadar.db", (err) => {
  if (err) console.error(err.message);
  console.log("Connected to DB.");
});

db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  status TEXT,
  accuracy INTEGER
)`);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- ROUTES ---

app.get("/", (req, res) => res.send("Backend is Live!"));

app.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/tasks", (req, res) => {
  const { name, status, accuracy } = req.body;
  db.run("INSERT INTO tasks (name, status, accuracy) VALUES (?, ?, ?)", [name, status, accuracy], function(err) {
    io.emit("updateTasks");
    res.json({ id: this.lastID });
  });
});

// NEW: This allows the Bot to update the task Name and Status
app.put("/tasks/:id", (req, res) => {
  const { name, status, accuracy } = req.body;
  
  // We update Name, Status, and Accuracy all at once
  db.run("UPDATE tasks SET name = ?, status = ?, accuracy = ? WHERE id = ?", 
  [name, status, accuracy, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    io.emit("updateTasks");
    res.json({ message: "Updated" });
  });
});

app.delete("/tasks/:id", (req, res) => {
  db.run("DELETE FROM tasks WHERE id = ?", req.params.id, function(err) {
    io.emit("updateTasks");
    res.json({ message: "Deleted" });
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
