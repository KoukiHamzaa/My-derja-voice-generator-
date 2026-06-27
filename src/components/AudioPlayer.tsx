import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, RotateCcw, VolumeX, Sparkles } from 'lucide-react';
import { GeneratedVoiceover } from '../types';

interface AudioPlayerProps {
  voiceover: GeneratedVoiceover;
}

export default function AudioPlayer({ voiceover }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Synchronize audio element settings
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate, voiceover.audioUrl]);

  // Handle source changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [voiceover.audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Audio playback failed", err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || voiceover.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const clickTime = pos * (duration || voiceover.duration);
    audioRef.current.currentTime = clickTime;
    setCurrentTime(clickTime);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Generate bar heights for a static audio waveform
  const numBars = 45;
  // Seed-based stable random heights for the waveform
  const getWaveformHeights = () => {
    const heights = [];
    let state = 7; // simple pseudo-random seed
    for (let i = 0; i < numBars; i++) {
      state = (state * 13 + 5) % 31;
      heights.push(15 + state * 2.5); // height between 15px and 92.5px
    }
    return heights;
  };
  const heights = getWaveformHeights();

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div id="audio-delivery-player" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      {/* Background radial soft gold glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <audio
        ref={audioRef}
        src={voiceover.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800/80 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 font-mono">
              Delivery Ready
            </span>
            <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-amber-500/20">
              {voiceover.gender === 'female' ? 'Female Voice' : 'Male Voice'}
            </span>
          </div>
          <h4 className="text-lg font-bold text-neutral-100 mt-1 flex items-center gap-2">
            Voiceover: <span className="text-amber-400">{voiceover.voiceName}</span>
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-mono">
            Tone: <span className="text-neutral-200 capitalize font-medium">{voiceover.tone}</span>
          </span>
          <span className="text-neutral-600">|</span>
          <span className="text-xs text-neutral-400 font-mono">
            Rate: <span className="text-neutral-200 font-medium">24kHz PCM</span>
          </span>
        </div>
      </div>

      {/* Animated Waveform Progress */}
      <div className="mb-6 relative h-24 flex items-end justify-between gap-[2px] bg-neutral-950/40 rounded-xl p-4 border border-neutral-800/40">
        {heights.map((height, idx) => {
          const barProgress = (idx / numBars) * 100;
          const isPlayed = progressPercent >= barProgress;
          return (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPlayed
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : 'bg-neutral-800'
              } ${isPlaying && isPlayed ? 'animate-pulse' : ''}`}
              style={{
                height: `${height}%`,
                opacity: isPlayed ? 1 : 0.4
              }}
            />
          );
        })}
      </div>

      {/* Time & Track Progress bar */}
      <div className="mb-6">
        <div
          ref={progressBarRef}
          onClick={handleProgressClick}
          className="h-2 w-full bg-neutral-800 rounded-full cursor-pointer relative overflow-hidden group hover:h-2.5 transition-all"
        >
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-neutral-400 font-mono mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || voiceover.duration)}</span>
        </div>
      </div>

      {/* Player Controls Panel */}
      <div className="flex flex-wrap items-center justify-between gap-5 bg-neutral-950/60 rounded-xl p-4 border border-neutral-800/50">
        <div className="flex items-center gap-3">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            id="play-pause-btn"
            className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            title="Reset Player"
            className="w-8 h-8 rounded-full border border-neutral-800 hover:bg-neutral-800 hover:text-white flex items-center justify-center text-neutral-400 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Adjustment */}
        <div className="flex items-center gap-2 bg-neutral-900 rounded-lg p-1 border border-neutral-800">
          {[0.75, 1.0, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              className={`text-xs px-2.5 py-1 rounded font-mono font-medium transition ${
                playbackRate === rate
                  ? 'bg-amber-500 text-neutral-950'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume & Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-neutral-400 hover:text-neutral-200 transition">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-16 accent-amber-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Download Audio */}
          <a
            href={voiceover.audioUrl}
            download={`tunisian_voiceover_${voiceover.voiceName.toLowerCase()}_${voiceover.gender}.wav`}
            id="download-voiceover-link"
            className="bg-neutral-800 border border-neutral-700 text-neutral-100 hover:bg-amber-500 hover:text-neutral-950 hover:border-amber-500 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" />
            Download WAV
          </a>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 text-xs text-amber-400/90 text-center">
        <Sparkles className="w-3.5 h-3.5 flex-shrink-0 animate-pulse text-amber-500" />
        <span>Generated with native conversational Tunisian Arabic dialect cadence. No robotic Fusha phrasing.</span>
      </div>
    </div>
  );
}
