import { useState, useEffect } from 'react';
import { supabase, SUPABASE_URL } from '../config/supabase';

// Fallback themes in case Supabase fails
const FALLBACK_BACKGROUNDS = {
  midnight: {
    name: 'Midnight',
    type: 'gradient',
    gradient: 'linear-gradient(to bottom, #1a1a2e, #16213e, #0f3460)',
    textColor: '#ffffff',
    secondaryColor: 'rgba(255, 255, 255, 0.7)',
    accentColor: '#e94560',
  },
  sunset: {
    name: 'Sunset',
    type: 'gradient',
    gradient: 'linear-gradient(to bottom, #ff6b6b, #feca57, #ff9ff3)',
    textColor: '#ffffff',
    secondaryColor: 'rgba(255, 255, 255, 0.8)',
    accentColor: '#ffffff',
  },
  ocean: {
    name: 'Ocean',
    type: 'gradient',
    gradient: 'linear-gradient(to bottom, #667eea, #764ba2)',
    textColor: '#ffffff',
    secondaryColor: 'rgba(255, 255, 255, 0.7)',
    accentColor: '#ffeaa7',
  },
  forest: {
    name: 'Forest',
    type: 'gradient',
    gradient: 'linear-gradient(to bottom, #134e5e, #71b280)',
    textColor: '#ffffff',
    secondaryColor: 'rgba(255, 255, 255, 0.7)',
    accentColor: '#f9ca24',
  },
};

export function useBackgrounds() {
  const [backgrounds, setBackgrounds] = useState(FALLBACK_BACKGROUNDS);
  const [selectedBackground, setSelectedBackground] = useState('midnight');
  const [backgroundsLoading, setBackgroundsLoading] = useState(true);

  useEffect(() => {
    async function fetchBackgrounds() {
      try {
        const { data, error } = await supabase
          .from('backgrounds')
          .select('*')
          .eq('is_active', true)
          .order('type', { ascending: false })
          .order('sort_order');

        if (error) throw error;

        if (data && data.length > 0) {
          const bgObject = {};
          data.forEach((bg) => {
            bgObject[bg.key] = {
              name: bg.name,
              type: bg.type,
              gradient: bg.gradient,
              backgroundImage: bg.image_path
                ? `${SUPABASE_URL}/storage/v1/object/public/backgrounds/${bg.image_path}`
                : null,
              textColor: bg.text_color,
              secondaryColor: bg.secondary_color,
              accentColor: bg.accent_color,
              overlay: bg.overlay,
            };
          });
          setBackgrounds(bgObject);
          setSelectedBackground(Object.keys(bgObject)[0]);
        }
      } catch {
        // Keep fallback backgrounds on error
      } finally {
        setBackgroundsLoading(false);
      }
    }
    fetchBackgrounds();
  }, []);

  // Ensure selectedBackground is valid after backgrounds load
  useEffect(() => {
    if (!backgroundsLoading && Object.keys(backgrounds).length > 0) {
      if (!backgrounds[selectedBackground]) {
        setSelectedBackground(Object.keys(backgrounds)[0]);
      }
    }
  }, [backgrounds, backgroundsLoading, selectedBackground]);

  const currentTheme = backgrounds[selectedBackground] || null;

  return {
    backgrounds,
    selectedBackground,
    setSelectedBackground,
    backgroundsLoading,
    currentTheme,
  };
}
