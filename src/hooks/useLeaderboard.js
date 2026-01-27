import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentLists, setRecentLists] = useState([]);
  const [listCount, setListCount] = useState(0);
  const [leaderboardExpanded, setLeaderboardExpanded] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('top5_lists')
        .select(
          'game_1_name, game_1_image, game_2_name, game_2_image, game_3_name, game_3_image, game_4_name, game_4_image, game_5_name, game_5_image'
        );

      if (error) throw error;

      // Count game occurrences
      const gameCounts = {};
      data.forEach((list) => {
        for (let i = 1; i <= 5; i++) {
          const gameName = list[`game_${i}_name`];
          const gameImage = list[`game_${i}_image`];
          if (gameName) {
            if (!gameCounts[gameName]) {
              gameCounts[gameName] = { count: 0, image: gameImage, name: gameName };
            }
            gameCounts[gameName].count++;
          }
        }
      });

      // Sort by count and get top 10
      const sorted = Object.values(gameCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setLeaderboard(sorted);
    } catch {
      // Silently handle leaderboard load errors
    }
  }, []);

  const loadRecentLists = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('top5_lists')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentLists(data || []);
    } catch {
      // Silently handle recent lists load errors
    }
  }, []);

  const loadListCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('top5_lists')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setListCount(count || 0);
    } catch {
      // Silently handle list count load errors
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
    loadRecentLists();
    loadListCount();
  }, [loadLeaderboard, loadRecentLists, loadListCount]);

  return {
    leaderboard,
    recentLists,
    listCount,
    leaderboardExpanded,
    setLeaderboardExpanded,
    loadLeaderboard,
    loadRecentLists,
    loadListCount,
  };
}
