"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Download, Volume2, VolumeX } from "lucide-react";
import { extractAudioUrl } from "@/lib/output-helpers";
import { ErrorAlert } from "@/components/ui/error-alert";

interface AudioResultProps {
  output: unknown;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Deterministic heights so SSR and client match
const BAR_HEIGHTS = [
  38, 62, 48, 82, 55, 40, 74, 50, 66, 34,
  78, 44, 88, 52, 60, 42, 72, 56, 46, 84,
  36, 68, 50, 76, 42, 58, 44, 86, 54, 70,
  40, 64, 50, 78, 34, 82, 46, 62, 54, 72,
  38, 56, 48, 80, 44, 66, 52, 88, 42, 76,
];

export function AudioResult({ output }: AudioResultProps) {
  const url = extractAudioUrl(output);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    isPlaying ? audio.pause() : audio.play();
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = parseFloat(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    setMuted(!muted);
  }, [muted]);

  if (!url) {
    return (
      <ErrorAlert>Unable to extract audio from the model output.</ErrorAlert>
    );
  }

  const progress = duration > 0 ? currentTime / duration : 0;
  const progressPct = progress * 100;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-muted/60 to-muted/20">
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Waveform + scrubber */}
      <div className="relative px-4 pt-5 pb-3">
        {/* Waveform bars */}
        <div className="flex h-12 items-center gap-[2.5px]" aria-hidden>
          {BAR_HEIGHTS.map((h, i) => {
            const barProgress = i / BAR_HEIGHTS.length;
            const isPast = barProgress < progress;
            const isNear = Math.abs(barProgress - progress) < 0.04;
            return (
              <div
                key={i}
                className="w-1 shrink-0 rounded-full transition-colors duration-75"
                style={{
                  height: `${h}%`,
                  backgroundColor: isPast
                    ? isNear
                      ? "oklch(0.72 0.14 65 / 90%)"
                      : "oklch(0.72 0.14 65 / 55%)"
                    : "oklch(0.5 0 0 / 15%)",
                }}
              />
            );
          })}
        </div>

        {/* Invisible range input over waveform */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.01}
          value={currentTime}
          onChange={handleSeek}
          className="absolute inset-x-4 inset-y-0 h-full w-[calc(100%-2rem)] cursor-pointer opacity-0"
          aria-label="Seek audio"
          style={{ touchAction: "none" }}
        />
      </div>

      {/* Time display */}
      <div className="flex items-center justify-between px-4 pb-1 font-mono text-[11px] text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3 border-t border-black/[0.06] dark:border-white/[0.06] px-4 py-3">
        {/* Play / Pause */}
        <button
          type="button"
          onClick={toggle}
          className="brand-cta flex size-11 shrink-0 items-center justify-center rounded-full transition-all duration-150 active:scale-95"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-5" fill="currentColor" />
          ) : (
            <Play className="size-5 translate-x-0.5" fill="currentColor" />
          )}
        </button>

        {/* Progress bar */}
        <div className="relative flex h-1.5 flex-1 items-center">
          <div className="absolute inset-0 rounded-full bg-black/10 dark:bg-white/10" />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary/60 transition-[width]"
            style={{ width: `${progressPct}%` }}
          />
          {progress > 0 && (
            <div
              className="absolute size-3 -translate-x-1/2 rounded-full bg-primary shadow ring-2 ring-background"
              style={{ left: `${progressPct}%` }}
            />
          )}
        </div>

        {/* Mute */}
        <button
          type="button"
          onClick={toggleMute}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>

        {/* Download */}
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Download audio"
        >
          <Download className="size-4" />
        </a>
      </div>
    </div>
  );
}
