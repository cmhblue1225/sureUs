"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseBackgroundMusicOptions {
  src: string;
  volume?: number;
  loop?: boolean;
}

interface UseBackgroundMusicReturn {
  isPlaying: boolean;
  isMuted: boolean;
  hasInteracted: boolean;
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
}

export function useBackgroundMusic({
  src,
  volume = 0.3,
  loop = true,
}: UseBackgroundMusicOptions): UseBackgroundMusicReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Initialize audio element
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = volume;
    audio.preload = "auto";
    audioRef.current = audio;

    // Event listeners
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      if (!loop) setIsPlaying(false);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    // Cleanup
    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [src, loop, volume]);

  // Try to auto-play on first user interaction
  useEffect(() => {
    if (typeof window === "undefined" || hasInteracted) return;

    const handleFirstInteraction = async () => {
      if (audioRef.current && !hasInteracted) {
        setHasInteracted(true);
        try {
          await audioRef.current.play();
        } catch {
          // Autoplay was prevented, user needs to click play manually
          console.log("Autoplay prevented by browser policy");
        }
      }
    };

    // Listen for any user interaction
    const events = ["click", "touchstart", "keydown"];
    events.forEach((event) => {
      document.addEventListener(event, handleFirstInteraction, { once: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleFirstInteraction);
      });
    };
  }, [hasInteracted]);

  const play = useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setHasInteracted(true);
      } catch (error) {
        console.error("Failed to play audio:", error);
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const setVolume = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
    }
  }, []);

  return {
    isPlaying,
    isMuted,
    hasInteracted,
    play,
    pause,
    toggle,
    toggleMute,
    setVolume,
  };
}
