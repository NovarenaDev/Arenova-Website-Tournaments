import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Medal, MapPin, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../components/images/arenova_logo.png';



export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [email, setEmail]       = useState('super@arenova.in');
  const [password, setPassword] = useState('Admin@123');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

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
    <div className="min-h-screen bg-[#0e0f11] flex">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex w-[55%] flex-col items-center justify-center p-12 relative overflow-hidden"
           style={{ background: 'linear-gradient(145deg, #1B2B6B 0%, #0f1d4d 50%, #0e0f11 100%)' }}>
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-[#F05A22]/8" />
        <div className="absolute bottom-[-60px] left-[-60px] w-52 h-52 rounded-full bg-white/4" />
        <div className="absolute top-1/3 right-[-30px] w-40 h-40 rounded-full bg-[#F05A22]/5" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full bg-white/3" />

        <div className="mb-10 flex flex-col items-center relative z-10">
          <img src={logo} alt="Arenova Logo" className="h-20 w-auto object-contain mb-5" />
          <h1 className="text-4xl font-black text-white tracking-tight">ARENOVA</h1>
          <p className="text-blue-200/70 text-sm mt-1 tracking-widest uppercase font-medium">Admin Portal</p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-8 relative z-10">
          {[
            { icon: <Users className="h-4 w-4 text-[#F05A22]" />,  label: '3,841',  sub: 'Players'     },
            { icon: <Shield className="h-4 w-4 text-blue-300" />,   label: '48',     sub: 'Coaches'     },
            { icon: <Medal className="h-4 w-4 text-amber-400" />,   label: '5',      sub: 'Tournaments' },
          ].map(s => (
            <div key={s.sub} className="flex flex-col items-center bg-white/8 rounded-xl px-3 py-3 border border-white/10">
              {s.icon}
              <p className="text-white font-bold text-lg mt-1">{s.label}</p>
              <p className="text-blue-200/60 text-[10px]">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 w-full max-w-xs relative z-10">
          {[
            { icon: '🏆', text: 'Manage coaches & sports programs' },
            { icon: '📅', text: 'Full booking lifecycle control'   },
            { icon: '🏟️', text: 'Tournaments, venues & community'  },
            { icon: '🔒', text: 'Role-based access control'        },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3 bg-white/8 border border-white/10 rounded-xl px-4 py-2.5">
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              <span className="text-sm text-blue-100/80 font-medium">{f.text}</span>
            </div>
          ))}
        </div>


      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0e0f11]">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={logo} alt="Arenova Logo" className="h-10 w-auto object-contain" />
            <div>
              <p className="text-lg font-black text-white">ARENOVA</p>
              <p className="text-xs text-[#5c6370]">Admin Portal</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-sm text-[#5c6370] mt-1">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9ba3af] mb-1.5">Email Address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="super@arenova.in" required className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9ba3af] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password" required className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5c6370] hover:text-white">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
                <span className="text-red-400 text-xs">⚠ {error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full h-11 flex items-center justify-center gap-2 mt-2">
              {loading
                ? <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : <><Shield className="h-4 w-4" /> Sign In to Admin Panel</>
              }
            </button>
          </form>



          <p className="text-center text-[11px] text-[#5c6370] mt-6">
            ARENOVA Admin Panel v1.0 · For authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
