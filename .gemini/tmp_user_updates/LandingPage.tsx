import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingCart, Users, Wifi, CheckCircle2, ArrowRight, Zap, Lock, Globe } from 'lucide-react';
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
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bg-cream min-h-screen selection:bg-amber/20">
      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-cream/95 backdrop-blur-md border-b border-black/5 py-3' : 'py-6'
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-charcoal flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-extrabold text-charcoal tracking-tight">ListTogether</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/login')} className="text-sm font-semibold text-warm-600 hover:text-charcoal transition-colors">
              Sign in
            </button>
            <button onClick={() => navigate('/signup')} className="btn-primary py-2.5 px-5 text-sm">
              Start free trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber/10 border border-amber/20 text-amber text-xs font-bold tracking-widest uppercase mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
            Real-time household sync
          </div>

          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display font-extrabold text-charcoal leading-[0.92] tracking-tight mb-8">
            Grocery lists<br />
            <span className="text-amber">that keep up.</span>
          </h1>

          <p className="text-xl text-warm-600 leading-relaxed max-w-2xl mb-12">
            Shared shopping lists for households. Real-time sync, offline support, natural language input — no faff, just the list.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button onClick={() => navigate('/signup')} className="btn-primary flex items-center gap-2">
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/login')} className="text-sm font-semibold text-warm-600 hover:text-charcoal transition-colors">
              Already have an account →
            </button>
          </div>

          {/* Mini demo card */}
          <div className="mt-20 bg-white rounded-3xl border border-black/5 shadow-[0_8px_48px_rgba(17,24,39,0.06)] p-8 max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-warm-400">Live — 2 people editing</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Organic whole milk', qty: '2', cat: 'Dairy', checked: true },
                { name: 'Sourdough bread', qty: '1', cat: 'Bakery', checked: true },
                { name: 'Cherry tomatoes', qty: '1 pint', cat: 'Produce', checked: false },
                { name: 'Cheddar cheese', qty: '200g', cat: 'Dairy', checked: false },
                { name: 'Chicken thighs', qty: '1 kg', cat: 'Meat', checked: false },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-4 py-3 px-4 rounded-2xl transition-colors ${item.checked ? 'opacity-40' : 'hover:bg-warm-50'}`}>
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                    item.checked ? 'bg-amber border-amber' : 'border-warm-200'
                  }`}>
                    {item.checked && <CheckCircle2 className="w-3.5 h-3.5 text-white fill-white" />}
                  </div>
                  <span className={`flex-1 font-semibold text-charcoal ${item.checked ? 'line-through text-warm-400' : ''}`}>{item.name}</span>
                  <span className="text-xs font-bold text-warm-300 bg-warm-50 px-2.5 py-1 rounded-full">{item.qty}</span>
                  <span className="text-xs text-warm-400">{item.cat}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-warm-100 flex items-center justify-between">
              <span className="text-xs text-warm-400 font-medium">2 of 5 items checked</span>
              <span className="text-lg font-display font-extrabold text-charcoal">Est. $28.40</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white border-y border-black/5">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm-400 mb-4">What's included</p>
          <h2 className="text-4xl font-display font-extrabold text-charcoal mb-16 tracking-tight max-w-xl">
            Everything a household actually needs.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {FEATURES.map((feat, i) => (
              <div key={i} className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-amber/10 flex items-center justify-center">
                  <feat.icon className="w-5 h-5 text-amber" />
                </div>
                <h3 className="text-lg font-display font-bold text-charcoal">{feat.title}</h3>
                <p className="text-sm text-warm-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How sharing works */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm-400 mb-4">Sharing</p>
            <h2 className="text-4xl font-display font-extrabold text-charcoal mb-6 tracking-tight">
              Three ways to share a list.
            </h2>
            <div className="space-y-6">
              {[
                { icon: Lock, label: 'Private', desc: 'Only you can see it.' },
                { icon: Users, label: 'Invite code', desc: 'Share a 6-digit code with anyone you trust. They edit in real time alongside you.' },
                { icon: Globe, label: 'View-only link', desc: 'Anyone with the link can read the list — no sign-up required.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-4.5 h-4.5 text-charcoal" />
                  </div>
                  <div>
                    <p className="font-bold text-charcoal">{item.label}</p>
                    <p className="text-sm text-warm-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-black/5 p-8 shadow-[0_4px_32px_rgba(17,24,39,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm-400 mb-6">Invite via code</p>
            <div className="bg-warm-50 rounded-2xl p-8 text-center mb-6">
              <span className="text-5xl font-display font-extrabold text-charcoal tracking-[0.3em]">K7MN2P</span>
            </div>
            <p className="text-sm text-warm-500 text-center">Share this code. They enter it, and they're instantly editing with you — no email invite, no account setup required.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-charcoal">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber/60 mb-4">Pricing</p>
            <h2 className="text-4xl font-display font-extrabold text-white tracking-tight mb-4">Simple. No tiers.</h2>
            <p className="text-warm-400">One flat price. All features. No ads, no data selling.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <div key={i} className={`rounded-3xl p-8 ${plan.highlight ? 'bg-amber' : 'bg-white/5 border border-white/10'}`}>
                <p className={`text-xs font-bold uppercase tracking-[0.15em] mb-4 ${plan.highlight ? 'text-amber-deep' : 'text-warm-400'}`}>{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-4xl font-display font-extrabold ${plan.highlight ? 'text-white' : 'text-white'}`}>{plan.price}</span>
                  {plan.period && <span className={`text-sm font-medium ${plan.highlight ? 'text-white/70' : 'text-warm-400'}`}>{plan.period}</span>}
                </div>
                <p className={`text-sm mb-8 ${plan.highlight ? 'text-white/80' : 'text-warm-400'}`}>{plan.desc}</p>
                <button
                  onClick={() => navigate('/signup')}
                  className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${
                    plan.highlight
                      ? 'bg-white text-amber hover:bg-warm-100'
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
      <footer className="py-16 px-6 border-t border-black/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-charcoal flex items-center justify-center">
                <ShoppingCart className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display font-bold text-charcoal">ListTogether</span>
            </div>
            <p className="text-sm text-warm-500 max-w-xs">Shared shopping lists for households that value their time.</p>
          </div>
          <div className="grid grid-cols-2 gap-12 text-sm">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-charcoal">Product</p>
              <button onClick={() => navigate('/signup')} className="block text-warm-500 hover:text-amber transition-colors">Sign up</button>
              <button onClick={() => navigate('/login')} className="block text-warm-500 hover:text-amber transition-colors">Sign in</button>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-charcoal">Legal</p>
              <button className="block text-warm-500 hover:text-amber transition-colors">Privacy</button>
              <button className="block text-warm-500 hover:text-amber transition-colors">Terms</button>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-black/5 flex justify-between">
          <p className="text-xs text-warm-400">© 2026 ListTogether</p>
        </div>
      </footer>
    </div>
  );
}
