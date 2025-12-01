import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

// --- FIX 1: Explicit Socket Connection ---
const socket = io("https://ai-work-radar-1.onrender.com", {
  transports: ["websocket", "polling"],
  withCredentials: true
});

function App() {
  const [tasks, setTasks] = useState([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Pending");
  const [accuracy, setAccuracy] = useState(0);

  // --- FIX 2: Correct API URL (/api/tasks) ---
  const fetchTasks = async () => {
    try {
      const res = await axios.get("https://ai-work-radar-1.onrender.com/api/tasks");
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    
    // Listen for real-time updates from the server
    socket.on("updateTasks", () => {
      console.log("🔔 Received update from server!");
      fetchTasks();
    });

    return () => socket.off("updateTasks");
  }, []);

  // --- FIX 3: Correct Add Task URL (/api/add-task) ---
  const addTask = async () => {
    if (!name) return alert("Task name required");
    try {
      await axios.post("https://ai-work-radar-1.onrender.com/api/add-task", { 
        name, status, accuracy: parseInt(accuracy) 
      });
      setName("");
      setAccuracy(0);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  // Prepare Data for Charts
  const statusData = [
    { name: "Pending", value: tasks.filter(t => t.status === "Pending").length },
    { name: "Completed", value: tasks.filter(t => t.status === "Completed").length },
    { name: "Failed", value: tasks.filter(t => t.status === "Failed").length }
  ];
  
  const COLORS = ["#FFBB28", "#00C49F", "#FF8042"];

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "1000px", margin: "0 auto" }}>
      <h1>🤖 AI Work Radar</h1>
      
      {/* Input Section */}
      <div style={{ background: "#f4f4f4", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
        <h3>Add New Task</h3>
        <input 
          placeholder="Task Name (e.g. Image Model v2)" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          style={{ marginRight: "10px", padding: "8px" }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginRight: "10px", padding: "8px" }}>
          <option>Pending</option>
          <option>Completed</option>
          <option>Failed</option>
        </select>
        <input 
          type="number" 
          placeholder="Accuracy %" 
          value={accuracy} 
          onChange={(e) => setAccuracy(e.target.value)}
          style={{ marginRight: "10px", padding: "8px", width: "80px" }}
        />
        <button onClick={addTask} style={{ padding: "8px 15px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Add Task
        </button>
      </div>

      {/* Charts Section */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "30px" }}>
        <div style={{ flex: 1, minWidth: "300px", height: "300px", border: "1px solid #ddd", borderRadius: "8px", padding: "10px" }}>
            <h4 style={{textAlign: "center"}}>Task Status</h4>
            <ResponsiveContainer>
                <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                        {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, minWidth: "300px", height: "300px", border: "1px solid #ddd", borderRadius: "8px", padding: "10px" }}>
            <h4 style={{textAlign: "center"}}>Accuracy Trend</h4>
            <ResponsiveContainer>
                <LineChart data={tasks}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="accuracy" stroke="#8884d8" />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Task List */}
      <h3>Recent Tasks</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map((t) => (
          <li key={t.id} style={{ borderBottom: "1px solid #eee", padding: "10px", display: "flex", justifyContent: "space-between" }}>
            <span><strong>{t.name}</strong> ({t.status})</span>
            <span>Accuracy: {t.accuracy}%</span>
          </li>
        ))}
        {tasks.length === 0 && <p style={{color: "#888"}}>No tasks found. Add one above!</p>}
      </ul>
    </div>
  );
}

export default App;
