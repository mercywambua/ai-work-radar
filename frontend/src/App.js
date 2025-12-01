import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const socket = io();

function App() {
  const [tasks, setTasks] = useState([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Pending");
  const [accuracy, setAccuracy] = useState(0);

  const fetchTasks = async () => {
    try {
      const res = await axios.get("/tasks");
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  const addTask = async () => {
    if (!name) return alert("Task name required");
    await axios.post("/tasks", { name, status, accuracy });
    setName("");
    setAccuracy(0);
    setStatus("Pending");
  };

  const deleteTask = async (id) => {
    await axios.delete(`/tasks/${id}`);
  };

  useEffect(() => {
    fetchTasks();
    socket.on("updateTasks", fetchTasks);
    return () => socket.off("updateTasks");
  }, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
  const statusData = [
    { name: "Pending", value: tasks.filter(t => t.status === "Pending").length },
    { name: "Running", value: tasks.filter(t => t.status === "Running").length },
    { name: "Done", value: tasks.filter(t => t.status === "Done").length },
    { name: "Failed", value: tasks.filter(t => t.status === "Failed").length },
  ];

  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">AI Work Radar 📡</h1>
      
      <div className="bg-white p-6 rounded shadow mb-8 flex gap-4 items-end flex-wrap">
        <div>
            <label className="block text-sm font-bold text-gray-700">Task Name</label>
            <input className="p-2 border rounded w-64" placeholder="e.g. Image Model v2" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
            <label className="block text-sm font-bold text-gray-700">Status</label>
            <select className="p-2 border rounded w-40" value={status} onChange={e => setStatus(e.target.value)}>
            <option>Pending</option><option>Running</option><option>Done</option><option>Failed</option>
            </select>
        </div>
        <div>
            <label className="block text-sm font-bold text-gray-700">Accuracy (%)</label>
            <input type="number" className="p-2 border rounded w-24" placeholder="0-100" value={accuracy} onChange={e => setAccuracy(e.target.value)} />
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-6 rounded font-bold" onClick={addTask}>Add Task</button>
      </div>

      <div className="bg-white rounded shadow overflow-hidden mb-8">
        <table className="min-w-full">
            <thead className="bg-gray-200 text-gray-700">
                <tr>
                    <th className="p-3 text-left">Task Name</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Accuracy</th>
                    <th className="p-3 text-left">Action</th>
                </tr>
            </thead>
            <tbody>
                {tasks.map(t => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{t.name}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded text-sm ${t.status === 'Done' ? 'bg-green-100 text-green-800' : t.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{t.status}</span></td>
                    <td className="p-3">{t.accuracy}%</td>
                    <td className="p-3">
                        <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition" onClick={() => deleteTask(t.id)}>Delete</button>
                    </td>
                </tr>
                ))}
            </tbody>
        </table>
        {tasks.length === 0 && <p className="p-4 text-gray-500 text-center">No tasks found. Add one above!</p>}
      </div>

      <div className="flex gap-6 flex-wrap">
        <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-gray-700 mb-4 text-center">Status Distribution</h3>
            <PieChart width={300} height={250}>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {statusData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </div>
        <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-gray-700 mb-4 text-center">Model Accuracy Trend</h3>
            <LineChart width={500} height={250} data={tasks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="accuracy" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
        </div>
      </div>
    </div>
  );
}

export default App;
