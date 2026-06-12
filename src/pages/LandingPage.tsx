import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ClipboardList, CheckCircle, ShoppingBasket, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  { icon: ShoppingBasket, text: 'Natural language input', desc: 'Type like you talk. We handle the rest.' },
  { icon: CheckCircle, text: 'Smart Categorization', desc: 'Auto-grouped for your grocery aisle.' },
  { icon: CheckCircle, text: 'Real-time Sync', desc: 'Always together, even when apart.' },
  { icon: CheckCircle, text: 'Offline Mode', desc: 'Works in every corner of the store.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Cinematic Entrance
    const ctx = gsap.context(() => {
      gsap.from('.hero-content > *', {
        y: 40,
        opacity: 0,
        duration: 1.2,
        stagger: 0.2,
        ease: 'expo.out',
      });

      gsap.from('.feature-card', {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 80%',
        },
        y: 60,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
      });
    });

    return () => ctx.revert();
  }, []);

  // Three.js Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    const geometry = new THREE.IcosahedronGeometry(2, 1);
    const material = new THREE.MeshPhongMaterial({
      color: 0xD97706,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      sphere.rotation.y += 0.002;
      sphere.rotation.x += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      gsap.to(sphere.position, {
        y: window.scrollY * -0.005,
        duration: 0.5,
      });
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="bg-background selection:bg-amber/20">
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-40" />

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 ${
        scrolled ? 'py-4 bg-white/80 backdrop-blur-md border-b border-border' : 'py-8'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-charcoal flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight text-charcoal">ListTogether</span>
          </div>
          
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('/login')} className="text-sm font-semibold text-warm-600 hover:text-charcoal transition-colors">
              Sign In
            </button>
            <button onClick={() => navigate('/signup')} className="btn-primary py-3 px-6 text-sm">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-20">
        <div className="max-w-4xl mx-auto text-center hero-content">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber/5 border border-amber/10 text-amber text-xs font-bold tracking-widest uppercase mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber"></span>
            </span>
            Now supporting real-time household sync
          </div>
          
          <h1 className="text-7xl sm:text-8xl font-display font-extrabold text-charcoal mb-8 tracking-tight leading-[0.95]">
            Shop in <span className="text-amber italic">perfect</span> rhythm.
          </h1>
          
          <p className="text-xl text-warm-600 mb-12 max-w-xl mx-auto leading-relaxed">
            The collaborative shopping experience designed for households that value time, clarity, and intentional living.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/signup')} className="btn-primary text-lg w-full sm:w-auto">
              Start Free Trial
            </button>
            <button className="flex items-center gap-2 px-8 py-4 text-charcoal font-semibold hover:gap-3 transition-all duration-300">
              See how it works <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      <section ref={featuresRef} className="py-32 px-6 bg-white border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            {FEATURES.map((feat, i) => (
              <div key={i} className="feature-card space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-warm-100 flex items-center justify-center mb-6">
                  <feat.icon className="w-6 h-6 text-charcoal" />
                </div>
                <h3 className="text-xl font-display font-bold text-charcoal">{feat.text}</h3>
                <p className="text-sm text-warm-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-charcoal rounded-[2.5rem] p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber/20 blur-[100px] -mr-48 -mt-48" />
          
          <div className="relative z-10 max-w-xl">
            <h2 className="text-5xl font-display font-bold text-white mb-6 leading-tight">
              Ready to reclaim your weekly rhythm?
            </h2>
            <p className="text-lg text-white/60 mb-10">
              Join 500+ households already shopping smarter. No ads, no data selling, just clarity.
            </p>
            <button onClick={() => navigate('/signup')} className="btn-primary bg-white text-charcoal shadow-none hover:bg-warm-100">
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

      <footer className="py-20 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-charcoal flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-charcoal">ListTogether</span>
            </div>
            <p className="text-sm text-warm-500 max-w-xs">
              Elevating the household shopping experience through intentional design and seamless collaboration.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-charcoal">Product</h4>
              <ul className="space-y-2 text-sm text-warm-500">
                <li><button className="hover:text-amber transition-colors">Features</button></li>
                <li><button className="hover:text-amber transition-colors">Pricing</button></li>
                <li><button className="hover:text-amber transition-colors">Mobile</button></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-charcoal">Company</h4>
              <ul className="space-y-2 text-sm text-warm-500">
                <li><button className="hover:text-amber transition-colors">Privacy</button></li>
                <li><button className="hover:text-amber transition-colors">Terms</button></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border flex justify-between items-center">
          <p className="text-xs text-warm-400">© 2026 ListTogether. Crafted with intent.</p>
          <div className="flex gap-4">
            {/* Social icons placeholder */}
          </div>
        </div>
      </footer>
    </div>
  );
}
