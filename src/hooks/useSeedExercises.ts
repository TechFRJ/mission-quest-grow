import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSeedExercises() {
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const seed = async () => {
      try {
        const { count } = await supabase
          .from('exercises')
          .select('id', { count: 'exact', head: true });

        if (count && count > 0) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase.functions.invoke('seed-exercises', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } catch (e) {
        console.error('Failed to seed exercises:', e);
      }
    };

    seed();
  }, []);
}
