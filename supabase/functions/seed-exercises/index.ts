import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if exercises already exist
    const { count } = await supabase
      .from('exercises')
      .select('id', { count: 'exact', head: true });

    if (count && count > 0) {
      return new Response(JSON.stringify({ message: 'Exercises already seeded', count }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch from GitHub
    const res = await fetch(
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
    );
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const text = await res.text();
    const data = JSON.parse(text);

    // Map and insert in batches of 100
    const exercises = data.map((e: any) => ({
      name: e.name,
      category: e.category || null,
      level: e.level || null,
      equipment: e.equipment || null,
      primary_muscles: e.primaryMuscles || [],
      secondary_muscles: e.secondaryMuscles || [],
      instructions: e.instructions || [],
      force: e.force || null,
      mechanic: e.mechanic || null,
    }));

    const batchSize = 100;
    let inserted = 0;
    for (let i = 0; i < exercises.length; i += batchSize) {
      const batch = exercises.slice(i, i + batchSize);
      const { error } = await supabase.from('exercises').insert(batch);
      if (error) throw error;
      inserted += batch.length;
    }

    return new Response(JSON.stringify({ message: 'Seeded successfully', inserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
