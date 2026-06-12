import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ClipboardList, Chrome } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { gsap } from 'gsap';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInGoogle, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
    
    gsap.from('.login-content > *', {
      y: 20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
    });
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email) errs.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email';
    if (!password) errs.password = 'Required';
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
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md login-content">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-charcoal flex items-center justify-center mx-auto mb-6 shadow-xl">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-extrabold text-charcoal tracking-tight">Welcome back</h1>
          <p className="text-sm font-medium text-warm-500 mt-2">Sign in to your household</p>
        </div>

        <div className="glass-panel rounded-[2.5rem] p-10">
          <button
            onClick={signInGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-black/5 rounded-2xl py-4 text-sm font-bold text-charcoal hover:bg-warm-50 hover:shadow-xl hover:shadow-charcoal/5 transition-all duration-300"
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-[1px] bg-black/5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-300">or</span>
            <div className="flex-1 h-[1px] bg-black/5" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-warm-500 ml-1">Email</label>
              <input
                type="email"
                placeholder="alex@household.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                className={`w-full input-field ${errors.email ? 'border-red-500/50' : ''}`}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-warm-500 ml-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
                className={`w-full input-field ${errors.password ? 'border-red-500/50' : ''}`}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs font-bold uppercase tracking-widest text-warm-400 mt-8">
            New here?{' '}
            <button onClick={() => navigate('/signup')} className="text-amber hover:underline">
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
