import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInGoogle, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
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
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        {/* Brand mark */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-lg bg-charcoal flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-extrabold text-charcoal">ListTogether</span>
        </div>

        <h1 className="text-3xl font-display font-extrabold text-charcoal tracking-tight mb-1">Welcome back</h1>
        <p className="text-sm text-warm-500 mb-8">Sign in to your account</p>

        <div className="bg-white rounded-3xl border border-black/5 p-8 shadow-[0_4px_24px_rgba(17,24,39,0.04)]">
          {/* Google */}
          <button
            onClick={signInGoogle}
            className="w-full flex items-center justify-center gap-3 bg-warm-50 border border-black/5 rounded-2xl py-3.5 text-sm font-bold text-charcoal hover:bg-warm-100 transition-all duration-200 mb-6"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-black/5" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-warm-300">or</span>
            <div className="flex-1 h-px bg-black/5" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-warm-500 mb-2">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                className={`w-full input-field ${errors.email ? 'border-red-400' : ''}`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-warm-500 mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                className={`w-full input-field ${errors.password ? 'border-red-400' : ''}`}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.password}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-warm-500 mt-6">
          No account?{' '}
          <button onClick={() => navigate('/signup')} className="font-bold text-amber hover:underline">
            Create one free
          </button>
        </p>
      </div>
    </div>
  );
}
