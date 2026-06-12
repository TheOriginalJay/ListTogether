import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ClipboardList, CheckCircle, Users, Smartphone, ShoppingBasket } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import * as THREE from 'three';
import { DoubleSide } from 'three';

const FEATURES = [
  { icon: ShoppingBasket, text: 'Natural language input' },
  { icon: CheckCircle, text: 'Custom categories with drag reorder' },
  { icon: CheckCircle, text: 'Duplicate detection' },
  { icon: CheckCircle, text: 'Running estimated total' },
  { icon: CheckCircle, text: 'Three layout modes' },
  { icon: CheckCircle, text: 'Offline-first editing' },
];

const STEPS = [
  { icon: ClipboardList, title: 'Create a list', desc: 'Make a shopping list for any occasion — weekly groceries, party prep, or a Costco run.' },
  { icon: Users, title: 'Invite your household', desc: 'Share via 6-digit code or link. Co-shoppers edit in real time.' },
  { icon: Smartphone, title: 'Shop together', desc: 'Check off items, add forgotten ones, track your total — even offline.' },
];

const PRICING_FEATURES = [
  'Unlimited lists',
  'Unlimited collaborators',
  'Real-time sync',
  'Offline mode',
  'Natural language input',
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Three.js 3D Gallery
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.set(0, 0, 3.5);

    const scene = new THREE.Scene();
    const galleryGroup = new THREE.Group();
    scene.add(galleryGroup);

    // Placeholder colored planes instead of textures
    const colors = ['#D97706', '#FBBF24', '#FEF3C7', '#111827', '#374151'];
    const initialConfigs = [
      { pos: [-1.2, 0, 0], rot: [0, -0.6, 0] },
      { pos: [1.2, 0, 0], rot: [0, 0.4, 0] },
      { pos: [0, 0, 0], rot: [-0.2, 0, 0] },
      { pos: [0, -1, 0], rot: [0.2, 0, 0] },
      { pos: [0, 1, 0], rot: [0, 0, 0.2] },
    ];

    const meshes: THREE.Mesh[] = [];
    initialConfigs.forEach((config, i) => {
      const geometry = new THREE.PlaneGeometry(1, 1.3);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors[i]),
        side: DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...config.pos as [number, number, number]);
      mesh.rotation.set(...config.rot as [number, number, number]);
      galleryGroup.add(mesh);
      meshes.push(mesh);
    });

    // Mark as loaded after first render
    requestAnimationFrame(() => {
      setIsLoaded(true);
    });

    // Scroll-driven animation
    const handleScroll = () => {
      const progress = Math.min(window.scrollY / (document.documentElement.scrollHeight - window.innerHeight), 1);
      
      camera.position.z = 3.5 + (6.0 - 3.5) * progress;
      galleryGroup.position.y = -5.5 + (-1.8 - (-5.5)) * progress;
      
      meshes[0].rotation.y = -0.6 + 1.0 * progress;
      meshes[1].position.x = 1.2 + (-2.4) * progress;
      meshes[2].position.z = 0 + 3 * progress;
      meshes[2].rotation.x = -0.2 + 0.4 * progress;
      meshes[3].position.y = -1 + 2.5 * progress;
      meshes[4].rotation.z = 0.2 + (-0.4) * progress;
    };

    // Mouse parallax
    const mouse = { x: 0, y: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      
      // Mouse parallax lerp
      camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.1;
      camera.position.y += (-mouse.y * 0.5 - camera.position.y) * 0.1;
      
      renderer.render(scene, camera);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Navbar scroll detection
    const handleNavScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleNavScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleNavScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {!isLoaded && (
        <div className="fixed inset-0 z-[100] bg-cream flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-amber border-t-transparent rounded-full animate-spin" />
            <p className="text-charcoal font-medium animate-pulse">Initializing experience...</p>
          </div>
        </div>
      )}
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-charcoal">ListTogether</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-charcoal hover:text-amber transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="btn-primary text-sm py-2 px-4"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-16">
        <div className="text-center max-w-2xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl text-charcoal drop-shadow-sm">ListTogether</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-charcoal mb-4 drop-shadow-sm leading-tight">
            Shop together,<br />stay organized
          </h1>
          <p className="text-lg text-warm-600 mb-8 max-w-lg mx-auto">
            The collaborative shopping list that keeps your household in sync — online or offline.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="btn-primary text-lg py-4 px-8 shadow-[0_4px_16px_rgba(217,119,6,0.4)]"
          >
            Start Free Trial
          </button>
          <p className="text-sm text-warm-400 mt-4">
            5-day free trial, then $4.99/month
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 bg-cream py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-charcoal text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="bg-white rounded-xl p-8 shadow-card text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-pale flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-amber" />
                </div>
                <h3 className="font-semibold text-lg text-charcoal mb-2">{step.title}</h3>
                <p className="text-sm text-warm-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 bg-white py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-charcoal text-center mb-12">Everything you need</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((feat, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-amber shrink-0" />
                <span className="text-charcoal">{feat.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 bg-warm-100 py-20 px-4">
        <div className="max-w-sm mx-auto">
          <h2 className="text-3xl font-bold text-charcoal text-center mb-8">Simple pricing</h2>
          <div className="bg-white rounded-2xl p-8 shadow-[0_4px_16px_rgba(45,42,38,0.08)]">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-pale text-amber text-xs font-semibold mb-4">
              Monthly
            </span>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-extrabold text-charcoal">$4.99</span>
              <span className="text-warm-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {PRICING_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-charcoal">
                  <CheckCircle className="w-4 h-4 text-amber shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/signup')}
              className="w-full btn-primary text-center"
            >
              Start Free Trial
            </button>
            <p className="text-center text-xs text-warm-400 mt-3">
              5-day free trial, cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-charcoal py-12 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">ListTogether</span>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-white/60 mb-6">
            <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Terms of Service</button>
          </div>
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} ListTogether. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
