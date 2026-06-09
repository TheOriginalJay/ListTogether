import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ClipboardList, Chrome } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp, signInGoogle } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthColors = ['bg-brand-red', 'bg-brand-orange', 'bg-amber', 'bg-brand-green'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName || fullName.length < 2) errs.fullName = 'Name must be at least 2 characters';
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Minimum 8 characters';
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
      showToast('Your 5-day trial has started!', 'success');
      navigate('/dashboard');
    }
  };

  const pwdStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal">Create your account</h1>
          <p className="text-sm text-warm-600 mt-1">Start your 5-day free trial — no charge until it ends.</p>
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
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={e => { setFullName(e.target.value); setErrors(prev => ({ ...prev, fullName: '' })); }}
                className={`w-full input-field ${errors.fullName ? 'border-brand-red' : ''}`}
              />
              {errors.fullName && <p className="text-xs text-brand-red mt-1">{errors.fullName}</p>}
            </div>
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
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1">
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-colors ${
                          i < pwdStrength ? strengthColors[pwdStrength - 1] : 'bg-warm-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-warm-400 mt-1">
                    {pwdStrength > 0 ? strengthLabels[pwdStrength - 1] : ''}
                  </p>
                </div>
              )}
              {errors.password && <p className="text-xs text-brand-red mt-1">{errors.password}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-warm-400 mt-4">
            By signing up, you agree to our Terms and Privacy Policy
          </p>

          <p className="text-center text-sm text-warm-600 mt-4">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-amber font-medium hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
