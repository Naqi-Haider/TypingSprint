import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to track active play time for logged-in users
 * Tracks time when component is mounted and user is actively playing
 * Syncs accumulated time to backend periodically
 */
export const usePlayTimeTracker = (isPlaying = false) => {
  const { user, isLoggedIn } = useAuth();
  const startTimeRef = useRef(null);
  const accumulatedTimeRef = useRef(0);
  const syncIntervalRef = useRef(null);

  useEffect(() => {
    // Only track for logged-in users
    if (!isLoggedIn || !isPlaying) {
      // Stop tracking if user logs out or stops playing
      if (startTimeRef.current) {
        const sessionTime = (Date.now() - startTimeRef.current) / 1000 / 3600; // Convert to hours
        accumulatedTimeRef.current += sessionTime;
        startTimeRef.current = null;
      }
      return;
    }

    // Start tracking
    startTimeRef.current = Date.now();

    // Sync every 5 minutes
    syncIntervalRef.current = setInterval(async () => {
      if (startTimeRef.current) {
        const sessionTime = (Date.now() - startTimeRef.current) / 1000 / 3600;
        const totalTime = accumulatedTimeRef.current + sessionTime;

        // Sync to backend
        try {

          await fetch(`${API_URL}/stats/update-playtime`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              userId: user.id,
              hoursPlayed: totalTime
            })
          });
          console.log(`✅ Play time synced: ${totalTime.toFixed(2)} hours`);
        } catch (error) {
          console.error('Failed to sync play time:', error);
        }

        // Reset for next interval
        accumulatedTimeRef.current = 0;
        startTimeRef.current = Date.now();
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup on unmount or when playing stops
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }

      // Final sync on unmount
      if (startTimeRef.current) {
        const sessionTime = (Date.now() - startTimeRef.current) / 1000 / 3600;
        const totalTime = accumulatedTimeRef.current + sessionTime;

        // Async sync (fire and forget)

        fetch(`${API_URL}/stats/update-playtime`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: user.id,
            hoursPlayed: totalTime
          })
        }).catch(err => console.error('Failed to sync play time on unmount:', err));
      }
    };
  }, [isPlaying, isLoggedIn, user]);
};
