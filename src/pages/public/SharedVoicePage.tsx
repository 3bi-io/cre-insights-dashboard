import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSharedConversation } from '@/hooks/useSharedConversation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Bot, 
  User, 
  Clock, 
  Calendar, 
  Copy, 
  Check,
  ArrowRight,
  AlertCircle,
  Headphones
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function SharedVoicePage() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const { data, isLoading, error } = useSharedConversation(shareCode);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeMessageIndex, setActiveMessageIndex] = useState(-1);

  const audioRef = useRef<HTMLAudioElement>(null);

  const conversation = data?.conversation;

  // Update current time and highlight active transcript message
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Find the active message based on current time
      if (conversation?.transcript) {
        const currentMs = audio.currentTime * 1000;
        let activeIndex = -1;
        
        for (let i = 0; i < conversation.transcript.length; i++) {
          const msgTime = new Date(conversation.transcript[i].timestamp).getTime();
          const startTime = new Date(conversation.started_at).getTime();
          const relativeTime = msgTime - startTime;
          
          if (relativeTime <= currentMs) {
            activeIndex = i;
          } else {
            break;
          }
        }
        setActiveMessageIndex(activeIndex);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setActiveMessageIndex(-1);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [conversation]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Conversation Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This conversation link may have expired or is no longer available.
          </p>
          <Link to="/jobs">
            <Button>
              Browse Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with organization branding */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <LogoAvatar size="sm" className="h-10 w-10">
              {conversation.organization.logo_url ? (
                <LogoAvatarImage 
                  src={conversation.organization.logo_url} 
                  alt={conversation.organization.name || 'Organization'} 
                />
              ) : (
                <LogoAvatarFallback>
                  <Headphones className="h-5 w-5 text-primary" />
                </LogoAvatarFallback>
              )}
            </LogoAvatar>
            <div>
              <h2 className="font-medium">
                {conversation.organization.name || 'Voice Conversation'}
              </h2>
              <p className="text-sm text-muted-foreground">Shared Voice Recording</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Conversation Info */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{conversation.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(conversation.started_at), 'PPP')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(conversation.duration_seconds)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bot className="h-4 w-4" />
              <span>{conversation.agent_name}</span>
            </div>
            <Badge variant="secondary">{conversation.status}</Badge>
          </div>
        </div>

        {/* Audio Player */}
        {conversation.audio_url && (
          <Card className="p-6 mb-8">
            <audio ref={audioRef} src={conversation.audio_url} preload="metadata" />
            
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="outline"
                onClick={togglePlay}
                className="h-12 w-12 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>

              <div className="flex-1 space-y-2">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
                className="h-10 w-10"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Transcript */}
        <Card className="mb-8">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Transcript
            </h3>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-4">
              {conversation.transcript.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No transcript available for this conversation.
                </p>
              ) : (
                conversation.transcript.map((message, index) => {
                  const isAgent = message.speaker === 'agent';
                  const isActive = index === activeMessageIndex;
                  
                  return (
                    <div
                      key={message.id || index}
                      className={`flex gap-3 transition-colors ${
                        isAgent ? 'flex-row' : 'flex-row-reverse'
                      } ${isActive ? 'bg-primary/5 -mx-2 px-2 py-1 rounded-lg' : ''}`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isAgent ? 'bg-primary/10' : 'bg-secondary'
                        }`}
                      >
                        {isAgent ? (
                          <Bot className="h-4 w-4 text-primary" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div className={`flex-1 ${!isAgent ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {isAgent ? 'Agent' : (conversation.hide_caller_info ? 'Caller' : 'User')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.timestamp), 'HH:mm:ss')}
                          </span>
                        </div>
                        <div
                          className={`inline-block max-w-[85%] p-3 rounded-lg ${
                            isAgent ? 'bg-muted' : 'bg-primary/10'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button variant="outline" onClick={handleCopyLink}>
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
          <Link to="/jobs">
            <Button>
              Browse Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Powered by{' '}
          <Link to="/" className="text-primary hover:underline">
            ATS.me
          </Link>
        </div>
      </footer>
    </div>
  );
}
