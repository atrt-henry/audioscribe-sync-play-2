import React from 'react';
import FileUpload from './FileUpload';
import AudioControls from './AudioControls';
import TranscriptDisplay from './TranscriptDisplay';
import AudioElement from './AudioElement';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const AudioPlayer: React.FC = () => {
  const {
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
  } = useAudioPlayer();

  return (
    <div className="audio-player-container">
      <AudioElement
        audioRef={audioRef}
        src={audioSrc}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
      />
      
      <FileUpload
        onAudioUpload={handleAudioUpload}
        onSrtUpload={handleSrtUpload}
      />
      
      <TranscriptDisplay
        segments={segments}
        currentSegment={currentSegment}
        onSegmentClick={handleSegmentClick}
      />
      
      {audioSrc && (
        <AudioControls
          isPlaying={isPlaying}
          duration={duration}
          currentTime={currentTime}
          volume={volume}
          playbackRate={playbackRate}
          onPlayPause={handlePlayPause}
          onSkipBack={handleSkipBack}
          onSkipForward={handleSkipForward}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onRateChange={handleRateChange}
          isMuted={isMuted}
        />
      )}
    </div>
  );
};

export default AudioPlayer;