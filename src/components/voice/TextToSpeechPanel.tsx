import { useState, useRef, useEffect } from 'react';
import { useElevenLabsVoices, useElevenLabsModels, useTextToSpeech } from '@/hooks/useElevenLabsAPI';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Play, Download, Volume2, StopCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const TTS_MODELS = [
  { id: 'eleven_flash_v2_5', name: 'Flash v2.5 (Fastest)', description: 'Ultra-low latency, newest' },
  { id: 'eleven_multilingual_v2', name: 'Multilingual v2', description: 'Most life-like, 29 languages' },
  { id: 'eleven_turbo_v2_5', name: 'Turbo v2.5', description: 'Low latency, 32 languages' },
  { id: 'eleven_turbo_v2', name: 'Turbo v2', description: 'English only, fast' },
  { id: 'eleven_monolingual_v1', name: 'English v1', description: 'Legacy English model' },
];

export function TextToSpeechPanel() {
  const { data: voices, isLoading: voicesLoading } = useElevenLabsVoices();
  const textToSpeech = useTextToSpeech();
  
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [modelId, setModelId] = useState('eleven_multilingual_v2');
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [style, setStyle] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleGenerate = async () => {
    if (!voiceId || !text.trim()) return;

    const result = await textToSpeech.mutateAsync({
      voiceId,
      text: text.trim(),
      modelId,
      voiceSettings: {
        stability,
        similarity_boost: similarityBoost,
        style,
        use_speaker_boost: true,
      },
    });

    // Convert base64 to blob
    const byteCharacters = atob(result.audio);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/mpeg' });
    
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
  };

  const handlePlay = () => {
    if (!audioUrl) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlaying(false);
    audio.play();
    audioRef.current = audio;
    setIsPlaying(true);
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `tts_${Date.now()}.mp3`;
    a.click();
  };

  const characterCount = text.length;
  const selectedVoice = voices?.find(v => v.voice_id === voiceId);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Text to Speech
          </CardTitle>
          <CardDescription>
            Convert text to natural speech using ElevenLabs voices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Text</Label>
            <Textarea
              id="text"
              placeholder="Enter text to convert to speech..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[150px]"
            />
            <div className="text-xs text-muted-foreground text-right">
              {characterCount} characters
            </div>
          </div>

          <div className="space-y-2">
            <Label>Voice</Label>
            <Select value={voiceId} onValueChange={setVoiceId} disabled={voicesLoading}>
              <SelectTrigger>
                <SelectValue placeholder={voicesLoading ? "Loading voices..." : "Select a voice"} />
              </SelectTrigger>
              <SelectContent>
                {voices?.map(voice => (
                  <SelectItem key={voice.voice_id} value={voice.voice_id}>
                    {voice.name} ({voice.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVoice?.description && (
              <p className="text-xs text-muted-foreground">{selectedVoice.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TTS_MODELS.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name} - {model.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={!voiceId || !text.trim() || textToSpeech.isPending}
            className="w-full"
          >
            {textToSpeech.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Speech'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Voice Settings</CardTitle>
          <CardDescription>
            Fine-tune the voice output
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Stability</Label>
              <span className="text-sm text-muted-foreground">{stability.toFixed(2)}</span>
            </div>
            <Slider
              value={[stability]}
              onValueChange={([v]) => setStability(v)}
              min={0}
              max={1}
              step={0.01}
            />
            <p className="text-xs text-muted-foreground">
              Higher stability = more consistent, lower = more expressive
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Similarity Boost</Label>
              <span className="text-sm text-muted-foreground">{similarityBoost.toFixed(2)}</span>
            </div>
            <Slider
              value={[similarityBoost]}
              onValueChange={([v]) => setSimilarityBoost(v)}
              min={0}
              max={1}
              step={0.01}
            />
            <p className="text-xs text-muted-foreground">
              Higher = more similar to original voice
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Style</Label>
              <span className="text-sm text-muted-foreground">{style.toFixed(2)}</span>
            </div>
            <Slider
              value={[style]}
              onValueChange={([v]) => setStyle(v)}
              min={0}
              max={1}
              step={0.01}
            />
            <p className="text-xs text-muted-foreground">
              Higher = more expressive style exaggeration
            </p>
          </div>

          {audioUrl && (
            <div className="pt-4 border-t space-y-4">
              <h4 className="font-semibold">Generated Audio</h4>
              <div className="flex gap-2">
                <Button onClick={handlePlay} variant="outline" className="flex-1">
                  {isPlaying ? (
                    <>
                      <StopCircle className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </>
                  )}
                </Button>
                <Button onClick={handleDownload} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
