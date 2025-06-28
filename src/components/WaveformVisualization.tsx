import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface WaveformVisualizationProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  className?: string;
}

const WaveformVisualization: React.FC<WaveformVisualizationProps> = ({
  audioUrl,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateWaveform();
  }, [audioUrl]);

  useEffect(() => {
    drawWaveform();
  }, [waveformData, currentTime, isPlaying]);

  const generateWaveform = async () => {
    try {
      setIsLoading(true);
      
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Fetch audio data
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get channel data
      const channelData = audioBuffer.getChannelData(0);
      const samples = 200; // Number of bars in waveform
      const blockSize = Math.floor(channelData.length / samples);
      const waveform: number[] = [];
      
      // Process audio data into waveform
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j]);
        }
        waveform.push(sum / blockSize);
      }
      
      // Normalize waveform data
      const maxValue = Math.max(...waveform);
      const normalizedWaveform = waveform.map(value => value / maxValue);
      
      setWaveformData(normalizedWaveform);
      setIsLoading(false);
      
      // Clean up
      audioContext.close();
    } catch (error) {
      console.error('Error generating waveform:', error);
      // Generate dummy waveform data as fallback
      const dummyData = Array.from({ length: 200 }, () => Math.random() * 0.8 + 0.1);
      setWaveformData(dummyData);
      setIsLoading(false);
    }
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const barWidth = width / waveformData.length;
    const progress = duration > 0 ? currentTime / duration : 0;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform bars
    waveformData.forEach((amplitude, index) => {
      const barHeight = amplitude * height * 0.8;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;

      // Determine bar color based on progress
      const barProgress = index / waveformData.length;
      const isPlayed = barProgress <= progress;
      
      ctx.fillStyle = isPlayed 
        ? 'hsl(var(--primary))' 
        : 'hsl(var(--muted-foreground))';
      
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    // Draw progress line
    if (progress > 0) {
      const progressX = progress * width;
      ctx.strokeStyle = 'hsl(var(--primary))';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, height);
      ctx.stroke();
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const progress = x / canvas.width;
    const newTime = progress * duration;
    
    onSeek(Math.max(0, Math.min(newTime, duration)));
  };

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        width={400}
        height={60}
        className="w-full h-15 cursor-pointer rounded border"
        onClick={handleClick}
        style={{ imageRendering: 'pixelated' }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            Generating waveform...
          </div>
        </div>
      )}
    </div>
  );
};

export default WaveformVisualization;