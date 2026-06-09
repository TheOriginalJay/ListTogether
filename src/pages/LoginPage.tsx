import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ClipboardList, Chrome } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInGoogle, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Minimum 6 characters';
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
      showToast('Welcome back!', 'success');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal">Welcome back</h1>
          <p className="text-sm text-warm-600 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-modal">
          <button
            onClick={signInGoogle}
            className="w-full flex items-center justify-center gap-2 bg-white border border-warm-200 rounded-full py-3 text-sm font-medium text-charcoal hover:shadow-[0_2px_8px_rgba(45,42,38,0.08)] transition-all duration-200"
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-warm-200" />
            <span className="text-xs text-warm-400">or</span>
            <div className="flex-1 h-px bg-warm-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                className={`w-full input-field ${errors.email ? 'border-brand-red' : ''}`}
              />
              {errors.email && <p className="text-xs text-brand-red mt-1">{errors.email}</p>}
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
                className={`w-full input-field ${errors.password ? 'border-brand-red' : ''}`}
              />
              {errors.password && <p className="text-xs text-brand-red mt-1">{errors.password}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-warm-600 mt-4">
            Don't have an account?{' '}
            <button onClick={() => navigate('/signup')} className="text-amber font-medium hover:underline">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
