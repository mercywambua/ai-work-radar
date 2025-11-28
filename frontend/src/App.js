import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

const socket = io();

function App() {
  const [tasks,setTasks]=useState([]);
  const [name,setName]=useState("");
  const [status,setStatus]=useState("Pending");
  const [accuracy,setAccuracy]=useState(0);

  const fetchTasks=async()=>{ const res=await axios.get("/tasks"); setTasks(res.data); };

  const addTask=async()=>{ if(!name)return alert("Task name required"); await axios.post("/tasks",{name,status,accuracy}); setName(""); setAccuracy(0); setStatus("Pending"); };

  useEffect(()=>{ fetchTasks(); socket.on("updateTasks",fetchTasks); return ()=>socket.off("updateTasks"); },[]);

  const COLORS=["#0088FE","#00C49F","#FFBB28","#FF8042"];
  const statusData=[
    {name:"Pending",value:tasks.filter(t=>t.status==="Pending").length},
    {name:"Running",value:tasks.filter(t=>t.status==="Running").length},
    {name:"Done",value:tasks.filter(t=>t.status==="Done").length},
    {name:"Failed",value:tasks.filter(t=>t.status==="Failed").length},
  ];

  return(
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">AI Work Radar</h1>

      <div className="mb-6 flex gap-2">
        <input className="p-2 border rounded" placeholder="Task Name" value={name} onChange={e=>setName(e.target.value)} />
        <select className="p-2 border rounded" value={status} onChange={e=>setStatus(e.target.value)}>
          <option>Pending</option><option>Running</option><option>Done</option><option>Failed</option>
        </select>
        <input type="number" className="p-2 border rounded w-20" placeholder="Accuracy" value={accuracy} onChange={e=>setAccuracy(e.target.value)} />
        <button className="bg-blue-500 text-white p-2 rounded" onClick={addTask}>Add Task</button>
      </div>

      <table className="min-w-full mb-6 bg-white rounded shadow">
        <thead className="bg-gray-200"><tr><th className="p-2">Task</th><th className="p-2">Status</th><th className="p-2">Accuracy</th></tr></thead>
        <tbody>{tasks.map(t=>(<tr key={t.id} className="border-t"><td className="p-2">{t.name}</td><td className="p-2">{t.status}</td><td className="p-2">{t.accuracy}%</td></tr>))}</tbody>
      </table>

      <div className="flex gap-6 flex-wrap">
        <PieChart width={300} height={300}><Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{statusData.map((entry,index)=><Cell key={index} fill={COLORS[index%COLORS.length]} />)}</Pie><Tooltip/></PieChart>
        <LineChart width={500} height={300} data={tasks}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Line type="monotone" dataKey="accuracy" stroke="#8884d8"/></LineChart>
      </div>
    </div>
  );
}

export default App;