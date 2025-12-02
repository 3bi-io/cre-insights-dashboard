import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Client for auth verification
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Client with service role for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { action, agentId, conversationId } = await req.json();

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    switch (action) {
      case 'list_conversations': {
        // Fetch conversations from ElevenLabs API
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agentId}`,
          {
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          // Handle agent not found gracefully
          if (response.status === 404 || errorText.includes('document_not_found')) {
            console.warn(`Agent ${agentId} not found in ElevenLabs - may have been deleted`);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'agent_not_found',
                message: `Agent ${agentId} was not found in ElevenLabs. It may have been deleted or the ID is incorrect.`,
                conversations: { conversations: [] }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          throw new Error(`ElevenLabs API error: ${errorText}`);
        }

        const conversations = await response.json();

        // Get the voice_agent record to find organization_id and voice_agent_id
        const { data: voiceAgent } = await supabase
          .from('voice_agents')
          .select('id, organization_id')
          .eq('elevenlabs_agent_id', agentId)
          .single();

        if (!voiceAgent) {
          throw new Error(`Voice agent not found for agent ID: ${agentId}`);
        }

        // Store conversations in database
        let syncedCount = 0;
        for (const conv of conversations.conversations || []) {
          const { error: upsertError } = await supabase
            .from('elevenlabs_conversations')
            .upsert({
              conversation_id: conv.conversation_id,
              agent_id: agentId,
              voice_agent_id: voiceAgent.id,
              organization_id: voiceAgent.organization_id,
              status: conv.status || 'completed',
              started_at: conv.start_time,
              ended_at: conv.end_time,
              duration_seconds: conv.duration,
              metadata: conv.metadata || {},
            }, {
              onConflict: 'conversation_id'
            });
          
          if (upsertError) {
            console.error(`Failed to upsert conversation ${conv.conversation_id}:`, upsertError);
          } else {
            syncedCount++;
          }
        }

        console.log(`Synced ${syncedCount} conversations for agent ${agentId}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            conversations,
            message: `Successfully synced ${syncedCount} conversation(s)` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_transcript': {
        // Fetch transcript from ElevenLabs API
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
          {
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${await response.text()}`);
        }

        const data = await response.json();

        // Get the conversation record
        const { data: conversation } = await supabase
          .from('elevenlabs_conversations')
          .select('id')
          .eq('conversation_id', conversationId)
          .single();

        if (conversation && data.transcript) {
          // Store transcript messages
          for (let i = 0; i < data.transcript.length; i++) {
            const msg = data.transcript[i];
            await supabase
              .from('elevenlabs_transcripts')
              .insert({
                conversation_id: conversation.id,
                speaker: msg.role || msg.speaker,
                message: msg.message || msg.text,
                sequence_number: i,
                timestamp: msg.timestamp,
                confidence_score: msg.confidence,
                metadata: msg.metadata || {},
              });
          }
        }

        return new Response(
          JSON.stringify({ success: true, transcript: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_audio': {
        // Fetch audio recording from ElevenLabs API
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
          {
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${await response.text()}`);
        }

        const audioBuffer = await response.arrayBuffer();
        
        // Get the conversation record
        const { data: conversation } = await supabase
          .from('elevenlabs_conversations')
          .select('id')
          .eq('conversation_id', conversationId)
          .single();

        if (conversation) {
          // Store audio reference
          await supabase
            .from('elevenlabs_audio')
            .insert({
              conversation_id: conversation.id,
              audio_url: `conversations/${conversationId}/audio.mp3`,
              file_size_bytes: audioBuffer.byteLength,
              format: 'mp3',
            });
        }

        return new Response(audioBuffer, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `attachment; filename="conversation-${conversationId}.mp3"`,
          },
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
