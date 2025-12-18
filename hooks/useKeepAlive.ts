"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Hook that plays silent audio to keep the PWA active when the screen is off.
 * This prevents mobile browsers from suspending the app during streaming responses.
 *
 * Uses Web Audio API to create an inaudible oscillator (gain = 0) that keeps
 * the audio context running, which signals to the browser that the app needs
 * to remain active.
 */
export function useKeepAlive() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  // Start silent audio playback
  const start = useCallback(() => {
    if (audioContextRef.current?.state === "running") {
      return; // Already running
    }

    try {
      // Create or resume audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }

      const ctx = audioContextRef.current;

      // Resume if suspended (required after user interaction on mobile)
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Create silent oscillator if not exists
      if (!oscillatorRef.current) {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Set gain to 0 (completely silent)
        gainNode.gain.value = 0;

        // Connect oscillator -> gain -> destination
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Use a low frequency to minimize CPU usage
        oscillator.frequency.value = 1;
        oscillator.type = "sine";

        oscillator.start();

        oscillatorRef.current = oscillator;
        gainNodeRef.current = gainNode;
      }

      setIsActive(true);
    } catch (error) {
      console.warn("[useKeepAlive] Failed to start silent audio:", error);
      setIsSupported(false);
    }
  }, []);

  // Stop silent audio playback
  const stop = useCallback(() => {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }

      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setIsActive(false);
    } catch (error) {
      console.warn("[useKeepAlive] Failed to stop silent audio:", error);
    }
  }, []);

  // Auto-start on first user interaction (required by mobile browsers)
  useEffect(() => {
    const handleInteraction = () => {
      start();
      // Remove listeners after first interaction
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };

    document.addEventListener("click", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);
    document.addEventListener("keydown", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  }, [start]);

  // Handle visibility changes - resume audio when app becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isActive,
    isSupported,
    start,
    stop,
  };
}
