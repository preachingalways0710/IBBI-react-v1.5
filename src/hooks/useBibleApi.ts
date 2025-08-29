import { useState, useCallback } from 'react';

// New API endpoint
const API_URL = 'https://bolls.life/get-text';

export const BIBLE_VERSIONS = {
  kjv: 'King James Version',
  acf: 'Almeida Corrigida Fiel', // This API provides one ACF version
};

export type BibleVersion = keyof typeof BIBLE_VERSIONS;

export interface Verse {
  bookname: string;
  chapter: string;
  verse: string;
  text: string;
}

export interface BibleApiResponse {
  bookname: string;
  chapter: string;
  verses: Verse[];
}

export const useBibleApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVerse = useCallback(async (book: string, chapter: number, verse: number, version: BibleVersion = 'kjv') => {
    setLoading(true);
    setError(null);
    try {
      // The new API uses a different URL structure
      const response = await fetch(`${API_URL}/${version}/${book}/${chapter}/${verse}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // The new API returns an array of verses, even for a single verse query.
      // We will adapt the response to match the structure the app expects.
      if (data && data.length > 0) {
        const verseData = data[0];
        return {
          reference: `${verseData.bookname} ${verseData.chapter}:${verseData.verse}`,
          verses: [{
            book_id: verseData.bookname.toLowerCase().replace(/\s/g, ''),
            book_name: verseData.bookname,
            chapter: parseInt(verseData.chapter, 10),
            verse: parseInt(verseData.verse, 10),
            text: verseData.text,
          }],
          text: verseData.text,
          translation_id: version.toUpperCase(),
          translation_name: BIBLE_VERSIONS[version],
          translation_note: 'bolls.life',
        };
      } else {
        throw new Error('Verse not found or invalid response');
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      } else {
        setError(new Error('An unknown error occurred'));
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // This function might need to be adjusted or removed if not used elsewhere,
  // as the new API is more efficient at fetching single verses.
  const fetchChapter = useCallback(async (book: string, chapter: number, version: BibleVersion = 'kjv') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/${version}/${book}/${chapter}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.map((v: Verse) => ({
          book_id: v.bookname.toLowerCase().replace(/\s/g, ''),
          book_name: v.bookname,
          chapter: parseInt(v.chapter, 10),
          verse: parseInt(v.verse, 10),
          text: v.text,
      }));
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      } else {
        setError(new Error('An unknown error occurred'));
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);


  return { loading, error, fetchVerse, fetchChapter };
};