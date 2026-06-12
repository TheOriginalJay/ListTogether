import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingCart, ArrowRight, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp, signInGoogle, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState('');
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
    if (!fullName || fullName.length < 2) errs.fullName = 'At least 2 characters';
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email address';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'At least 8 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await signUp(email, password, fullName);
    setLoading(false);
    if (result.error) {
      showToast(result.error, 'error');
    } else {
      showToast('Account created — welcome!', 'success');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-5 sm:px-6 py-12">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
            <ShoppingCart className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-semibold text-[#1A1A1A] text-lg">ListTogether</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] tracking-tight mb-2">Create account</h1>
        <p className="text-sm text-[#6B6B5F] mb-8">5-day free trial, no card required</p>

        <div className="bg-white rounded-2xl border border-[#E5E5E0]/60 p-6 sm:p-8 shadow-sm">
          <button
            onClick={signInGoogle}
            className="w-full flex items-center justify-center gap-3 bg-[#F5F5F0] border border-[#E5E5E0] rounded-xl py-3 text-sm font-medium text-[#1A1A1A] hover:bg-[#E5E5E0] active:scale-[0.98] transition-all duration-200 mb-5"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#E5E5E0]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">or</span>
            <div className="flex-1 h-px bg-[#E5E5E0]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4C4BC]" />
                <input
                  type="text"
                  placeholder="Alex Rivera"
                  value={fullName}
                  onChange={e => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: '' })); }}
                  className={`w-full bg-[#F5F5F0] rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-[#1A1A1A] placeholder:text-[#C4C4BC] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all ${errors.fullName ? 'ring-2 ring-red-200' : ''}`}
                />
              </div>
              {errors.fullName && <p className="text-xs text-red-600 mt-1.5 ml-1">{errors.fullName}</p>}
            </div>

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
                  placeholder="Min. 8 characters"
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
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B6B5F] mt-6">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="font-semibold text-[#D97706] hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
