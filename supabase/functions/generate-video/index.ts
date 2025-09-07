import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ListingData {
  title: string;
  description: string;
  images: string[];
  price: string;
  address: string;
}

interface ProjectConfig {
  title: string;
  aspect: string;
  theme: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, listingData, projectConfig } = await req.json();

    if (!projectId || !listingData || !projectConfig) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Starting video generation for project:', projectId);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Start background video generation process
    EdgeRuntime.waitUntil(generateVideo(supabase, projectId, listingData, projectConfig));

    return new Response(
      JSON.stringify({ success: true, message: 'Video generation started' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error starting video generation:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to start video generation',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function generateVideo(
  supabase: any, 
  projectId: string, 
  listingData: ListingData, 
  projectConfig: ProjectConfig
) {
  try {
    console.log('Processing video generation for project:', projectId);

    // Update project status to rendering
    await supabase
      .from('projects')
      .update({ status: 'rendering' })
      .eq('id', projectId);

    // Store project assets (images from listing)
    if (listingData.images && listingData.images.length > 0) {
      const assets = listingData.images.map((url, index) => ({
        project_id: projectId,
        url: url,
        type: 'image',
        sort_order: index
      }));

      await supabase
        .from('assets')
        .insert(assets);

      console.log(`Stored ${assets.length} assets for project ${projectId}`);
    }

    // Simulate video generation process
    // In a real implementation, this would:
    // 1. Process the images (resize, format)
    // 2. Generate video script based on listing data
    // 3. Create video using AI tools
    // 4. Upload final video to storage
    
    await new Promise(resolve => setTimeout(resolve, 10000)); // Simulate 10 second processing

    // For demo purposes, mark as completed
    await supabase
      .from('projects')
      .update({ 
        status: 'done',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    console.log('Video generation completed for project:', projectId);

    // Log usage event
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (project) {
      await supabase
        .from('usage_events')
        .insert({
          user_id: project.user_id,
          project_id: projectId,
          type: 'video_generated',
          count: 1
        });

      // Decrement free clips remaining
      await supabase.rpc('decrement_trial_clips', { 
        user_id: project.user_id 
      });
    }

  } catch (error) {
    console.error('Error in video generation:', error);
    
    // Mark project as error
    await supabase
      .from('projects')
      .update({ 
        status: 'error',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);
  }
}