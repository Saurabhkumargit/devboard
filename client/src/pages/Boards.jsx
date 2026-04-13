import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, AuthError } from "../lib/api";

export default function Boards() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDesc, setNewBoardDesc] = useState("");
  const [creating, setCreating] = useState(false);
  
  const navigate = useNavigate();

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const data = await api.get("/boards");
      setBoards(data);
    } catch (err) {
      if (err instanceof AuthError) {
        navigate("/login");
      } else {
        setError(err.message || "Failed to load boards");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [navigate]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/boards", { name: newBoardName, description: newBoardDesc });
      setIsModalOpen(false);
      setNewBoardName("");
      setNewBoardDesc("");
      fetchBoards();
    } catch (err) {
      alert(err.message || "Failed to create board");
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      navigate("/login");
    } catch (err) {
      navigate("/login");
    }
  };

  if (loading && boards.length === 0) {
    return <div className="p-8 text-on-surface">Loading boards...</div>;
  }

  return (
    <div className="bg-background text-on-surface min-h-screen">
      {/* TopNavBar */}
      <header className="bg-surface sticky top-0 z-40 flex items-center justify-between w-full px-6 py-3 border-b border-outline-variant/10">
        <div className="flex items-center gap-8">
          <div className="text-lg font-semibold tracking-tight">DevBoard</div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-normal">
            <Link to="/boards" className="text-primary font-medium border-b-2 border-primary pb-1">Boards</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleLogout} className="text-sm font-medium text-slate-700 bg-surface-container-low px-3 py-1.5 rounded-md hover:bg-surface-container-high transition-colors">
            Logout
          </button>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-64px)]">
        {/* Main Content Area */}
        <section className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-on-surface mb-1">Project Boards</h1>
                <p className="text-sm text-on-surface-variant">Manage and orchestrate your active development workflows.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-b from-primary to-primary-dim text-on-primary px-5 py-2.5 rounded-md font-medium text-sm shadow-sm active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'wght' 500" }}>add</span>
                Create New Board
              </button>
            </div>

            {error ? (
              <div className="text-error p-4 bg-error-container/20 rounded-lg">{error}</div>
            ) : boards.length === 0 ? (
              <div className="text-on-surface-variant p-8 bg-surface-container rounded-xl border border-outline-variant/10 text-center">
                No boards available. Create one to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boards.map(board => (
                  <div key={board.id} onClick={() => navigate(`/boards/${board.id}`)} className="group bg-surface-container-lowest rounded-xl p-5 shadow-[0_4px_24px_-2px_rgba(42,52,57,0.04)] border border-outline-variant/10 hover:shadow-[0_8px_32px_-4px_rgba(42,52,57,0.08)] transition-all cursor-pointer flex flex-col min-h-[160px]">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-primary-container rounded-lg">
                        <span className="material-symbols-outlined text-primary">dashboard</span>
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-on-surface mb-2 truncate">{board.name}</h3>
                    <p className="text-sm text-on-surface-variant line-clamp-2 mb-6 flex-1">
                      {board.description || "No description provided."}
                    </p>
                    <div className="pt-4 border-t border-surface-container mt-auto text-xs text-on-surface-variant flex justify-between">
                      <span>Created {new Date(board.createdAt).toLocaleDateString()}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Basic Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-inverse/20 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/20">
            <h2 className="text-lg font-semibold mb-4">Create New Board</h2>
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Board Name</label>
                <input 
                  autoFocus
                  required
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="w-full border border-outline-variant/30 rounded-md px-3 py-2 bg-surface-container-low focus:border-primary outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Description</label>
                <textarea 
                  value={newBoardDesc}
                  onChange={(e) => setNewBoardDesc(e.target.value)}
                  className="w-full border border-outline-variant/30 rounded-md px-3 py-2 bg-surface-container-low focus:border-primary outline-none focus:ring-1 focus:ring-primary"
                  rows="3"
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
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
