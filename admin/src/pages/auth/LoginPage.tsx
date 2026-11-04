import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, ShieldCheck, Trophy, Building2,
  CalendarCheck, UserCheck, Lock, Sparkles, AlertCircle
} from 'lucide-react';
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
      setError(err.message || 'Login failed. Check credentials and server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-900 font-sans selection:bg-[#F05A22] selection:text-white">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* LEFT: EXECUTIVE BRANDING SHOWCASE                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-gradient-to-br from-[#070c1e] via-[#0d1838] to-[#080f24] border-r border-slate-800/80">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#F05A22]/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-[#F05A22]/8 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-2 shadow-inner">
            <img src={logo} alt="Arenova Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#F05A22]" style={{ color: '#F05A22' }}>
              Arenova Enterprise
            </span>
            <p className="text-slate-400 text-[11px]" style={{ color: '#94a3b8' }}>Unified Sports & Coaching Operations</p>
          </div>
        </div>

        {/* Hero Narrative */}
        <div className="relative z-10 my-auto py-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
            <Sparkles className="h-3.5 w-3.5 text-[#F05A22]" />
            <span className="text-xs font-semibold text-slate-200" style={{ color: '#e2e8f0' }}>Administrative Control Center</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight" style={{ color: '#ffffff' }}>
            Empowering modern sports ecosystems with complete administrative governance.
          </h1>

          <p className="mt-4 text-sm text-slate-300 leading-relaxed font-normal" style={{ color: '#cbd5e1' }}>
            Seamlessly oversee coach certifications, dynamic booking settlements, player analytics, community venues, and multi-tier audit trails.
          </p>

          {/* Capabilities Grid */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { icon: <UserCheck className="h-4 w-4 text-[#F05A22]" />, title: 'Coach Onboarding & KYC', desc: 'Direct pricing overrides & credential verification' },
              { icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />, title: 'Financial Settlements', desc: 'Dispute queue, coach payouts & session refunds' },
              { icon: <CalendarCheck className="h-4 w-4 text-blue-400" />, title: 'Booking Lifecycle', desc: 'Real-time session attendance and check-in audit' },
              { icon: <Trophy className="h-4 w-4 text-amber-400" />, title: 'Tournaments & Venues', desc: 'End-to-end community & tournament governance' },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-2xl p-3.5 backdrop-blur-md transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1 rounded-lg bg-white/5">{item.icon}</div>
                  <h4 className="text-xs font-bold text-white tracking-wide" style={{ color: '#ffffff' }}>{item.title}</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal" style={{ color: '#94a3b8' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Meta */}
        <div className="relative z-10 flex items-center justify-between pt-6 border-t border-white/10 text-xs text-slate-400" style={{ color: '#94a3b8' }}>
          <span>Security Protocol: TLS 1.3 · AES-256</span>
          <span>Arenova Portal v2.4</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* RIGHT: CLEAN MODERN SIGN-IN CARD                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-[#F8FAFC]">
        <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-100 p-8 sm:p-10 relative">
          
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <img src={logo} alt="Arenova Logo" className="h-9 w-auto object-contain" />
            <div>
              <p className="text-base font-black text-slate-900 tracking-tight">ARENOVA</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Admin Portal</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sign in with your administrator credentials to proceed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@arenova.com"
                  required
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#F05A22] focus:ring-4 focus:ring-[#F05A22]/10 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#F05A22] focus:ring-4 focus:ring-[#F05A22]/10 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-shake">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F05A22] to-[#FF6B35] hover:from-[#e04f18] hover:to-[#f0612c] text-white text-sm font-semibold shadow-lg shadow-[#F05A22]/20 hover:shadow-[#F05A22]/30 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: '#ffffff', backgroundColor: '#F05A22' }}
            >
              {loading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Sign In to Administration
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Authorized personnel only. Sessions are monitored and audited.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
