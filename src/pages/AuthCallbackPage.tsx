import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate('/login', { replace: true });
        return;
      }

      // Check if user profile exists, if not create one
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (!existing) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 5);
        
        await supabase.from('users').insert({
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
          subscription_status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString(),
        });
      }

      navigate('/dashboard', { replace: true });
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-amber border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-warm-600">Signing you in...</p>
      </div>
    </div>
  );
}
