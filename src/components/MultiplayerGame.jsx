import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MultiplayerGame.css';

// Player theme colors
const PLAYER_THEMES = {
  green: { primary: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)' },
  blue: { primary: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)' },
  gold: { primary: '#eab308', glow: 'rgba(234, 179, 8, 0.5)' },
  sunset: { primary: '#f97316', glow: 'rgba(249, 115, 22, 0.5)' },
  retro: { primary: '#eab308', glow: 'rgba(234, 179, 8, 0.5)' }
};

// Streak level colors - matching single-player ParagraphEngine
const COMBO_LEVELS = {
  START: { label: 'START', minStreak: 0, color: '#ffffff', glow: true },
  BAD: { label: 'BAD', minStreak: 1, color: '#888888', glow: false },
  NORMAL: { label: 'NORMAL', minStreak: 5, color: '#3498db', glow: false },
  GOOD: { label: 'GOOD', minStreak: 15, color: '#f39c12', glow: false },
  PERFECT: { label: 'PERFECT', minStreak: 30, color: '#e74c3c', glow: true }
};

// Tier Mode Schedule: 2 Easy -> 2 Medium -> 4 Hard (Total 8 Rounds)
const TIER_SCHEDULE = ['easy', 'easy', 'medium', 'medium', 'hard', 'hard', 'hard', 'hard'];
const TOTAL_TIER_ROUNDS = 8;
const INTERMISSION_DURATION = 10; // seconds

const MultiplayerGame = ({
  targetText = "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
  tierParagraphs = null, // { easy, medium, hard } for tier mode
  timeLimit = 60,
  players = [],
  currentPlayer = null,
  socket = null,
  roomId = null,
  round = 1,
  mode = 'random', // 'random' or 'tier'
  skipCountdown = false, // Skip countdown if lobby already handled it
  onProgress,
  onComplete,
  onLeave
}) => {
  // Game States - skip countdown if lobby already handled it
  const [gamePhase, setGamePhase] = useState(skipCountdown ? 'playing' : 'countdown');
  const [countdownNumber, setCountdownNumber] = useState(5); // Changed from 3 to 5
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [opponentProgress, setOpponentProgress] = useState({}); // { playerId: { progress, wpm } }

  // Tier mode states
  const [currentTier, setCurrentTier] = useState('easy'); // 'easy', 'medium', 'hard'
  const [currentParagraph, setCurrentParagraph] = useState(targetText);
  const [roundIndex, setRoundIndex] = useState(0); // Current round index (0-7)
  const [isRoundComplete, setIsRoundComplete] = useState(false); // Has current player finished the round
  const [showIntermission, setShowIntermission] = useState(false); // Show intermission modal
  const [intermissionCountdown, setIntermissionCountdown] = useState(INTERMISSION_DURATION); // 10s countdown
  const [tierRoundStats, setTierRoundStats] = useState({ wpm: 0, precision: 0, penaltyTimeUsed: 0 }); // Stats for current round
  const [finishOrder, setFinishOrder] = useState(null); // 1st, 2nd, etc.
  const [roundResults, setRoundResults] = useState([]); // All players' results for the round
  const [cumulativeStats, setCumulativeStats] = useState({ totalWpm: 0, totalPrecision: 0, roundsPlayed: 0, totalPenaltyTime: 0 }); // For final leaderboard
  const [bestStreak, setBestStreak] = useState(0); // Track best streak across tier rounds
  const [roundsWon, setRoundsWon] = useState(0); // Track rounds won in tier mode
  const [opponentRoundsWon, setOpponentRoundsWon] = useState(0); // Track opponent's rounds won
  const [tierGameEnded, setTierGameEnded] = useState(false); // Flag to show detailed results
  const [tierFinalStats, setTierFinalStats] = useState(null); // Final stats for detailed result
  const [penaltyTimeUsed, setPenaltyTimeUsed] = useState(0); // Track penalty used in current hard round

  // New tier mode states - chances and ready system
  const [myChances, setMyChances] = useState(2); // Start with 2 chances
  const [isEliminated, setIsEliminated] = useState(false);
  const [waitingForReady, setWaitingForReady] = useState(false); // Show ready button
  const [isReadyForNextRound, setIsReadyForNextRound] = useState(false);
  const [readyPlayersCount, setReadyPlayersCount] = useState(0);
  const [activePlayers, setActivePlayers] = useState([]); // Players still in game
  const [failedThisRound, setFailedThisRound] = useState(false); // Did I fail this round
  const [eliminatedPlayers, setEliminatedPlayers] = useState([]); // Track eliminated player IDs

  // Spectator Mode States
  const [isSpectating, setIsSpectating] = useState(false); // Am I in spectator mode
  const [spectatorTargetId, setSpectatorTargetId] = useState(null); // Who am I watching
  const [spectators, setSpectators] = useState([]); // Who is watching me

  // Typing States
  const [typedText, setTypedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [currentErrors, setCurrentErrors] = useState(0); // Current consecutive errors for red bar
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [streak, setStreak] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);

  // Result state
  const [result, setResult] = useState(null); // 'win' or 'lose'
  const [completionTime, setCompletionTime] = useState(null); // Time when player completed
  const [opponentCompletionTime, setOpponentCompletionTime] = useState(null); // Time when opponent completed

  // Go Again voting state
  const [goAgainVotes, setGoAgainVotes] = useState([]); // Array of player IDs who voted
  const [hasVotedGoAgain, setHasVotedGoAgain] = useState(false);

  // Score tracking state - position-based for up to 4 players
  const [playerScores, setPlayerScores] = useState({}); // { playerId: { wins: 0, position: null } }
  const [roundNumber, setRoundNumber] = useState(1);
  const [finalPositions, setFinalPositions] = useState([]); // Array of { playerId, position, wpm, accuracy, progress }

  // Dynamic paragraph state for Go Again
  const [dynamicParagraph, setDynamicParagraph] = useState(null);

  // Player disconnect state
  const [playerDisconnected, setPlayerDisconnected] = useState(false);
  const [disconnectedPlayer, setDisconnectedPlayer] = useState(null);
  const [reconnectTimer, setReconnectTimer] = useState(3);
  const reconnectTimerRef = useRef(null);

  // Result finalization flag - prevents late state updates
  const [isResultFinalized, setIsResultFinalized] = useState(false);
  const resultFinalizedRef = useRef(false); // Ref for immediate access in callbacks

  // Refs
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Get the current text to type based on mode
  const activeText = mode === 'tier' ? currentParagraph : (dynamicParagraph || targetText);
  const words = (activeText && typeof activeText === 'string') ? activeText.split(' ') : [];

  // Listen for opponent progress updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleProgressUpdate = ({ playerId, progress, wpm, accuracy, completed, completionTime: oppCompTime, typedText: oppTypedText }) => {
      // Guard: skip updates after result is finalized
      if (resultFinalizedRef.current) return;

      if (playerId !== currentPlayer?.id) {
        setOpponentProgress(prev => ({
          ...prev,
          [playerId]: { progress, wpm, accuracy, completed, completionTime: oppCompTime, typedText: oppTypedText }
        }));
        // Track opponent completion time
        if (completed && oppCompTime && !opponentCompletionTime) {
          setOpponentCompletionTime(oppCompTime);
        }
      }
    };

    // Listen for Go Again votes (Random mode)
    const handleGoAgainVotes = ({ votes, totalPlayers }) => {
      setGoAgainVotes(votes);
    };

    // Listen for new round with new paragraph (Random mode)
    const handleNewRound = ({ paragraphText }) => {
      if (paragraphText) {
        setDynamicParagraph(paragraphText);
        resetForNewRound();
        setRoundNumber(prev => prev + 1);
      }
    };

    // Listen for player completing a round (Tier mode - don't end for others)
    const handlePlayerCompleted = ({ playerId, playerName, completionTime: oppCompTime, wpm, accuracy, finishPosition }) => {
      if (playerId !== currentPlayer?.id) {
        setOpponentCompletionTime(oppCompTime);
        // In random mode, track opponent completion but wait for game_over from server
        // Don't end game immediately - wait for synchronized game_over event
      }
    };

    // Listen for game_over (all players finished or time up - Random mode)
    const handleGameOver = ({ standings, winner }) => {
      if (mode === 'random' || !mode) {
        // Finalize results - prevent late updates
        resultFinalizedRef.current = true;
        setIsResultFinalized(true);

        // Show final results with winner
        const myStanding = standings?.find(s => s.playerId === currentPlayer?.id);
        const isWinner = winner?.playerId === currentPlayer?.id;

        setFinalPositions(standings || []);
        setResult(isWinner ? 'win' : 'lose');
        setGamePhase('finished');
        clearInterval(timerRef.current);
      }
    };

    // Listen for round ended (Tier mode - all players finished or timeout)
    const handleRoundEnded = ({ roundIndex: serverRoundIndex, roundResults: results, isLastRound, leaderboard }) => {
      if (mode === 'tier') {
        // Finalize round results - ignore late packets
        resultFinalizedRef.current = true;
        setIsResultFinalized(true);

        setRoundResults(results || []);
        clearInterval(timerRef.current);

        // Find my finish position and opponent's
        const myResult = results?.find(r => r.playerId === currentPlayer?.id);
        const oppResult = results?.find(r => r.playerId !== currentPlayer?.id);

        if (myResult) {
          setFinishOrder(myResult.position);
          setTierRoundStats({ wpm: myResult.wpm, accuracy: myResult.accuracy });
          // Update cumulative stats
          setCumulativeStats(prev => ({
            totalWpm: prev.totalWpm + (myResult.wpm || 0),
            totalAccuracy: prev.totalAccuracy + (myResult.accuracy || 0),
            roundsPlayed: prev.roundsPlayed + 1
          }));

          // Determine round winner based on position (1st wins)
          if (myResult.position === 1) {
            setRoundsWon(prev => prev + 1);
          } else if (oppResult?.position === 1) {
            setOpponentRoundsWon(prev => prev + 1);
          }
        }

        if (isLastRound) {
          // Final round - show game over with detailed results
          setTierGameEnded(true);
          setTierFinalStats({
            myStats: {
              avgWpm: cumulativeStats.roundsPlayed > 0
                ? Math.round((cumulativeStats.totalWpm + (myResult?.wpm || 0)) / (cumulativeStats.roundsPlayed + 1))
                : myResult?.wpm || 0,
              avgAccuracy: cumulativeStats.roundsPlayed > 0
                ? Math.round((cumulativeStats.totalAccuracy + (myResult?.accuracy || 0)) / (cumulativeStats.roundsPlayed + 1))
                : myResult?.accuracy || 0,
              roundsWon: roundsWon + (myResult?.position === 1 ? 1 : 0),
              bestStreak
            },
            oppStats: leaderboard?.find(l => l.playerId !== currentPlayer?.id) || null
          });
          setGamePhase('finished');
        } else {
          // Show intermission
          setShowIntermission(true);
          setIntermissionCountdown(INTERMISSION_DURATION);
        }
      }
    };

    // Listen for next round starting (Tier mode - server triggers after 10s)
    const handleNextRound = ({ roundIndex: newRoundIndex, paragraphText, difficulty }) => {
      if (mode === 'tier') {
        setRoundIndex(newRoundIndex);
        setCurrentTier(difficulty);
        setCurrentParagraph(paragraphText);
        resetForNewRound();
        setShowIntermission(false);
      }
    };

    // Listen for tier player finishing (Tier mode - individual player completion)
    const handleTierPlayerFinished = ({ playerId, playerName, position, wpm, accuracy, completionTime: oppCompTime, roundIndex }) => {
      if (playerId !== currentPlayer?.id) {
        // Update opponent progress with completion data
        setOpponentProgress(prev => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            progress: 100,
            wpm,
            accuracy,
            completed: true,
            completionTime: oppCompTime,
            position
          }
        }));
      }
    };

    // Listen for tier game complete (Tier mode - final results or player finished early)
    const handleTierGameComplete = ({ leaderboard, winner, reason }) => {
      if (mode === 'tier') {
        // Set final stats for detailed results
        const myLeaderboardEntry = leaderboard?.find(l => l.playerId === currentPlayer?.id);
        const oppLeaderboardEntry = leaderboard?.find(l => l.playerId !== currentPlayer?.id);

        setTierGameEnded(true);
        setTierFinalStats({
          myStats: {
            avgWpm: myLeaderboardEntry?.avgWpm || Math.round(cumulativeStats.totalWpm / Math.max(cumulativeStats.roundsPlayed, 1)),
            avgAccuracy: myLeaderboardEntry?.avgAccuracy || Math.round(cumulativeStats.totalAccuracy / Math.max(cumulativeStats.roundsPlayed, 1)),
            roundsWon,
            bestStreak: myLeaderboardEntry?.bestWpm ? bestStreak : bestStreak,
            completedRounds: myLeaderboardEntry?.completedRounds || cumulativeStats.roundsPlayed
          },
          oppStats: oppLeaderboardEntry ? {
            avgWpm: oppLeaderboardEntry.avgWpm,
            avgAccuracy: oppLeaderboardEntry.avgAccuracy,
            roundsWon: opponentRoundsWon,
            completedRounds: oppLeaderboardEntry.completedRounds
          } : null,
          reason // 'complete', 'player_left', 'opponent_left', 'finished_early'
        });

        setRoundResults(leaderboard);
        setShowIntermission(false);
        setGamePhase('finished');

        // Determine if I won overall
        if (winner?.playerId === currentPlayer?.id) {
          setResult('win');
        } else if (winner) {
          setResult('lose');
        }
      }
    };

    // Listen for opponent finishing game early
    const handleOpponentFinishedEarly = ({ playerId, playerName, stats }) => {
      if (mode === 'tier' && playerId !== currentPlayer?.id) {
        // Opponent clicked "Finish Game" - show detailed results to both
        setTierGameEnded(true);
        setTierFinalStats({
          myStats: {
            avgWpm: Math.round(cumulativeStats.totalWpm / Math.max(cumulativeStats.roundsPlayed, 1)),
            avgAccuracy: Math.round(cumulativeStats.totalAccuracy / Math.max(cumulativeStats.roundsPlayed, 1)),
            roundsWon,
            bestStreak,
            completedRounds: cumulativeStats.roundsPlayed
          },
          oppStats: stats,
          reason: 'opponent_finished_early'
        });
        setShowIntermission(false);
        setGamePhase('finished');
      }
    };

    // Handle waiting for ready state (new - players must click ready)
    const handleWaitingForReady = ({ activePlayers: activeList, nextRound, nextDifficulty }) => {
      if (mode === 'tier') {
        setActivePlayers(activeList);
        setWaitingForReady(true);
        setIsReadyForNextRound(false);
        setReadyPlayersCount(0);
      }
    };

    // Handle player ready for next round
    const handlePlayerReadyNextRound = ({ playerId, readyCount, totalActive }) => {
      if (mode === 'tier') {
        setReadyPlayersCount(readyCount);
        if (playerId === currentPlayer?.id) {
          setIsReadyForNextRound(true);
        }
      }
    };

    // Handle player eliminated
    const handlePlayerEliminated = ({ playerId, playerName, reason }) => {
      if (mode === 'tier') {
        console.log(`Player ${playerName} was eliminated`);

        // Track eliminated player ID
        setEliminatedPlayers(prev => [...prev, playerId]);

        // If it's me, update my state
        if (playerId === socket?.id) {
          setIsEliminated(true);
          setMyChances(0);
        }
        // Update opponent progress to show elimination
        setOpponentProgress(prev => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            isEliminated: true,
            reason
          }
        }));
      }
    };

    // Handle player used chance
    const handlePlayerUsedChance = ({ playerId, playerName, chancesRemaining }) => {
      if (mode === 'tier') {
        if (playerId === currentPlayer?.id) {
          setMyChances(chancesRemaining);
        }
      }
    };

    socket.on('player_progress', handleProgressUpdate);
    socket.on('go_again_votes', handleGoAgainVotes);
    socket.on('new_round', handleNewRound);
    socket.on('player_completed', handlePlayerCompleted);
    socket.on('round_ended', handleRoundEnded);
    socket.on('next_round', handleNextRound);
    socket.on('tier_player_finished', handleTierPlayerFinished);
    socket.on('tier_game_complete', handleTierGameComplete);
    socket.on('opponent_finished_early', handleOpponentFinishedEarly);
    socket.on('game_over', handleGameOver);
    socket.on('waiting_for_ready', handleWaitingForReady);
    socket.on('player_ready_next_round', handlePlayerReadyNextRound);
    socket.on('player_eliminated', handlePlayerEliminated);
    socket.on('player_used_chance', handlePlayerUsedChance);

    // Listen for player disconnect during gameplay
    const handlePlayerLeft = ({ playerId, playerName }) => {
      setPlayerDisconnected(true);
      setDisconnectedPlayer({ id: playerId, name: playerName });
      setReconnectTimer(3);
    };

    // Listen for player reconnect
    const handlePlayerReconnected = ({ playerId }) => {
      if (disconnectedPlayer?.id === playerId) {
        setPlayerDisconnected(false);
        setDisconnectedPlayer(null);
        setReconnectTimer(3);
        if (reconnectTimerRef.current) {
          clearInterval(reconnectTimerRef.current);
        }
      }
    };

    socket.on('player_left_game', handlePlayerLeft);
    socket.on('player_reconnected', handlePlayerReconnected);

    return () => {
      socket.off('player_progress', handleProgressUpdate);
      socket.off('go_again_votes', handleGoAgainVotes);
      socket.off('new_round', handleNewRound);
      socket.off('player_completed', handlePlayerCompleted);
      socket.off('round_ended', handleRoundEnded);
      socket.off('next_round', handleNextRound);
      socket.off('tier_player_finished', handleTierPlayerFinished);
      socket.off('tier_game_complete', handleTierGameComplete);
      socket.off('opponent_finished_early', handleOpponentFinishedEarly);
      socket.off('game_over', handleGameOver);
      socket.off('player_left_game', handlePlayerLeft);
      socket.off('player_reconnected', handlePlayerReconnected);
      socket.off('waiting_for_ready', handleWaitingForReady);
      socket.off('player_ready_next_round', handlePlayerReadyNextRound);
      socket.off('player_eliminated', handlePlayerEliminated);
      socket.off('player_used_chance', handlePlayerUsedChance);
    };
  }, [socket, currentPlayer?.id, timeLimit, completionTime, disconnectedPlayer?.id, mode]);


  // Helper function to reset state for a new round
  const resetForNewRound = useCallback(() => {
    // Reset result finalization for new round
    resultFinalizedRef.current = false;
    setIsResultFinalized(false);

    setGamePhase('countdown');
    setCountdownNumber(5);
    setTypedText('');
    setCurrentWordIndex(0);
    setErrors(0);
    setCurrentErrors(0);
    setStreak(0);
    setTimeRemaining(timeLimit);
    startTimeRef.current = null;
    setGoAgainVotes([]);
    setHasVotedGoAgain(false);
    setCompletionTime(null);
    setOpponentCompletionTime(null);
    setOpponentProgress({});
    setIsRoundComplete(false);
    setWaitingForReady(false);
    setIsReadyForNextRound(false);
    setReadyPlayersCount(0);
    setFailedThisRound(false);
    setFinishOrder(null);
    setRoundResults([]);
    setIntermissionCountdown(INTERMISSION_DURATION);
    setPenaltyTimeUsed(0); // Reset penalty time for new round
  }, [timeLimit]);

  const handleReadyForNextRound = useCallback(() => {
    if (socket && roomId && !isReadyForNextRound && !isEliminated) {
      socket.emit('tier_ready_next_round', { roomId });
      setIsReadyForNextRound(true);
    }
  }, [socket, roomId, isReadyForNextRound, isEliminated]);

  // Auto-advance to next round when intermission countdown reaches 0
  useEffect(() => {
    if (mode === 'tier' && waitingForReady && intermissionCountdown === 0 && !isEliminated && !isReadyForNextRound) {
      handleReadyForNextRound();
    }
  }, [mode, waitingForReady, intermissionCountdown, isEliminated, isReadyForNextRound, handleReadyForNextRound]);

  // Handle "Quit Game" button click in tier mode (give up remaining chances)
  const handleQuitTierGame = useCallback(() => {
    if (socket && roomId) {
      socket.emit('tier_player_quit', { roomId });
      setIsEliminated(true);
      setMyChances(0);
    }
  }, [socket, roomId]);

  // Handle "Finish Game" button click in tier mode
  const handleFinishGame = useCallback(() => {
    // Calculate final stats
    // cumulativeStats should already include the current round from round_ended handler
    // But we also store current round's stats in tierRoundStats for safety
    const currentWpm = tierRoundStats?.wpm || 0;
    const currentAccuracy = tierRoundStats?.accuracy || 0;

    // The cumulative stats are updated in round_ended, so we can use them directly
    // Just in case the state hasn't propagated yet, we ensure at least 1 round is counted
    const totalRoundsCompleted = Math.max(cumulativeStats.roundsPlayed, 1);

    const finalStats = {
      avgWpm: totalRoundsCompleted > 0
        ? Math.round(cumulativeStats.totalWpm / totalRoundsCompleted)
        : currentWpm,
      avgAccuracy: totalRoundsCompleted > 0
        ? Math.round(cumulativeStats.totalAccuracy / totalRoundsCompleted)
        : currentAccuracy,
      roundsWon,
      bestStreak: Math.max(bestStreak, streak),
      completedRounds: totalRoundsCompleted
    };

    // Notify server and other players
    if (socket && roomId) {
      socket.emit('tier_finish_early', {
        roomId,
        playerId: currentPlayer?.id,
        stats: finalStats
      });
    }

    // Show detailed results locally
    setTierGameEnded(true);
    setTierFinalStats({
      myStats: finalStats,
      oppStats: null, // Will show opponent's current stats
      reason: 'finished_early'
    });
    setShowIntermission(false);
    setGamePhase('finished');
  }, [socket, roomId, currentPlayer?.id, cumulativeStats, tierRoundStats, roundsWon, bestStreak, streak]);

  // Handle reconnect countdown timer
  useEffect(() => {
    if (playerDisconnected && reconnectTimer > 0) {
      reconnectTimerRef.current = setTimeout(() => {
        setReconnectTimer(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(reconnectTimerRef.current);
    } else if (playerDisconnected && reconnectTimer === 0) {
      // Time's up - terminate the session
      onLeave?.();
    }
  }, [playerDisconnected, reconnectTimer, onLeave]);

  // Initialize currentParagraph based on mode
  useEffect(() => {
    if (mode === 'tier' && tierParagraphs) {
      // Start with the first round's difficulty
      const firstDifficulty = TIER_SCHEDULE[0];
      const paragraphArray = tierParagraphs[firstDifficulty];
      // Get first paragraph string from array
      const paragraphText = Array.isArray(paragraphArray) ? paragraphArray[0] : paragraphArray;
      setCurrentParagraph(paragraphText);
      setCurrentTier(firstDifficulty);
      setRoundIndex(0);
    } else {
      setCurrentParagraph(targetText);
    }
  }, [mode, tierParagraphs, targetText]);

  // Intermission countdown effect for tier mode (client-side backup - server handles primary)
  useEffect(() => {
    if (showIntermission && intermissionCountdown > 0) {
      const timer = setTimeout(() => {
        setIntermissionCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    // Server will emit 'next_round' after 10s - no need to advance client-side
  }, [showIntermission, intermissionCountdown]);

  // Calculate progress percentage - only count correctly typed characters
  const calculateProgress = useCallback(() => {
    if (!typedText) return 0;
    // Count consecutive correct characters from the start
    let correctCount = 0;
    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] === activeText[i]) {
        correctCount++;
      } else {
        break; // Stop at first error
      }
    }
    return Math.min((correctCount / activeText.length) * 100, 100);
  }, [typedText, activeText]);

  // Check if currently in error state (typing wrong characters)
  const hasCurrentErrors = currentErrors > 0;

  // Countdown effect
  useEffect(() => {
    if (gamePhase === 'countdown') {
      if (countdownNumber > 0) {
        const timer = setTimeout(() => {
          setCountdownNumber(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        // Start the game
        setGamePhase('playing');
        startTimeRef.current = Date.now();
        inputRef.current?.focus();
      }
    }
  }, [gamePhase, countdownNumber]);

  // Focus input when game starts playing
  useEffect(() => {
    if (gamePhase === 'playing') {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      // Delay focus slightly to ensure DOM is ready
      const focusTimer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(focusTimer);
    }
  }, [gamePhase]);

  // Game timer
  useEffect(() => {
    if (gamePhase === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const difficulty = TIER_SCHEDULE[roundIndex];
          const isHardMode = difficulty === 'hard';

          if (prev <= (isHardMode ? -20 : 0)) {
            // Total timeout reached
            clearInterval(timerRef.current);

            if (mode === 'tier' && !isEliminated) {
              // Tier mode - player timed out (failed this round)
              setFailedThisRound(true);

              // Notify server that player failed
              if (socket && roomId) {
                socket.emit('tier_player_failed', {
                  roomId,
                  roundIndex
                });
              }

              return isHardMode ? -20 : 0;
            }

            setGamePhase('finished');
            onComplete?.({
              progress: calculateProgress(),
              wpm: calculateWPM(),
              precision: calculateAccuracy(), // rename for callback
              time: timeLimit
            });
            return 0;
          }

          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [gamePhase, timeLimit, mode, socket, roomId, roundIndex, isEliminated]);

  // Get streak/combo level based on streak count (matching single-player)
  const getComboLevel = useCallback(() => {
    if (streak >= COMBO_LEVELS.PERFECT.minStreak) return COMBO_LEVELS.PERFECT;
    if (streak >= COMBO_LEVELS.GOOD.minStreak) return COMBO_LEVELS.GOOD;
    if (streak >= COMBO_LEVELS.NORMAL.minStreak) return COMBO_LEVELS.NORMAL;
    if (streak >= COMBO_LEVELS.BAD.minStreak) return COMBO_LEVELS.BAD;
    return COMBO_LEVELS.START;
  }, [streak]);

  // Calculate WPM
  const calculateWPM = useCallback(() => {
    if (!startTimeRef.current) return 0;
    const elapsedMinutes = (Date.now() - startTimeRef.current) / 60000;
    const wordsTyped = typedText.trim().split(' ').filter(w => w).length;
    return Math.round(wordsTyped / elapsedMinutes) || 0;
  }, [typedText]);

  // Calculate accuracy
  const calculateAccuracy = useCallback(() => {
    const totalChars = typedText.length;
    if (totalChars === 0) return 100;
    return Math.round(((totalChars - errors) / totalChars) * 100);
  }, [typedText, errors]);

  // Handle input change
  const handleInputChange = (e) => {
    if (gamePhase !== 'playing') return;

    const value = e.target.value;
    const prevLength = typedText.length;

    // Check for errors against active text
    let newErrors = 0;
    let lastCharCorrect = true;
    let consecutiveErrors = 0; // Count errors from the end of correctly typed text

    // Find where errors start (for red bar effect)
    let correctUpTo = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === activeText[i]) {
        if (consecutiveErrors === 0) {
          correctUpTo = i + 1;
        }
      } else {
        newErrors++;
        consecutiveErrors++;
        if (i === value.length - 1) lastCharCorrect = false;
      }
    }

    setErrors(newErrors);
    setCurrentErrors(consecutiveErrors);
    setTypedText(value);

    // Update streak based on word completion (like single-player)
    if (value.length > prevLength) {
      const lastChar = value[value.length - 1];

      // Check if we just completed a word (space typed or end of text)
      if (lastChar === ' ' || value.length === activeText.length) {
        // Get the last word typed
        const typedWords = value.trim().split(/\s+/);
        const expectedWords = activeText.substring(0, value.length).trim().split(/\s+/);
        const lastWordIndex = typedWords.length - 1;

        if (typedWords[lastWordIndex] === expectedWords[lastWordIndex]) {
          setStreak(prev => prev + 1); // Increment streak for correct word
        } else {
          setStreak(0); // Reset streak on incorrect word
        }
      } else if (!lastCharCorrect) {
        // Reset streak on any character error
        setStreak(0);
      }
    }

    // Update current word index
    const currentLength = value.length;
    let charCount = 0;
    for (let i = 0; i < words.length; i++) {
      charCount += words[i].length + 1; // +1 for space
      if (currentLength < charCount) {
        setCurrentWordIndex(i);
        break;
      }
    }

    // Calculate and emit progress
    const progress = (value.length / activeText.length) * 100;
    const wpm = calculateWPM();
    const accuracy = calculateAccuracy();

    // Emit progress via socket for other players to see (including typedText for spectators)
    if (socket && roomId) {
      socket.emit('typing_progress', { roomId, progress, wpm, accuracy, typedText: value });
    }

    onProgress?.({ progress, wpm });

    // Check if completed current paragraph
    if (value === activeText) {
      const finishTime = Date.now();
      const elapsedSeconds = startTimeRef.current ? Math.round((finishTime - startTimeRef.current) / 1000) : timeLimit - timeRemaining;
      setCompletionTime(elapsedSeconds);

      // Emit completion to other players
      if (socket && roomId) {
        socket.emit('typing_progress', {
          roomId,
          progress: 100,
          wpm: calculateWPM(),
          accuracy: calculateAccuracy(),
          completed: true,
          completionTime: elapsedSeconds
        });
      }

      if (mode === 'tier') {
        // Tier mode - send round_complete event, don't end for others
        const wpm = calculateWPM();
        const accuracy = calculateAccuracy(); // logic is same, label is different

        // Calculate penalty if in Hard mode and timeRemaining < 0
        const penaltyUsed = timeRemaining < 0 ? Math.abs(timeRemaining) : 0;
        setPenaltyTimeUsed(penaltyUsed);

        // Store round stats
        setTierRoundStats({ wpm, precision: accuracy, penaltyTimeUsed: penaltyUsed });
        setBestStreak(prev => Math.max(prev, streak));
        setIsRoundComplete(true);

        // Emit round complete to server - server will track finish order
        if (socket && roomId) {
          socket.emit('round_complete', {
            roomId,
            roundIndex,
            wpm,
            accuracy, // server expects 'accuracy' but we use precision value
            completionTime: timeLimit + penaltyUsed
          });
        }

        // Don't end game or show intermission here - wait for server's round_ended event
        // This allows other players to finish
      } else {
        // Random mode - game finished, I won!
        setMyScore(prev => prev + 1);
        setGamePhase('finished');
        clearInterval(timerRef.current);
        onComplete?.({
          progress: 100,
          wpm: calculateWPM(),
          precision: calculateAccuracy(),
          time: elapsedSeconds
        });
      }
    }
  };

  // Render text with highlighting
  const renderText = () => {
    let charIndex = 0;

    return words.map((word, wordIndex) => {
      const wordStart = charIndex;
      const wordEnd = charIndex + word.length;
      charIndex = wordEnd + 1; // +1 for space

      const isCurrentWord = wordIndex === currentWordIndex;
      const isPastWord = wordIndex < currentWordIndex;

      // Build character spans for the word
      const chars = word.split('').map((char, i) => {
        const globalIndex = wordStart + i;
        let className = 'char';

        if (globalIndex < typedText.length) {
          className += typedText[globalIndex] === char ? ' correct' : ' incorrect';
        }

        return (
          <span key={i} className={className}>
            {char}
          </span>
        );
      });

      return (
        <React.Fragment key={wordIndex}>
          <span
            className={`word ${isCurrentWord ? 'current' : ''} ${isPastWord ? 'past' : ''}`}
            style={isCurrentWord ? {
              '--underline-color': PLAYER_THEMES[currentPlayer?.theme]?.primary || PLAYER_THEMES.green.primary
            } : {}}
          >
            {chars}
          </span>
          {wordIndex < words.length - 1 && (
            <span
              className={`char space ${wordEnd < typedText.length ? (typedText[wordEnd] === ' ' ? 'correct' : 'incorrect') : ''}`}
            >
              {' '}
            </span>
          )}
        </React.Fragment>
      );
    });
  };

  // Render spectator view text (showing watched player's progress)
  const renderSpectatorText = () => {
    if (!spectatorTargetId || !opponentProgress[spectatorTargetId]) {
      return <span className="spectator-waiting">Waiting for player data...</span>;
    }

    const targetTypedText = opponentProgress[spectatorTargetId]?.typedText || '';
    let charIndex = 0;

    return words.map((word, wordIndex) => {
      const wordStart = charIndex;
      const wordEnd = wordStart + word.length;
      charIndex = wordEnd + 1; // +1 for space

      const isPastWord = wordEnd <= targetTypedText.length;
      const isCurrentWord = wordStart <= targetTypedText.length && targetTypedText.length < wordEnd + 1;

      const chars = word.split('').map((char, i) => {
        const globalIndex = wordStart + i;
        let className = 'char';

        if (globalIndex < targetTypedText.length) {
          className += targetTypedText[globalIndex] === char ? ' correct' : ' incorrect';
        }

        return (
          <span key={i} className={className}>
            {char}
          </span>
        );
      });

      return (
        <React.Fragment key={wordIndex}>
          <span className={`word ${isCurrentWord ? 'current' : ''} ${isPastWord ? 'past' : ''}`}>
            {chars}
          </span>
          {wordIndex < words.length - 1 && (
            <span
              className={`char space ${wordEnd < targetTypedText.length ? (targetTypedText[wordEnd] === ' ' ? 'correct' : 'incorrect') : ''}`}
            >
              {' '}
            </span>
          )}
        </React.Fragment>
      );
    });
  };

  // Get target player info for spectator mode
  const getSpectatorTarget = () => {
    if (!spectatorTargetId) return null;
    return players.find(p => p.id === spectatorTargetId);
  };

  // Format time (handles negative seconds for Hard Mode penalty)
  const formatTime = (seconds) => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;
    return isNegative ? `-${timeString}` : timeString;
  };

  // Get current player and all opponents (up to 3)
  const opponents = players.filter(p => p.id !== currentPlayer?.id);
  const opponent = opponents[0]; // Primary opponent for backwards compatibility
  const opponentData = opponent ? opponentProgress[opponent.id] : null;

  // Get all players' progress data for the sidebar (filter out eliminated players)
  const allPlayersData = players
    .filter(p => !eliminatedPlayers.includes(p.id)) // Hide eliminated players
    .map(p => ({
      ...p,
      isMe: p.id === currentPlayer?.id,
      progress: p.id === currentPlayer?.id ? calculateProgress() : (opponentProgress[p.id]?.progress || 0),
      wpm: p.id === currentPlayer?.id ? calculateWPM() : (opponentProgress[p.id]?.wpm || 0),
      completed: p.id === currentPlayer?.id ? isRoundComplete : (opponentProgress[p.id]?.completed || false)
    }))
    .sort((a, b) => b.progress - a.progress); // Sort by progress descending

  return (
    <div className="multiplayer-game-dashboard">
      {/* Main Dashboard Container */}
      <div className="game-dashboard-container">
        {/* Section 1: The HUD (Top) */}
        <div className="game-hud">
          {/* Left: Player 1 Stats */}
          <div className="hud-player-stats left">
            <div className="hud-avatar">
              {currentPlayer?.avatarUrl ? (
                <img src={currentPlayer.avatarUrl} alt={currentPlayer.name} />
              ) : (
                <span>{currentPlayer?.name?.charAt(0).toUpperCase() || 'P'}</span>
              )}
            </div>
            <div className="hud-stats">
              <span className="hud-name">{currentPlayer?.name || 'Player 1'}</span>
              <div className="hud-stat-row">
                <span className="hud-stat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {calculateWPM()} WPM
                </span>
                <span className="hud-stat combo-indicator" style={{ color: getComboLevel().color }}>
                  <span className="combo-label">{getComboLevel().label}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Center: Game Mode Badge + Live Timer */}
          <div className="hud-center">
            <span className="hud-mode-badge">
              {mode === 'tier'
                ? `${TIER_SCHEDULE[roundIndex]?.charAt(0).toUpperCase() + TIER_SCHEDULE[roundIndex]?.slice(1) || 'Tier'} (${roundIndex + 1}/${TOTAL_TIER_ROUNDS})`
                : 'Random'}
            </span>
            <div className={`hud-timer ${timeRemaining <= 10 && timeRemaining > 0 ? 'warning' : ''} ${timeRemaining < 0 ? 'penalty' : ''}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Right: Empty placeholder to maintain centered timer */}
          <div className="hud-player-stats right placeholder">
            {/* Empty for layout balance */}
          </div>
        </div>

        {/* Section 2: Main Game Area - Split Layout */}
        <div className="game-main-area">
          {/* Left: Paragraph Console */}
          <div className="game-console" onClick={() => !isSpectating && inputRef.current?.focus()}>
            {/* Spectator Mode Header */}
            {isSpectating && (
              <div className="spectator-header">
                <span className="spectator-badge">👁️ SPECTATING</span>
                <span className="spectator-target">{getSpectatorTarget()?.name || 'Unknown'}</span>
              </div>
            )}

            <div className="console-paragraph">
              {isSpectating ? renderSpectatorText() : renderText()}
            </div>

            {!isSpectating && (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  className="console-hidden-input"
                  value={typedText}
                  onChange={handleInputChange}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  disabled={gamePhase !== 'playing' || isEliminated}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  autoFocus
                />
                {!isInputFocused && gamePhase === 'playing' && (
                  <div className="console-focus-hint">Click here or start typing...</div>
                )}
              </>
            )}
          </div>

          {/* Right: Progress Trackers Sidebar - All Players */}
          <div className="game-progress-sidebar">
            <div className="progress-sidebar-header">
              <span>Racers</span>
              <span className="player-count">{players.length}/4</span>
            </div>

            {/* Render all players sorted by progress */}
            {allPlayersData.map((player, index) => {
              const isMe = player.id === currentPlayer?.id;
              const playerTheme = PLAYER_THEMES[player.theme] || PLAYER_THEMES[Object.keys(PLAYER_THEMES)[index]] || PLAYER_THEMES.green;
              const showError = isMe && hasCurrentErrors;
              const isFinished = player.completed || player.progress >= 100;
              const finishPosition = index + 1; // Position based on sorted order

              return (
                <div key={player.id} className={`progress-card ${isMe ? 'you' : 'opponent'} ${isFinished ? 'finished' : ''}`}>
                  <div className="progress-card-header">
                    <span className="progress-rank">#{index + 1}</span>
                    <span className={`progress-avatar ${!isMe ? 'opponent' : ''}`} style={{ '--avatar-color': playerTheme.primary }}>
                      {player.avatarUrl ? (
                        <img src={player.avatarUrl} alt={player.name} />
                      ) : (
                        player.name?.charAt(0).toUpperCase() || 'P'
                      )}
                    </span>
                    <span className="progress-name">{isMe ? 'You' : player.name}</span>
                    {isFinished && (
                      <span className={`player-finished-badge ${isMe ? 'you' : ''}`}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="progress-card-stats">
                    <span className="progress-percent-large">{Math.round(player.progress)}%</span>
                    <span className="progress-wpm">{player.wpm} WPM</span>
                  </div>

                  {/* Show progress bar OR position badge based on finish status */}
                  {isFinished ? (
                    <div className="finish-position-badge position-display-font" style={{ '--player-color': playerTheme.primary }}>
                      <span className="medal-icon">
                        {finishPosition === 1 && '🥇'}
                        {finishPosition === 2 && '🥈'}
                        {finishPosition === 3 && '🥉'}
                        {finishPosition > 3 && '🏅'}
                      </span>
                      <span className="position-text">
                        {finishPosition === 1 && '1st'}
                        {finishPosition === 2 && '2nd'}
                        {finishPosition === 3 && '3rd'}
                        {finishPosition > 3 && `${finishPosition}th`}
                      </span>
                    </div>
                  ) : (
                    <div className={`progress-bar-track ${showError ? 'has-errors' : ''}`}>
                      <motion.div
                        className={`progress-bar-fill ${showError ? 'error' : ''}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${player.progress}%` }}
                        transition={{ duration: 0.2 }}
                        style={{ '--player-color': showError ? '#ef4444' : playerTheme.primary }}
                      />
                      {showError && (
                        <motion.div
                          className="progress-bar-error"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((currentErrors / activeText.length) * 100, 100 - player.progress)}%` }}
                          transition={{ duration: 0.1 }}
                          style={{ left: `${player.progress}%` }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spectator Mode: Player Selector (Standalone Section) */}
      {isSpectating && (
        <div className="spectator-selector-section">
          <div className="spectator-selector-header">
            <span className="spectator-icon">👁️</span>
            <span className="spectator-label">SPECTATING</span>
          </div>
          <div className="spectator-player-buttons">
            {players.filter(p => !eliminatedPlayers.includes(p.id) && p.id !== currentPlayer?.id).map(p => (
              <button
                key={p.id}
                className={`spectator-player-btn ${spectatorTargetId === p.id ? 'active' : ''}`}
                onClick={() => setSpectatorTargetId(p.id)}
              >
                {p.avatarUrl ? (
                  <img src={p.avatarUrl} alt={p.name} className="spectator-btn-avatar" />
                ) : (
                  <span className="spectator-btn-initial">{p.name?.charAt(0)}</span>
                )}
                <span className="spectator-btn-name">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Countdown Top Bar */}
      <AnimatePresence>
        {gamePhase === 'countdown' && (
          <motion.div
            className="countdown-topbar"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="countdown-bar-content">
              <div className="countdown-indicators">
                <motion.div
                  className={`countdown-dot-circle ${countdownNumber <= 3 ? 'active ready' : ''}`}
                  animate={countdownNumber === 3 ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className={`countdown-dot-circle ${countdownNumber <= 2 ? 'active set' : ''}`}
                  animate={countdownNumber === 2 ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className={`countdown-dot-circle ${countdownNumber <= 1 ? 'active go' : ''}`}
                  animate={countdownNumber === 1 ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tier Mode Intermission Modal - Expanded Form */}
      <AnimatePresence>
        {showIntermission && mode === 'tier' && (
          <motion.div
            className="intermission-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="intermission-content expanded"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring' }}
            >
              {/* Header: Round Status */}
              <div className="intermission-header-expanded">
                <div className="round-details">
                  <span className="round-number">ROUND {roundIndex + 1} COMPLETE</span>
                  <div className="difficulty-tag" data-difficulty={TIER_SCHEDULE[roundIndex]}>
                    {TIER_SCHEDULE[roundIndex]?.toUpperCase()}
                  </div>
                </div>
                <div className="completion-status">
                  {failedThisRound ? (
                    <span className="status-badge failed">TIME EXPIRED</span>
                  ) : isRoundComplete ? (
                    <span className="status-badge success">PASSED</span>
                  ) : (
                    <span className="status-badge waiting">WAITING...</span>
                  )}
                </div>
              </div>

              {/* Main Report: Wide View */}
              <div className="intermission-report-wide">
                <div className="report-stat primary">
                  <span className="label">WPM</span>
                  <span className="value">{tierRoundStats.wpm}</span>
                </div>
                <div className="report-stat">
                  <span className="label">TIME</span>
                  <span className="value">
                    {failedThisRound ? 'DNF' : `${completionTime || 0}s`}
                  </span>
                </div>
                {TIER_SCHEDULE[roundIndex] === 'hard' && (
                  <div className="report-stat penalty">
                    <span className="label">PENALTY</span>
                    <span className="value">-{tierRoundStats.penaltyTimeUsed || 0}s</span>
                  </div>
                )}
              </div>

              {/* Leaderboard Table */}
              <div className="intermission-leaderboard-wide">
                <div className="lb-header">
                  <span>RANK</span>
                  <span>PLAYER</span>
                  <span>WPM</span>
                  <span>PRECISION</span>
                  <span>STATUS</span>
                </div>
                {roundResults.map((result, idx) => (
                  <div key={result.playerId} className={`lb-row ${result.playerId === currentPlayer?.id ? 'me' : ''}`}>
                    <span className="lb-rank">#{result.position || idx + 1}</span>
                    <span className="lb-name">{result.playerName}</span>
                    <span className="lb-wpm">{result.failed ? '--' : result.wpm}</span>
                    <span className="lb-precision">{result.failed ? '--' : `${result.precision || result.accuracy || 0}%`}</span>
                    <span className={`lb-status ${result.failed ? 'failed' : 'passed'}`}>
                      {result.isEliminated ? 'ELIMINATED' : result.failed ? 'FAILED' : 'PASSED'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer: Next Round Countdown OR Eliminated Notice */}
              <div className="intermission-footer-wide">
                {!isEliminated ? (
                  <div className="next-round-info">
                    <span className="label">NEXT ROUND:</span>
                    <span className="difficulty">{TIER_SCHEDULE[roundIndex + 1]?.toUpperCase() || 'FINISH'}</span>
                    <div className="countdown-loader-container">
                      <motion.div
                        className="countdown-loader-bar"
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: intermissionCountdown, ease: "linear" }}
                      />
                      <span className="countdown-text">{intermissionCountdown}s</span>
                    </div>
                  </div>
                ) : (
                  <div className="eliminated-notice-wide">
                    <span className="icon">💀</span>
                    <span className="text">YOU HAVE BEEN ELIMINATED</span>
                    <p className="eliminated-subtitle">Choose to spectate or return to lobby</p>
                  </div>
                )}

                <div className="footer-actions">
                  {isEliminated ? (
                    <>
                      <button className="spectate-btn" onClick={() => {
                        // Get first active (non-eliminated) player as default target
                        const activePlayers = players.filter(p => !eliminatedPlayers.includes(p.id) && p.id !== currentPlayer?.id);
                        if (activePlayers.length > 0) {
                          setSpectatorTargetId(activePlayers[0].id);
                        }
                        setIsSpectating(true);
                        setShowIntermission(false);
                      }}>
                        Spectate
                      </button>
                      <button className="lobby-btn" onClick={() => navigate(`/lobby/${roomId}`)}>
                        Return to Lobby
                      </button>
                    </>
                  ) : (
                    <button className="quit-btn" onClick={handleQuitTierGame}>Leave Game</button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Overlay - Leaderboard Results */}
      <AnimatePresence>
        {gamePhase === 'finished' && (() => {
          // For tier mode with detailed results
          const isTierDetailed = mode === 'tier' && tierGameEnded && tierFinalStats;

          // Build leaderboard - for tier mode use roundResults from server, otherwise build from players
          let leaderboard;

          if (isTierDetailed && roundResults.length > 0) {
            // Use the server-provided detailed leaderboard for tier mode
            leaderboard = roundResults.map((entry, idx) => ({
              id: entry.playerId,
              name: entry.playerName || 'Player',
              isMe: entry.playerId === currentPlayer?.id,
              wpm: entry.avgWpm || 0,
              accuracy: entry.avgAccuracy || 0,
              completedRounds: entry.completedRounds || 0,
              chances: entry.chances ?? 0,
              isEliminated: entry.isEliminated || false,
              bestWpm: entry.bestWpm || 0,
              position: idx + 1,
              progress: 100 // Tier mode doesn't use progress bars
            }));
          } else {
            // Build from players for non-tier or fallback
            leaderboard = players.map(p => {
              const isMe = p.id === currentPlayer?.id;
              const pData = isMe ? null : opponentProgress[p.id];

              return {
                id: p.id,
                name: isMe ? (p.name || 'You') : (p.name || 'Player'),
                avatarUrl: p.avatarUrl,
                theme: p.theme,
                isMe,
                wpm: isMe
                  ? (isTierDetailed ? tierFinalStats.myStats?.avgWpm : calculateWPM())
                  : (pData?.wpm || 0),
                accuracy: isMe
                  ? (isTierDetailed ? tierFinalStats.myStats?.avgAccuracy : calculateAccuracy())
                  : (pData?.accuracy ?? 0),
                progress: isMe ? calculateProgress() : (pData?.progress || 0),
                completed: isMe ? (calculateProgress() >= 100) : (pData?.completed || false),
                completionTime: isMe ? completionTime : pData?.completionTime,
                roundsWon: isMe
                  ? (isTierDetailed ? tierFinalStats.myStats?.roundsWon : roundsWon)
                  : (pData?.roundsWon || 0)
              };
            }).sort((a, b) => {
              // Sort by: completion first, then progress, then WPM
              if (a.completed && !b.completed) return -1;
              if (!a.completed && b.completed) return 1;
              if (a.completed && b.completed) {
                // Both completed - sort by time or WPM
                if (a.completionTime && b.completionTime) {
                  return a.completionTime - b.completionTime;
                }
                return b.wpm - a.wpm;
              }
              // Neither completed - sort by progress
              if (a.progress !== b.progress) return b.progress - a.progress;
              return b.wpm - a.wpm;
            });

            // Assign positions
            leaderboard.forEach((p, idx) => {
              p.position = idx + 1;
            });
          }

          // Find my position
          const myPosition = leaderboard.find(p => p.isMe)?.position || 1;
          const myStats = leaderboard.find(p => p.isMe);

          // Total players count (for voting)
          const totalPlayers = players?.length || 2;
          const votesNeeded = totalPlayers;
          const currentVotes = goAgainVotes.length;

          // Position labels and colors
          const positionLabels = ['1st', '2nd', '3rd', '4th'];
          const positionColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#64748b']; // gold, silver, bronze, gray

          // Handle Go Again vote
          const handleVoteGoAgain = () => {
            if (!hasVotedGoAgain && socket && roomId) {
              setHasVotedGoAgain(true);
              socket.emit('vote_go_again', { roomId, playerId: currentPlayer?.id });
            }
          };

          return (
            <motion.div
              className="gameover-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="gameover-content-leaderboard"
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring' }}
              >
                {/* Result Banner - Your Position */}
                <div className={`result-banner position-${myPosition}`}>
                  <div className="banner-header">
                    <span className="position-badge" style={{ '--pos-color': positionColors[myPosition - 1] }}>
                      {positionLabels[myPosition - 1] || `${myPosition}th`}
                    </span>
                  </div>
                  <span className="result-text">
                    {myPosition === 1 ? 'VICTORY!' : myPosition === 2 ? 'CLOSE ONE!' : myPosition === 3 ? 'GOOD TRY!' : 'KEEP PRACTICING!'}
                  </span>
                  <div className="my-stats-row">
                    <span className="my-stat">{myStats?.wpm || 0} WPM</span>
                    <span className="my-stat-divider">•</span>
                    <span className="my-stat">{myStats?.accuracy || 0}% Acc</span>
                    {isTierDetailed && (
                      <>
                        <span className="my-stat-divider">•</span>
                        <span className="my-stat">{myStats?.roundsWon || 0} Rounds</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tier Mode: Horizontal Player Report Cards */}
                {isTierDetailed ? (
                  <div className="tier-horizontal-report">
                    {leaderboard.map((player, idx) => {
                      const playerTheme = PLAYER_THEMES[player.theme] || PLAYER_THEMES[Object.keys(PLAYER_THEMES)[idx]] || PLAYER_THEMES.green;
                      const isWinner = idx === 0 && !player.isEliminated;
                      return (
                        <motion.div
                          key={player.id}
                          className={`tier-player-card ${player.isMe ? 'you' : ''} ${isWinner ? 'winner' : ''} ${player.isEliminated ? 'eliminated' : ''}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.15 }}
                        >
                          {/* Position Badge */}
                          <div className="tier-card-position" style={{ '--pos-color': positionColors[idx] || '#64748b' }}>
                            {isWinner && <span className="crown-icon">👑</span>}
                            <span className="position-number">{player.isEliminated ? '💀' : positionLabels[idx] || `${idx + 1}th`}</span>
                          </div>

                          {/* Player Info */}
                          <div className="tier-card-header">
                            <span className="tier-card-avatar" style={{ '--avatar-color': playerTheme?.primary || 'var(--primary)' }}>
                              {player.avatarUrl ? (
                                <img src={player.avatarUrl} alt={player.name} />
                              ) : (
                                player.name?.charAt(0).toUpperCase() || 'P'
                              )}
                            </span>
                            <span className="tier-card-name">
                              {player.isMe ? 'You' : player.name}
                              {player.isMe && <span className="you-indicator">★</span>}
                            </span>
                          </div>

                          {/* Stats Grid */}
                          <div className="tier-card-stats">
                            <div className="tier-stat-item primary">
                              <span className="tier-stat-value">{player.wpm || 0}</span>
                              <span className="tier-stat-label">Avg WPM</span>
                            </div>
                            <div className="tier-stat-item">
                              <span className="tier-stat-value">{player.accuracy || 0}%</span>
                              <span className="tier-stat-label">Accuracy</span>
                            </div>
                            <div className="tier-stat-item">
                              <span className="tier-stat-value">{player.completedRounds || 0}/{TOTAL_TIER_ROUNDS}</span>
                              <span className="tier-stat-label">Rounds</span>
                            </div>
                            <div className="tier-stat-item">
                              <span className="tier-stat-value">{player.bestWpm || player.wpm || 0}</span>
                              <span className="tier-stat-label">Best WPM</span>
                            </div>
                          </div>

                          {/* Status Indicator */}
                          <div className={`tier-card-status ${player.isEliminated ? 'eliminated' : isWinner ? 'winner' : 'survived'}`}>
                            {player.isEliminated ? (
                              <span>❌ Eliminated</span>
                            ) : isWinner ? (
                              <span>🏆 Champion</span>
                            ) : (
                              <span>✓ Finished</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  /* Standard Leaderboard Table for non-tier modes */
                  <div className="leaderboard-table">
                    <div className="leaderboard-header">
                      <span className="lb-col rank">Rank</span>
                      <span className="lb-col player">Player</span>
                      <span className="lb-col wpm">WPM</span>
                      <span className="lb-col acc">Acc</span>
                      <span className="lb-col progress">Progress</span>
                    </div>
                    {leaderboard.map((player, idx) => {
                      const playerTheme = PLAYER_THEMES[player.theme] || PLAYER_THEMES[Object.keys(PLAYER_THEMES)[idx]] || PLAYER_THEMES.green;
                      return (
                        <motion.div
                          key={player.id}
                          className={`leaderboard-row ${player.isMe ? 'you' : ''} ${idx === 0 ? 'winner' : ''}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <span className="lb-col rank">
                            <span className="position-num position-display-font" style={{ '--pos-color': positionColors[idx] || '#64748b' }}>
                              {idx === 0 && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                              )}
                              {positionLabels[idx] || `${idx + 1}th`}
                            </span>
                          </span>
                          <span className="lb-col player">
                            <span className="lb-avatar" style={{ '--avatar-color': playerTheme.primary }}>
                              {player.avatarUrl ? (
                                <img src={player.avatarUrl} alt={player.name} />
                              ) : (
                                player.name?.charAt(0).toUpperCase() || 'P'
                              )}
                            </span>
                            <span className="lb-name">{player.isMe ? 'You' : player.name}</span>
                            {player.isMe && <span className="you-tag">YOU</span>}
                          </span>
                          <span className="lb-col wpm">{player.wpm}</span>
                          <span className="lb-col acc">{typeof player.accuracy === 'number' ? `${player.accuracy}%` : '--'}</span>
                          <span className="lb-col progress">
                            <div className="lb-progress-bar">
                              <div
                                className="lb-progress-fill"
                                style={{ width: `${player.progress}%`, background: playerTheme.primary }}
                              />
                            </div>
                            <span className="lb-progress-text">{Math.round(player.progress)}%</span>
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Mode Info */}
                {isTierDetailed && (
                  <div className="tier-summary">
                    <span className="tier-label">
                      Tier Mode • {tierFinalStats.myStats?.completedRounds || cumulativeStats.roundsPlayed}/{TOTAL_TIER_ROUNDS} Rounds
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="gameover-buttons">
                  {mode === 'random' && (
                    <div className="go-again-container">
                      <button
                        className={`gameover-btn primary ${hasVotedGoAgain ? 'voted' : ''}`}
                        onClick={handleVoteGoAgain}
                        disabled={hasVotedGoAgain}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 4v6h6M23 20v-6h-6" />
                          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                        </svg>
                        {hasVotedGoAgain ? 'Voted!' : 'Go Again'}
                      </button>
                      <span className="vote-indicator">
                        {currentVotes}/{votesNeeded} ready
                      </span>
                    </div>
                  )}
                  <button className="gameover-btn secondary" onClick={onLeave}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Back to Lobby
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Player Disconnected Overlay */}
      <AnimatePresence>
        {playerDisconnected && (
          <motion.div
            className="disconnect-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="disconnect-content"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
            >
              <div className="disconnect-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                  <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                  <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
                  <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
              </div>
              <h3 className="disconnect-title">Player Disconnected</h3>
              <p className="disconnect-text">
                {disconnectedPlayer?.name || 'A player'} has left the game.
              </p>
              <p className="disconnect-text">
                Waiting for reconnection...
              </p>
              <div className="disconnect-timer">
                <span className="timer-number">{reconnectTimer}</span>
                <span className="timer-label">seconds remaining</span>
              </div>
              <button className="disconnect-leave-btn" onClick={onLeave}>
                Leave Now
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiplayerGame;
