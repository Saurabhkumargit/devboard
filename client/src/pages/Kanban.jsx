import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api, AuthError } from "../lib/api";

function StatusDropdown({ status, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { value: "TODO", label: "To Do" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "DONE", label: "Done" }
  ];

  const currentOption = options.find(o => o.value === status);

  return (
    <div className="relative w-32" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-surface-container-lowest border border-outline-variant/30 rounded-md shadow-sm px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
      >
        {currentOption?.label}
        <span className="material-symbols-outlined text-outline-variant text-[14px]">
          expand_more
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-lg overflow-hidden py-1 z-20">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                status === option.value 
                  ? "bg-primary-container/40 text-primary" 
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Kanban() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchBoardData = async () => {
    try {
      setLoading(true);
      const [boardData, tasksData] = await Promise.all([
        api.get(`/boards/${id}`),
        api.get(`/boards/${id}/tasks`)
      ]);
      setBoard(boardData);
      setTasks(tasksData);
    } catch (err) {
      if (err instanceof AuthError) {
        navigate("/login");
      } else {
        setError(err.message || "Failed to load board");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post(`/boards/${id}/tasks`, { 
        title: newTaskTitle, 
        description: newTaskDesc 
      });
      setIsModalOpen(false);
      setNewTaskTitle("");
      setNewTaskDesc("");
      fetchBoardData(); // refresh tasks
    } catch (err) {
      alert(err.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // Optimistic UI update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      await api.patch(`/boards/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      alert("Failed to update status");
      fetchBoardData(); // Revert on error
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      navigate("/login");
    } catch {
      navigate("/login");
    }
  };

  if (loading && !board) {
    return <div className="p-8">Loading board...</div>;
  }

  if (error) {
    return <div className="p-8 text-error">{error}</div>;
  }

  const columns = [
    { id: "TODO", label: "To Do", color: "bg-surface-container" },
    { id: "IN_PROGRESS", label: "In Progress", color: "bg-primary-container/30" },
    { id: "DONE", label: "Done", color: "bg-surface-dim/30" }
  ];

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col">
      {/* TopNavBar */}
      <header className="bg-surface sticky top-0 z-40 flex items-center justify-between w-full px-6 py-3 border-b border-outline-variant/10">
        <div className="flex items-center gap-8">
          <div className="text-lg font-semibold tracking-tight">DevBoard</div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-normal">
            <Link to="/boards" className="text-on-surface-variant hover:text-on-surface">Boards</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleLogout} className="text-sm font-medium text-slate-700 bg-surface-container-low px-3 py-1.5 rounded-md hover:bg-surface-container-high transition-colors">
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-8 overflow-hidden">
        <div className="flex justify-between items-end mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-on-surface">{board?.name}</h1>
            <p className="text-sm text-on-surface-variant mt-1">{board?.description}</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-b from-primary to-primary-dim text-on-primary px-4 py-2 rounded-md font-medium text-sm shadow-sm active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Task
          </button>
        </div>

        {/* Kanban Board Layout */}
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
          {columns.map(col => (
            <div key={col.id} className={`${col.color} w-80 rounded-xl flex flex-col shrink-0 border border-outline-variant/10 p-3 relative`}>
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-on-surface">
                  {col.label}
                </h3>
                <span className="bg-surface-container-high text-xs font-semibold px-2 py-0.5 rounded-full">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {tasks.filter(t => t.status === col.id).map(task => (
                  <div key={task.id} className="bg-surface-container-lowest p-4 rounded-lg shadow-sm border border-outline-variant/20 hover:border-outline-variant/40 transition-colors">
                    <h4 className="font-semibold text-on-surface text-sm mb-1">{task.title}</h4>
                    <p className="text-xs text-on-surface-variant line-clamp-3 mb-4">{task.description}</p>
                    
                    <div className="flex items-center justify-between border-t border-surface-container pt-3">
                        <StatusDropdown 
                          status={task.status} 
                          onChange={(val) => handleStatusChange(task.id, val)}
                        />
                      
                      <div className="text-[10px] text-on-surface-variant font-medium">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Task Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-inverse/20 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/20">
            <h2 className="text-lg font-semibold mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Title</label>
                <input 
                  autoFocus
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full border border-outline-variant/30 rounded-md px-3 py-2 bg-surface-container-low focus:border-primary outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Description</label>
                <textarea 
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full border border-outline-variant/30 rounded-md px-3 py-2 bg-surface-container-low focus:border-primary outline-none focus:ring-1 focus:ring-primary"
                  rows="4"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="bg-primary text-on-primary px-4 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
