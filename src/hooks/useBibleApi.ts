const API_URL = 'https://bible-api.com/';

export const BIBLE_VERSIONS = {
  kjv: 'King James Version',
  acf2007: 'Almeida Corrigida Fiel 2007',
  acf2011: 'Almeida Corrigida Fiel 2011',
};

export type BibleVersion = keyof typeof BIBLE_VERSIONS;

  }, []);

  const fetchVerse = useCallback(async (book: string, chapter: number, verse: number, version: BibleVersion = 'kjv') => {
    setLoading(true);
    setError(null);
    try {
      // The API uses 'acf' for both ACF versions.
      const apiVersion = version.startsWith('acf') ? 'acf' : version;
      const response = await fetch(`${API_URL}${book}+${chapter}:${verse}?translation=${apiVersion}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }