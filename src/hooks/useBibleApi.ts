import { useState, useCallback } from 'react';
import { BIBLE_BOOKS } from '../../constants';
import { BibleVersion } from '../../types';

const BOLLS_LIFE_API_URL = 'https://bolls.life/get-text';
const BIBLE_API_URL = 'https://bible-api.com'; // Correct API for ACF 2007 (TBS)

export const BIBLE_VERSIONS = {
  KJV: 'King James Version',
  ACF2011: 'Almeida Corrigida Fiel (2011)',
  ACF2007: 'Almeida Corrigida Fiel (2007)',
};

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

  const fetchVerse = useCallback(async (book: string, chapter: number, verse: number, version: BibleVersion) => {
    setLoading(true);
    setError(null);
    try {
      if (version === BibleVersion.ACF2007) {
        // Logic for bible-api.com (ACF 2007 - Trinitarian)
        const bookPtName = BIBLE_BOOKS.find(b => b.name === book)?.pt_name;
        if (!bookPtName) throw new Error(`Book portuguese name not found for ${book}`);
        
        const response = await fetch(`${BIBLE_API_URL}/${encodeURIComponent(bookPtName)}+${chapter}:${verse}?translation=acf`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        return {
          reference: data.reference,
          verses: data.verses.map((v: any) => ({
            book_id: v.book_id,
            book_name: v.book_name,
            chapter: v.chapter,
            verse: v.verse,
            text: v.text,
          })),
          text: data.text.trim(),
          translation_id: 'ACF',
          translation_name: BIBLE_VERSIONS.ACF2007,
          translation_note: data.translation_note,
        };
      } else {
        // Logic for bolls.life API (KJV and ACF2011)
        const apiVersion = version === BibleVersion.KJV ? 'kjv' : 'acf';
        const bookForApi = BIBLE_BOOKS.find(b => b.name === book)?.api_name || book;
        const response = await fetch(`${BOLLS_LIFE_API_URL}/${apiVersion}/${bookForApi}/${chapter}/${verse}/`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

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
            translation_name: BIBLE_VERSIONS[version as keyof typeof BIBLE_VERSIONS],
            translation_note: 'bolls.life',
          };
        } else {
          throw new Error('Verse not found or invalid response');
        }
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

  const fetchChapter = useCallback(async (book: string, chapter: number, version: BibleVersion) => {
    setLoading(true);
    setError(null);
    try {
      if (version === BibleVersion.ACF2007) {
        // Logic for bible-api.com (ACF 2007 - Trinitarian)
        const bookPtName = BIBLE_BOOKS.find(b => b.name === book)?.pt_name;
        if (!bookPtName) throw new Error(`Book portuguese name not found for ${book}`);

        const response = await fetch(`${BIBLE_API_URL}/${encodeURIComponent(bookPtName)}+${chapter}?translation=acf`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        return data.verses.map((v: any) => ({
          book_id: v.book_id,
          book_name: v.book_name,
          chapter: v.chapter,
          verse: v.verse,
          text: v.text,
        }));

      } else {
        // Logic for bolls.life API (KJV and ACF2011)
        const apiVersion = version === BibleVersion.KJV ? 'kjv' : 'acf';
        const bookForApi = BIBLE_BOOKS.find(b => b.name === book)?.api_name || book;
        const response = await fetch(`${BOLLS_LIFE_API_URL}/${apiVersion}/${bookForApi}/${chapter}/`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.map((v: Verse) => ({
            book_id: v.bookname.toLowerCase().replace(/\s/g, ''),
            book_name: v.bookname,
            chapter: parseInt(v.chapter, 10),
            verse: parseInt(v.verse, 10),
            text: v.text,
        }));
      }
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