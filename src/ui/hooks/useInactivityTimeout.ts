import { useEffect, useRef, useCallback, useState } from 'react';
import { debug } from '../../lib/debug';

const log = debug.ui;

const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

export interface UseInactivityTimeoutOptions {
  /**
   * Timeout duration in milliseconds. Defaults to 20 minutes.
   */
  timeoutMs?: number;
  /**
   * Called when the inactivity timeout expires.
   */
  onTimeout: () => void;
  /**
   * Whether the timeout is enabled. When false, timer is paused.
   */
  enabled?: boolean;
}

export interface UseInactivityTimeoutResult {
  /**
   * Call this to reset the inactivity timer (e.g., on user interaction).
   */
  resetActivity: () => void;
  /**
   * Time remaining until timeout in milliseconds.
   */
  timeRemaining: number;
  /**
   * Whether the timeout is currently active.
   */
  isActive: boolean;
}

/**
 * Hook to track user inactivity and trigger a callback after a timeout period.
 *
 * Activity signals should call `resetActivity()` to reset the timer.
 * When the timer expires, `onTimeout` is called.
 */
export function useInactivityTimeout(
  options: UseInactivityTimeoutOptions
): UseInactivityTimeoutResult {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, onTimeout, enabled = true } = options;

  const [timeRemaining, setTimeRemaining] = useState(timeoutMs);
  const [isActive, setIsActive] = useState(enabled);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const onTimeoutRef = useRef(onTimeout);

  // Keep callback ref up to date
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start or restart the timer
  const startTimer = useCallback(() => {
    clearTimers();

    lastActivityRef.current = Date.now();
    setTimeRemaining(timeoutMs);
    setIsActive(true);

    log('Inactivity timer started: %d minutes', timeoutMs / 60000);

    // Main timeout
    timeoutRef.current = setTimeout(() => {
      log('Inactivity timeout expired - calling shutdown');
      console.log(
        '[Lensor] Inactivity timeout expired after %d minutes',
        timeoutMs / 60000
      );
      setIsActive(false);
      onTimeoutRef.current();
    }, timeoutMs);

    // Update remaining time every second (for UI display if needed)
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, timeoutMs - elapsed);
      setTimeRemaining(remaining);
    }, 1000);
  }, [timeoutMs, clearTimers]);

  // Reset activity - restarts the timer
  const resetActivity = useCallback(() => {
    if (!enabled) return;

    log('Activity detected, resetting inactivity timer');
    startTimer();
  }, [enabled, startTimer]);

  // Start timer when enabled, clear when disabled
  useEffect(() => {
    if (enabled) {
      startTimer();
    } else {
      clearTimers();
      setIsActive(false);
    }

    return clearTimers;
  }, [enabled, startTimer, clearTimers]);

  // Pause timer when tab is hidden, resume when visible
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        log('Tab hidden, pausing inactivity timer');
        // When tab is hidden, we keep the timer running
        // but could optionally accelerate it here
      } else {
        log('Tab visible, activity detected');
        // When tab becomes visible again, reset the timer
        // This gives the user a fresh timeout when they return
        resetActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, resetActivity]);

  return {
    resetActivity,
    timeRemaining,
    isActive
  };
}
