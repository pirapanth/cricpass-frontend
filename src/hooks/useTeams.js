import { useState, useEffect, useCallback, useRef } from 'react';
import { getTeamsWithRetry } from '../api';

/**
 * Shared React hook for safely loading CricPass teams with:
 * - Guaranteed `[]` array state invariant
 * - Automatic Render cold-start retry & exponential backoff
 * - Progressive wake-up status messaging for loading popups & banners
 */
export default function useTeams({ autoLoad = true } = {}) {
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(Boolean(autoLoad));
  const [teamsError, setTeamsError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading teams from server...');
  const [attempt, setAttempt] = useState(1);

  const activeControllerRef = useRef(null);
  const coldStartTimerRef = useRef(null);

  const clearTimersAndAbort = useCallback(() => {
    if (coldStartTimerRef.current) {
      clearTimeout(coldStartTimerRef.current);
      coldStartTimerRef.current = null;
    }
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
      activeControllerRef.current = null;
    }
  }, []);

  const runFetch = useCallback(async () => {
    clearTimersAndAbort();

    const controller = new AbortController();
    activeControllerRef.current = controller;

    // Show helpful cold-start explanation if Render server is taking >3.5s to wake up
    coldStartTimerRef.current = setTimeout(() => {
      if (!controller.signal.aborted) {
        setLoadingMessage('Waking up server / Loading teams... This may take 15-30s.');
      }
    }, 3500);

    try {
      const res = await getTeamsWithRetry({
        maxAttempts: 4,
        baseDelayMs: 2000,
        timeoutMs: 35000,
        signal: controller.signal,
        onStatusChange: ({ attempt: currentAttempt, message }) => {
          if (controller.signal.aborted) return;
          setAttempt(currentAttempt);
          if (currentAttempt > 1 && message) {
            setLoadingMessage(message);
          }
        },
      });

      if (controller.signal.aborted) return;

      const normalizedTeams = Array.isArray(res?.data) ? res.data : [];
      setTeams(normalizedTeams);
      setTeamsError(null);
    } catch (err) {
      if (
        controller.signal.aborted ||
        err?.isCanceled ||
        err?.name === 'AbortError' ||
        err?.name === 'CanceledError'
      ) {
        return;
      }
      console.error('Failed to load teams:', err);
      setTeamsError(
        err?.message || 'Unable to connect to CricPass server. The server may still be waking up.'
      );
    } finally {
      if (coldStartTimerRef.current) {
        clearTimeout(coldStartTimerRef.current);
        coldStartTimerRef.current = null;
      }
      if (!controller.signal.aborted) {
        setLoadingTeams(false);
      }
    }
  }, [clearTimersAndAbort]);

  useEffect(() => {
    if (!autoLoad) return undefined;

    // Defer async invocation one microtask tick to keep initial render clean for strict React hook rules
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) {
        runFetch();
      }
    });

    return () => {
      mounted = false;
      clearTimersAndAbort();
    };
  }, [autoLoad, runFetch, clearTimersAndAbort]);

  const reloadTeams = useCallback(() => {
    setLoadingTeams(true);
    setTeamsError(null);
    setAttempt(1);
    setLoadingMessage('Waking up server / Loading teams...');
    return runFetch();
  }, [runFetch]);

  return {
    teams: Array.isArray(teams) ? teams : [],
    loadingTeams,
    teamsError,
    loadingMessage,
    attempt,
    reloadTeams,
  };
}
