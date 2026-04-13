import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!isLogin) {
        await api.post("/auth/register", { email, password, name });
      }
      await api.post("/auth/login", { email, password });
      navigate("/boards");
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body antialiased min-h-screen flex flex-col justify-center items-center overflow-hidden">
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-secondary-container/10 blur-[100px] pointer-events-none"></div>
      
      <main className="relative z-10 w-full max-w-[420px] px-6">
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
          </div>
          <h1 className="text-headline-sm font-semibold tracking-tight text-on-surface">DevBoard Enterprise</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Management Console Access</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/20 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex p-1 bg-surface-container-low rounded-lg">
              <button 
                onClick={() => { setIsLogin(true); setError(null); }}
                className={`flex-1 text-label-sm font-medium py-2 rounded-md transition-colors ${isLogin ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setIsLogin(false); setError(null); }}
                className={`flex-1 text-label-sm font-medium py-2 rounded-md transition-colors ${!isLogin ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
              >
                Create Account
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold" htmlFor="name">Full Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">person</span>
                    <input 
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 focus:border-primary focus:ring-2 focus:ring-primary-fixed/30 rounded-lg py-2.5 pl-10 pr-4 text-body-md transition-all placeholder:text-outline-variant outline-none" 
                      placeholder="Jane Doe" 
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold" htmlFor="email">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">mail</span>
                  <input 
                    id="email"
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 focus:border-primary focus:ring-2 focus:ring-primary-fixed/30 rounded-lg py-2.5 pl-10 pr-4 text-body-md transition-all placeholder:text-outline-variant outline-none" 
                    placeholder="name@company.com" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold" htmlFor="password">Password</label>
                  {isLogin && <a className="text-label-sm text-primary hover:text-primary-dim font-medium" href="#">Reset Password?</a>}
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">lock</span>
                  <input 
                    id="password" 
                    type="password" 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 focus:border-primary focus:ring-2 focus:ring-primary-fixed/30 rounded-lg py-2.5 pl-10 pr-4 text-body-md transition-all placeholder:text-outline-variant outline-none" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              {error && (
                <div className="text-error text-sm font-medium p-2 bg-error-container/20 rounded-md">
                  {error}
                </div>
              )}

              <button 
                disabled={loading}
                className="w-full py-3 px-4 mt-2 bg-gradient-to-b from-primary to-primary-dim text-on-primary font-semibold rounded-lg shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50" 
                type="submit"
              >
                {loading ? "Processing..." : (isLogin ? "Sign in to Dashboard" : "Create Account")}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
