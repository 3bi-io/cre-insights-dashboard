/**
 * Audio Showcase Page
 * Immersive full-screen audio player with waveform visualization
 * Mobile-first, no navigation, premium music player experience
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAudioVisualizer } from '@/hooks/useAudioVisualizer';
import WaveformVisualizer from '@/components/audio/WaveformVisualizer';
import LogoIcon from '@/components/common/LogoIcon';
import voiceInterviewCover from '@/assets/audio/voice-interview-cover.jpg';

// Audio file mapping - hardcoded for now, can be database-driven later
const AUDIO_FILES: Record<string, string> = {
  'showcase': '/audio/showcase-conversation.mp3',
};

const AudioShowcasePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isMobile } = useResponsiveLayout();
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Audio visualizer
  const { frequencyData, connectAudio, isSupported } = useAudioVisualizer({
    fftSize: 128,
    smoothingTimeConstant: 0.85,
  });

  // Get audio source
  const audioSrc = id ? AUDIO_FILES[id] || AUDIO_FILES['showcase'] : AUDIO_FILES['showcase'];

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Connect audio visualizer on first interaction
  const handleFirstInteraction = useCallback(() => {
    if (!hasInteracted && audioRef.current && isSupported) {
      connectAudio(audioRef.current);
      setHasInteracted(true);
    }
  }, [hasInteracted, connectAudio, isSupported]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    handleFirstInteraction();

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  }, [isPlaying, handleFirstInteraction]);

  // Handle seek
  const handleSeek = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Format time display
  const formatTime = (time: number): string => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, currentTime - 10);
          }
          break;
        case 'ArrowRight':
          if (audioRef.current) {
            audioRef.current.currentTime = Math.min(duration, currentTime + 10);
          }
          break;
        case 'KeyM':
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleMute, currentTime, duration]);

  return (
    <div className="audio-showcase-bg fixed inset-0 h-[100dvh] w-full overflow-hidden flex flex-col">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        className="hidden"
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-lg mx-auto w-full">
        
        {/* Cover Art */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={cn(
            'relative rounded-2xl overflow-hidden shadow-2xl mb-8',
            'ring-1 ring-white/10',
            isMobile ? 'w-64 h-36' : 'w-80 h-44'
          )}
        >
          <img
            src={voiceInterviewCover}
            alt="Voice Interview - Driver and Recruiter conversation"
            className="w-full h-full object-cover"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Playing indicator */}
          {isPlaying && (
            <motion.div
              className="absolute bottom-3 right-3 flex items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-white text-xs font-medium uppercase tracking-wider">Playing</span>
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-white rounded-full"
                    animate={{
                      height: ['8px', '16px', '8px'],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Title */}
        <h1 className="text-white text-lg font-semibold mb-1 text-center">Voice Interview</h1>
        <p className="text-white/60 text-sm mb-6 text-center">Driver Recruitment Conversation</p>

        {/* Play/Pause Button */}
        <motion.button
          onClick={togglePlay}
          className={cn(
            'relative flex items-center justify-center rounded-full',
            'bg-white/10 backdrop-blur-md border border-white/20',
            'hover:bg-white/20 transition-all duration-300',
            'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent',
            isMobile ? 'w-20 h-20' : 'w-28 h-28'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <AnimatePresence mode="wait">
            {isPlaying ? (
              <motion.div
                key="pause"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Pause className={cn('text-white', isMobile ? 'w-8 h-8' : 'w-12 h-12')} />
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Play className={cn('text-white ml-1', isMobile ? 'w-8 h-8' : 'w-12 h-12')} />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Pulse ring when playing */}
          {isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white/30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </motion.button>

        {/* Waveform Visualizer */}
        <div className="w-full mt-8 mb-6">
          <WaveformVisualizer
            frequencyData={frequencyData}
            isPlaying={isPlaying}
            className="opacity-90"
          />
        </div>

        {/* Progress Slider */}
        <div className="w-full space-y-3">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="audio-progress-slider cursor-pointer"
            aria-label="Audio progress"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
          />
          
          {/* Time Display */}
          <div className="flex justify-between text-sm text-white/70 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Toggle */}
        <motion.button
          onClick={toggleMute}
          className={cn(
            'mt-6 flex items-center justify-center rounded-full',
            'w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/10',
            'hover:bg-white/20 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-white/30'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white/70" />
          ) : (
            <Volume2 className="w-5 h-5 text-white/70" />
          )}
        </motion.button>
      </div>

      {/* Branding Footer */}
      <div className={cn(
        'flex flex-col items-center gap-2 py-6',
        'pb-[max(1.5rem,env(safe-area-inset-bottom))]'
      )}>
        <div className="flex items-center gap-2 opacity-60 hover:opacity-80 transition-opacity">
          <LogoIcon size="sm" />
          <span className="text-white/80 text-sm font-medium">ATS.me</span>
        </div>
        <p className="text-white/40 text-xs">Powered by AI Voice Technology</p>
      </div>
    </div>
  );
};

export default AudioShowcasePage;
