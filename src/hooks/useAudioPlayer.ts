
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { parseSRT, findCurrentSegment, SubtitleSegment } from '@/utils/srtParser';

export function useAudioPlayer() {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [currentSegment, setCurrentSegment] = useState<SubtitleSegment | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [audioSrc]);

  // Load saved preferences effect
  useEffect(() => {
    const savedVolume = localStorage.getItem('audioPlayer_volume');
    const savedPlaybackRate = localStorage.getItem('audioPlayer_playbackRate');
    
    if (savedVolume) {
      const parsedVolume = parseFloat(savedVolume);
      setVolume(parsedVolume);
      if (audioRef.current) {
        audioRef.current.volume = parsedVolume;
      }
    }
    
    if (savedPlaybackRate) {
      const parsedRate = parseFloat(savedPlaybackRate);
      setPlaybackRate(parsedRate);
      if (audioRef.current) {
        audioRef.current.playbackRate = parsedRate;
      }
    }
  }, []);

  // Save preferences effects
  useEffect(() => {
    localStorage.setItem('audioPlayer_volume', volume.toString());
  }, [volume]);
  
  useEffect(() => {
    localStorage.setItem('audioPlayer_playbackRate', playbackRate.toString());
  }, [playbackRate]);

  const handleAudioUpload = (file: File) => {
    if (audioSrc) {
      URL.revokeObjectURL(audioSrc);
    }
    
    const url = URL.createObjectURL(file);
    setAudioSrc(url);
    setIsPlaying(false);
    setCurrentTime(0);
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSrtUpload = async (file: File) => {
    try {
      const content = await file.text();
      const parsedSegments = parseSRT(content);
      
      if (parsedSegments.length === 0) {
        toast.error('Could not parse any segments from the SRT file');
        return;
      }
      
      setSegments(parsedSegments);
      setCurrentSegment(null);
      toast.success(`Loaded ${parsedSegments.length} transcript segments`);
    } catch (error) {
      console.error('Error parsing SRT file', error);
      toast.error('Failed to parse the SRT file');
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    
    const time = audioRef.current.currentTime;
    setCurrentTime(time);
    
    if (segments.length > 0) {
      const segment = findCurrentSegment(segments, time);
      setCurrentSegment(segment);
    }
    
    animationRef.current = requestAnimationFrame(handleTimeUpdate);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    
    setDuration(audioRef.current.duration);
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleSkipBack = () => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleSkipForward = () => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = Math.min(
      audioRef.current.duration,
      audioRef.current.currentTime + 5
    );
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleSeek = (time: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!audioRef.current) return;
    
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      audioRef.current.muted = false;
    }
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    audioRef.current.muted = newMutedState;
  };

  const handleRateChange = (rate: number) => {
    if (!audioRef.current) return;
    
    setPlaybackRate(rate);
    audioRef.current.playbackRate = rate;
  };

  const handleSegmentClick = (segment: SubtitleSegment) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = segment.startTime;
    setCurrentTime(segment.startTime);
    
    if (!isPlaying) {
      handlePlayPause();
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    animationRef.current = requestAnimationFrame(handleTimeUpdate);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  return {
    audioRef,
    audioSrc,
    isPlaying,
    duration,
    currentTime,
    volume,
    isMuted,
    playbackRate,
    segments,
    currentSegment,
    handleAudioUpload,
    handleSrtUpload,
    handlePlayPause,
    handleLoadedMetadata,
    handlePlay,
    handlePause,
    handleEnded,
    handleSkipBack,
    handleSkipForward,
    handleSeek,
    handleVolumeChange,
    handleToggleMute,
    handleRateChange,
    handleSegmentClick
  };
}
