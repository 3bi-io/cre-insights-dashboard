import { useState, useMemo } from 'react';
import { useElevenLabsVoices, ElevenLabsVoice } from '@/hooks/useElevenLabsAPI';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Play, Pause, Copy, Check, Volume2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export function VoiceLibrary() {
  const { data: voices, isLoading, error } = useElevenLabsVoices();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const categories = useMemo(() => {
    if (!voices) return [];
    const cats = new Set(voices.map(v => v.category));
    return Array.from(cats).sort();
  }, [voices]);

  const filteredVoices = useMemo(() => {
    if (!voices) return [];
    return voices.filter(voice => {
      const matchesSearch = search === '' || 
        voice.name.toLowerCase().includes(search.toLowerCase()) ||
        voice.description?.toLowerCase().includes(search.toLowerCase()) ||
        Object.values(voice.labels || {}).some(l => l.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = category === 'all' || voice.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [voices, search, category]);

  const handlePlayPreview = (voice: ElevenLabsVoice) => {
    if (playingVoiceId === voice.voice_id) {
      audioRef?.pause();
      setPlayingVoiceId(null);
      return;
    }

    if (audioRef) {
      audioRef.pause();
    }

    if (!voice.preview_url) {
      toast({ title: 'No preview available', variant: 'destructive' });
      return;
    }

    const audio = new Audio(voice.preview_url);
    audio.onended = () => setPlayingVoiceId(null);
    audio.onerror = () => {
      toast({ title: 'Failed to play preview', variant: 'destructive' });
      setPlayingVoiceId(null);
    };
    audio.play();
    setAudioRef(audio);
    setPlayingVoiceId(voice.voice_id);
  };

  const handleCopyId = async (voiceId: string) => {
    await navigator.clipboard.writeText(voiceId);
    setCopiedId(voiceId);
    toast({ title: 'Voice ID copied to clipboard' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Failed to load voices: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search voices by name, description, or labels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredVoices.length} of {voices?.length || 0} voices
      </div>

      <ScrollArea className="h-[600px]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVoices.map(voice => (
            <Card key={voice.voice_id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{voice.name}</h4>
                    <p className="text-xs text-muted-foreground capitalize">{voice.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePlayPreview(voice)}
                      disabled={!voice.preview_url}
                    >
                      {playingVoiceId === voice.voice_id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopyId(voice.voice_id)}
                    >
                      {copiedId === voice.voice_id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {voice.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {voice.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {Object.entries(voice.labels || {}).slice(0, 4).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="text-xs">
                      {value}
                    </Badge>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                  <Volume2 className="h-3 w-3" />
                  <code className="bg-muted px-1 rounded text-[10px] truncate flex-1">
                    {voice.voice_id}
                  </code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
