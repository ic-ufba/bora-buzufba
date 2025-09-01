import { useCallback, useEffect, useState } from 'react';

type LineSource = 'home' | 'lines' | 'stations';

interface FavoritesMeta {
  lineSources: Record<string, LineSource>;
}

const META_STORAGE_KEY = 'borabuzufba-favorites-meta';

const readMeta = (): FavoritesMeta => {
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (!raw) return { lineSources: {} };
    const parsed = JSON.parse(raw);
    return {
      lineSources: typeof parsed?.lineSources === 'object' && parsed.lineSources ? parsed.lineSources : {}
    };
  } catch {
    return { lineSources: {} };
  }
};

const writeMeta = (meta: FavoritesMeta) => {
  localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
};

export const useFavoritesMeta = () => {
  const [meta, setMeta] = useState<FavoritesMeta>({ lineSources: {} });

  useEffect(() => {
    setMeta(readMeta());
  }, []);

  const setLineSource = useCallback((lineId: string, source: LineSource) => {
    setMeta(prev => {
      const updated: FavoritesMeta = {
        ...prev,
        lineSources: { ...prev.lineSources, [lineId]: source }
      };
      writeMeta(updated);
      return updated;
    });
  }, []);

  const getLineSource = useCallback((lineId: string): LineSource | undefined => {
    return meta.lineSources[lineId];
  }, [meta.lineSources]);

  const clearLine = useCallback((lineId: string) => {
    setMeta(prev => {
      const { [lineId]: _, ...rest } = prev.lineSources;
      const updated: FavoritesMeta = { ...prev, lineSources: rest };
      writeMeta(updated);
      return updated;
    });
  }, []);

  return { meta, setLineSource, getLineSource, clearLine };
};

export type { LineSource };


