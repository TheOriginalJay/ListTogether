import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingCart, Users, Wifi, CheckCircle2, ArrowRight, Zap, Lock, Globe, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const FEATURES = [
  {
    icon: Zap,
    title: 'Natural language input',
    desc: 'Type "3 apples, 2% milk, bread" — items are parsed and categorised instantly.',
  },
  {
    icon: Users,
    title: 'Real-time collaboration',
    desc: 'Your partner checks off milk in the dairy aisle. You see it update before you reach produce.',
  },
  {
    icon: Wifi,
    title: 'Works offline',
    desc: 'Bad signal in the store? Changes queue locally and sync the moment you reconnect.',
  },
  {
    icon: CheckCircle2,
    title: 'Smart categories',
    desc: 'Items auto-group by aisle — produce, dairy, meat, pantry. Drag to reorder your way.',
  },
];

const PLANS = [
  {
    name: 'Free trial',
    price: '5 days',
    desc: 'Full access. No commitment.',
    highlight: false,
    cta: 'Start free trial',
  },
  {
    name: 'Monthly',
    price: '$4',
    period: '/mo',
    desc: 'All features, cancel anytime.',
    highlight: true,
    cta: 'Get started',
  },
  {
    name: 'Annual',
    price: '$36',
    period: '/yr',
    desc: 'Save 25% vs monthly.',
    highlight: false,
    cta: 'Get started',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bg-[#FAFAF8] min-h-screen selection:bg-[#D97706]/20">
      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-[#E5E5E0]/60 py-3' : 'py-5 sm:py-6'
      }`}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[#1A1A1A] tracking-tight text-lg">ListTogether</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-[#6B6B5F] hover:text-[#1A1A1A] transition-colors">
              Sign in
            </button>
            <button onClick={() => navigate('/signup')} className="h-9 sm:h-10 px-4 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#333] active:scale-95 transition-all">
              Start free trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 sm:pt-36 lg:pt-44 pb-16 sm:pb-24 px-5 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D97706]/10 border border-[#D97706]/20 text-[#D97706] text-xs font-semibold tracking-wide mb-6 sm:mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Real-time household sync
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#1A1A1A] leading-[1.1] tracking-tight mb-5 sm:mb-6">
            Grocery lists<br />
            <span className="text-[#D97706]">that keep up.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#6B6B5F] leading-relaxed max-w-xl mx-auto mb-8 sm:mb-10">
            Shared shopping lists for households. Real-time sync, offline support, natural language input — no faff, just the list.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button onClick={() => navigate('/signup')} className="h-12 sm:h-14 px-8 bg-[#1A1A1A] text-white rounded-2xl text-sm font-medium hover:bg-[#333] active:scale-95 transition-all flex items-center gap-2">
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/login')} className="h-12 sm:h-14 px-6 text-sm font-medium text-[#6B6B5F] hover:text-[#1A1A1A] transition-colors">
              Already have an account →
            </button>
          </div>
        </div>

        {/* Demo Card */}
        <div className="max-w-xl mx-auto mt-12 sm:mt-16">
          <div className="bg-white rounded-3xl border border-[#E5E5E0]/60 shadow-xl shadow-[#1A1A1A]/[0.04] p-5 sm:p-7">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Live — 2 people editing</span>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Organic whole milk', qty: '2', cat: 'Dairy', checked: true },
                { name: 'Sourdough bread', qty: '1', cat: 'Bakery', checked: true },
                { name: 'Cherry tomatoes', qty: '1 pint', cat: 'Produce', checked: false },
                { name: 'Cheddar cheese', qty: '200g', cat: 'Dairy', checked: false },
                { name: 'Chicken thighs', qty: '1 kg', cat: 'Meat', checked: false },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors ${item.checked ? 'opacity-40' : 'hover:bg-[#F5F5F0]'}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    item.checked ? 'bg-[#D97706] border-[#D97706]' : 'border-[#E5E5E0]'
                  }`}>
                    {item.checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`flex-1 font-medium text-sm text-[#1A1A1A] ${item.checked ? 'line-through text-[#9CA3AF]' : ''}`}>{item.name}</span>
                  <span className="text-xs font-semibold text-[#9CA3AF] bg-[#F5F5F0] px-2 py-0.5 rounded-md">{item.qty}</span>
                  <span className="text-xs text-[#C4C4BC]">{item.cat}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-[#E5E5E0]/60 flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF] font-medium">2 of 5 items checked</span>
              <span className="text-lg font-semibold text-[#1A1A1A]">Est. $28.40</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 px-5 sm:px-6 bg-white border-y border-[#E5E5E0]/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">What&apos;s included</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#1A1A1A] tracking-tight">
              Everything a household actually needs.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {FEATURES.map((feat, i) => (
              <div key={i} className="group">
                <div className="w-10 h-10 rounded-xl bg-[#D97706]/10 flex items-center justify-center mb-4 group-hover:bg-[#D97706]/15 transition-colors">
                  <feat.icon className="w-5 h-5 text-[#D97706]" />
                </div>
                <h3 className="text-base font-semibold text-[#1A1A1A] mb-1.5">{feat.title}</h3>
                <p className="text-sm text-[#6B6B5F] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sharing Section */}
      <section className="py-16 sm:py-24 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">Sharing</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] tracking-tight mb-6">
              Three ways to share a list.
            </h2>
            <div className="space-y-5">
              {[
                { icon: Lock, label: 'Private', desc: 'Only you can see it.' },
                { icon: Users, label: 'Invite code', desc: 'Share a 6-digit code with anyone you trust. They edit in real time alongside you.' },
                { icon: Globe, label: 'View-only link', desc: 'Anyone with the link can read the list — no sign-up required.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-4.5 h-4.5 text-[#1A1A1A]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1A] text-sm">{item.label}</p>
                    <p className="text-sm text-[#6B6B5F] mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-[#E5E5E0]/60 p-6 sm:p-8 shadow-xl shadow-[#1A1A1A]/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-5">Invite via code</p>
            <div className="bg-[#F5F5F0] rounded-2xl p-6 sm:p-8 text-center mb-5">
              <span className="text-4xl sm:text-5xl font-bold text-[#1A1A1A] tracking-[0.25em] font-mono">K7MN2P</span>
            </div>
            <p className="text-sm text-[#6B6B5F] text-center leading-relaxed">Share this code. They enter it, and they&apos;re instantly editing with you — no email invite, no account setup required.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-24 px-5 sm:px-6 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">Pricing</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-3">Simple. No tiers.</h2>
            <p className="text-[#6B6B5F]">One flat price. All features. No ads, no data selling.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {PLANS.map((plan, i) => (
              <div key={i} className={`rounded-2xl p-6 sm:p-8 ${plan.highlight ? 'bg-[#D97706]' : 'bg-white/5 border border-white/10'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-4 ${plan.highlight ? 'text-[#D97706]/70' : 'text-[#9CA3AF]'}`}>{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-3xl sm:text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-white'}`}>{plan.price}</span>
                  {plan.period && <span className={`text-sm font-medium ${plan.highlight ? 'text-white/60' : 'text-[#9CA3AF]'}`}>{plan.period}</span>}
                </div>
                <p className={`text-sm mb-6 sm:mb-8 ${plan.highlight ? 'text-white/70' : 'text-[#9CA3AF]'}`}>{plan.desc}</p>
                <button
                  onClick={() => navigate('/signup')}
                  className={`w-full h-11 rounded-xl font-medium text-sm transition-all active:scale-95 ${
                    plan.highlight
                      ? 'bg-white text-[#1A1A1A] hover:bg-[#F5F5F0]'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-16 px-5 sm:px-6 border-t border-[#E5E5E0]/60">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8 sm:gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                <ShoppingCart className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-[#1A1A1A]">ListTogether</span>
            </div>
            <p className="text-sm text-[#6B6B5F] max-w-xs leading-relaxed">Shared shopping lists for households that value their time.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-12 text-sm">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">Product</p>
              <button onClick={() => navigate('/signup')} className="block text-[#6B6B5F] hover:text-[#D97706] transition-colors">Sign up</button>
              <button onClick={() => navigate('/login')} className="block text-[#6B6B5F] hover:text-[#D97706] transition-colors">Sign in</button>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">Legal</p>
              <button className="block text-[#6B6B5F] hover:text-[#D97706] transition-colors">Privacy</button>
              <button className="block text-[#6B6B5F] hover:text-[#D97706] transition-colors">Terms</button>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-[#E5E5E0]/60 flex justify-between items-center">
          <p className="text-xs text-[#9CA3AF]">© 2026 ListTogether</p>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span className="text-xs text-[#9CA3AF]">Secure & private</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
