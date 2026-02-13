import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Download, Volume2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConversationAudioPlayerProps {
  conversationId: string;
  compact?: boolean;
}

export const ConversationAudioPlayer: React.FC<ConversationAudioPlayerProps> = ({
  conversationId,
  compact = false,
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      audioRef.current?.pause();
    };
  }, [audioUrl]);

  const loadAudio = useCallback(async () => {
    if (audioUrl) return;
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/elevenlabs-conversations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d2hjZHBwcGxkamxjYXh6c21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDg1NjAsImV4cCI6MjA2NTMyNDU2MH0._K3Se_I9Y5dGmV-42V4MJvj4AqSWouXRTXVArOVASdU',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'get_audio_stream',
            conversationId,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to fetch audio');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      audioRef.current = audio;
    } catch (error) {
      toast.error('Could not load audio recording');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, audioUrl]);

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateProgress);
      }
    }
  }, [isPlaying]);

  const togglePlay = async () => {
    if (!audioUrl) {
      await loadAudio();
      // Wait for audio to be ready then play
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 100);
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, updateProgress]);

  const handleSeek = (value: number[]) => {
    const time = value[0];
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleDownload = async () => {
    if (!audioUrl) await loadAudio();
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `conversation-${conversationId}.mp3`;
      a.click();
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlay}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        {audioUrl && (
          <>
            <div className="flex-1 min-w-[80px]">
              <Slider
                value={[currentTime]}
                max={duration || 1}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatTime(currentTime)}/{formatTime(duration)}
            </span>
          </>
        )}
        <Button variant="ghost" size="sm" onClick={handleDownload} disabled={isLoading}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlay}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1">
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>

        <span className="text-sm text-muted-foreground whitespace-nowrap min-w-[70px] text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <Button variant="ghost" size="icon" onClick={handleDownload} disabled={isLoading}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
