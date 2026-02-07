/**
 * Audio Visualizer Hook
 * Uses Web Audio API to capture real-time frequency data for visualization
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface AudioVisualizerOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
}

interface AudioVisualizerReturn {
  frequencyData: Uint8Array;
  isAnalyzing: boolean;
  connectAudio: (audioElement: HTMLAudioElement) => void;
  disconnectAudio: () => void;
  isSupported: boolean;
}

export function useAudioVisualizer(options: AudioVisualizerOptions = {}): AudioVisualizerReturn {
  const { fftSize = 128, smoothingTimeConstant = 0.8 } = options;
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const connectedElementRef = useRef<HTMLAudioElement | null>(null);
  
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(fftSize / 2));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Check if Web Audio API is supported
  const isSupported = typeof window !== 'undefined' && 
    (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined');

  const analyze = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    setFrequencyData(dataArray);
    
    animationFrameRef.current = requestAnimationFrame(analyze);
  }, []);

  const connectAudio = useCallback((audioElement: HTMLAudioElement) => {
    if (!isSupported) {
      console.warn('Web Audio API is not supported in this browser');
      return;
    }

    // Avoid reconnecting the same element
    if (connectedElementRef.current === audioElement && audioContextRef.current) {
      return;
    }

    try {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }

      // Resume context if suspended (required after user interaction)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      // Create analyser if it doesn't exist
      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = fftSize;
        analyserRef.current.smoothingTimeConstant = smoothingTimeConstant;
        analyserRef.current.connect(audioContextRef.current.destination);
      }

      // Create source node only if not already connected
      if (!sourceRef.current) {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
        sourceRef.current.connect(analyserRef.current);
      }

      connectedElementRef.current = audioElement;
      setIsAnalyzing(true);
      analyze();
    } catch (error) {
      console.error('Failed to connect audio for visualization:', error);
    }
  }, [isSupported, fftSize, smoothingTimeConstant, analyze]);

  const disconnectAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsAnalyzing(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    frequencyData,
    isAnalyzing,
    connectAudio,
    disconnectAudio,
    isSupported,
  };
}

export default useAudioVisualizer;
