import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingBag, ArrowRight, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email address';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) {
      showToast(result.error, 'error');
    } else {
      showToast('Welcome back', 'success');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-5 sm:px-6 py-12">
      <div className="w-full max-w-[380px]">
        {/* Brand */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 mb-10 group"
          aria-label="Go to home"
        >
          <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] flex items-center justify-center group-hover:bg-[#333] transition-colors">
            <ShoppingBag className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-semibold text-[#1A1A1A] text-lg">Bagged</span>
        </button>

        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] tracking-tight mb-2">Welcome back</h1>
        <p className="text-sm text-[#6B6B5F] mb-8">Sign in to your account</p>

        <div className="bg-white rounded-2xl border border-[#E5E5E0]/60 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4C4BC]" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                  className={`w-full bg-[#F5F5F0] rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-[#1A1A1A] placeholder:text-[#C4C4BC] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all ${errors.email ? 'ring-2 ring-red-200' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1.5 ml-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4C4BC]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                  className={`w-full bg-[#F5F5F0] rounded-xl pl-10 pr-11 py-3 text-sm font-medium text-[#1A1A1A] placeholder:text-[#C4C4BC] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all ${errors.password ? 'ring-2 ring-red-200' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#C4C4BC] hover:text-[#6B6B5F] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1.5 ml-1">{errors.password}</p>}
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full h-11 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#333] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B6B5F] mt-6">
          No account?{' '}
          <button onClick={() => navigate('/signup')} className="font-semibold text-[#D97706] hover:underline">
            Create one free
          </button>
        </p>
      </div>
    </div>
  );
}
