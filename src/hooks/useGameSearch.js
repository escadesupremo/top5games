import { useState, useEffect, useCallback } from 'react';
import { supabase, RAWG_API_KEY } from '../config/supabase';
import { getBase64Image } from '../utils/imageUtils';

export function useGameSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGames, setSelectedGames] = useState([]);
  const [cachedImages, setCachedImages] = useState({});

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchGames(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchGames = async (query) => {
    setIsSearching(true);
    try {
      // First, search our game_cache table
      const { data: cachedGames, error: cacheError } = await supabase
        .from('game_cache')
        .select('game_id, game_name, game_slug, released, rating, metacritic, original_image_url, cached_image_base64, times_selected')
        .ilike('game_name', `%${query}%`)
        .order('times_selected', { ascending: false })
        .limit(10);

      if (cacheError) {
        // Cache search failed, continue with API search
      }

      let results = [];
      if (cachedGames && cachedGames.length > 0) {
        results = cachedGames.map((game) => ({
          id: game.game_id,
          name: game.game_name,
          slug: game.game_slug,
          released: game.released,
          rating: game.rating,
          metacritic: game.metacritic,
          background_image: game.cached_image_base64 || game.original_image_url,
          _fromCache: true,
        }));
      }

      // Supplement with RAWG API if needed
      if (results.length < 10) {
        const response = await fetch(
          `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=10`
        );
        const data = await response.json();

        const cachedIds = new Set(results.map((g) => g.id));
        const newResults = (data.results || []).filter((game) => !cachedIds.has(game.id)).slice(0, 10 - results.length);

        results = [...results, ...newResults];
      }

      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const selectGame = useCallback(async (game) => {
    if (selectedGames.length >= 5 || selectedGames.find((g) => g.id === game.id)) {
      return;
    }

    setSelectedGames((prev) => [...prev, game]);
    setSearchQuery('');
    setSearchResults([]);

    // Cache image
    if (game.background_image) {
      setCachedImages((prev) => ({ ...prev, [game.id]: 'loading' }));

      try {
        let base64;
        if (game._fromCache && game.background_image?.startsWith('data:')) {
          base64 = game.background_image;
        } else {
          base64 = await getBase64Image(game.background_image);
        }

        setCachedImages((prev) => ({ ...prev, [game.id]: base64 }));

        // Save to game_cache
        await supabase.rpc('upsert_game_cache', {
          p_game_id: game.id,
          p_game_name: game.name,
          p_game_slug: game.slug || null,
          p_released: game.released || null,
          p_rating: game.rating || null,
          p_metacritic: game.metacritic || null,
          p_original_image_url: game.background_image,
          p_cached_image_base64: base64,
          p_platforms: game.platforms?.map((p) => p.platform?.name).filter(Boolean) || null,
          p_genres: game.genres?.map((g) => g.name).filter(Boolean) || null,
        });
      } catch {
        setCachedImages((prev) => ({ ...prev, [game.id]: game.background_image }));
      }
    }
  }, [selectedGames]);

  const removeGame = useCallback((gameId) => {
    setSelectedGames((prev) => prev.filter((g) => g.id !== gameId));
  }, []);

  const moveUp = useCallback((index) => {
    if (index > 0) {
      setSelectedGames((prev) => {
        const newGames = [...prev];
        [newGames[index], newGames[index - 1]] = [newGames[index - 1], newGames[index]];
        return newGames;
      });
    }
  }, []);

  const moveDown = useCallback((index) => {
    setSelectedGames((prev) => {
      if (index < prev.length - 1) {
        const newGames = [...prev];
        [newGames[index], newGames[index + 1]] = [newGames[index + 1], newGames[index]];
        return newGames;
      }
      return prev;
    });
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    selectedGames,
    setSelectedGames,
    cachedImages,
    setCachedImages,
    selectGame,
    removeGame,
    moveUp,
    moveDown,
  };
}
