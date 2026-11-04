import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../components/images/arenova_logo.png';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#f8fafc] text-slate-900 font-sans">
      <div className="w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white border border-slate-200/90 shadow-sm p-3 mb-4">
            <img src={logo} alt="Arenova Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Arenova Admin</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in to your administrative control panel</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.06)] p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@arenova.com"
                  required
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#F05A22] focus:ring-2 focus:ring-[#F05A22]/15 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#F05A22] focus:ring-2 focus:ring-[#F05A22]/15 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-1 flex items-center justify-center gap-2 rounded-xl bg-[#F05A22] hover:bg-[#e04f18] text-white text-sm font-semibold shadow-sm transition-all duration-150 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Authorized administrator access only</span>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          © {new Date().getFullYear()} Arenova Sports & Community Ecosystem
        </p>
      </div>
    </div>
  );
}
