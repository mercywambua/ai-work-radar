const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server,{cors:{origin:"*"}});

const db = new sqlite3.Database('./aiRadar.db',(err)=>{if(err) console.error(err.message); else console.log('Connected to DB.');});

db.run(`CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,status TEXT,accuracy REAL)`);

app.get('/tasks',(req,res)=>{ db.all('SELECT * FROM tasks',[],(err,rows)=>err?res.status(500).send(err.message):res.json(rows));});
app.post('/tasks',(req,res)=>{ const {name,status,accuracy}=req.body; db.run(`INSERT INTO tasks (name,status,accuracy) VALUES (?,?,?)`,[name,status,accuracy],function(err){if(err)return res.status(500).send(err.message); io.emit("updateTasks"); res.json({id:this.lastID});});});
app.put('/tasks/:id',(req,res)=>{ const {id}=req.params; const {name,status,accuracy}=req.body; db.run(`UPDATE tasks SET name=?, status=?, accuracy=? WHERE id=?`,[name,status,accuracy,id],function(err){if(err)return res.status(500).send(err.message); io.emit("updateTasks"); res.json({updated:this.changes});});});
app.delete('/tasks/:id',(req,res)=>{ const {id}=req.params; db.run(`DELETE FROM tasks WHERE id=?`,[id],function(err){if(err)return res.status(500).send(err.message); io.emit("updateTasks"); res.json({deleted:this.changes});});});

app.use(express.static(path.join(__dirname,'../frontend/build')));
app.get('*',(req,res)=>{res.sendFile(path.join(__dirname,'../frontend/build','index.html'));});

server.listen(PORT,()=>console.log(`Server running on port ${PORT}`));