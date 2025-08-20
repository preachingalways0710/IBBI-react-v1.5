


import { BibleVersion, Verse } from '../types';
import { ACF_2007_API_URL, ACF_2011_API_URL, BIBLE_BOOKS } from '../constants';

async function fetchKJV(bookName: string, chapter: number): Promise<Verse[]> {
  const bookData = BIBLE_BOOKS.find(b => b.name === bookName);
  if (!bookData) {
    throw new Error(`Could not find data for book: ${bookName}`);
  }
  const bookForApi = (bookData.api_name || bookData.name).replace(/\s/g, '+');
  const url = `${ACF_2007_API_URL}/${bookForApi}+${chapter}?translation=kjv`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`KJV API error (${response.status}): ${errorData}`);
  }
  const data = await response.json();
  if (!data.verses) {
    throw new Error("KJV API returned unexpected data format.");
  }
  return data.verses.map((v: any) => ({
    number: v.verse,
    text: v.text.trim().replace(/\\n/g, ' '),
  }));
}

async function fetchACF2007(bookName: string, chapter: number): Promise<Verse[]> {
  const bookData = BIBLE_BOOKS.find(b => b.name === bookName);
  if (!bookData) {
    throw new Error(`Could not find data for book: ${bookName}`);
  }
  const bookForApi = bookData.pt_name.replace(/\s/g, '+');
  const url = `${ACF_2007_API_URL}/${bookForApi}+${chapter}?translation=almeida`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`ACF 2007 API error (${response.status}): ${errorData}`);
  }
  const data = await response.json();
  if (!data.verses) {
    throw new Error("ACF 2007 API returned unexpected data format.");
  }
  return data.verses.map((v: any) => ({
    number: v.verse,
    text: v.text.trim().replace(/\\n/g, ' '),
  }));
}


async function fetchACF2011(bookName: string, chapter: number): Promise<Verse[]> {
  const bookData = BIBLE_BOOKS.find(b => b.name === bookName);
  if (!bookData) {
    throw new Error(`Could not find data for book: ${bookName}`);
  }
  const abbrev = bookData.pt_abbrev;
  const url = `${ACF_2011_API_URL}/verses/acf/${abbrev}/${chapter}`;
  
  const response = await fetch(url);
  if (!response.ok) {
     const errorData = await response.text();
     try {
       const parsedError = JSON.parse(errorData);
       if (parsedError && parsedError.msg) {
         throw new Error(`ACF 2011 API error: ${parsedError.msg}`);
       }
     } catch (e) {
       // Not a JSON error, throw original text.
     }
     throw new Error(`ACF 2011 API error (${response.status}): ${errorData}`);
  }
  const data = await response.json();
  if (!Array.isArray(data.verses)) {
     throw new Error("ACF 2011 API returned unexpected data format.");
  }
  return data.verses.map((v: any) => ({
    number: v.number,
    text: v.text.trim(),
  }));
}

export async function fetchChapter(
  version: BibleVersion,
  bookName: string,
  chapter: number
): Promise<Verse[]> {
  try {
    switch (version) {
      case BibleVersion.KJV:
        return await fetchKJV(bookName, chapter);
      case BibleVersion.ACF2011:
        return await fetchACF2011(bookName, chapter);
      case BibleVersion.ACF2007:
        return await fetchACF2007(bookName, chapter);
      default:
        throw new Error(`Unsupported Bible version: ${version}`);
    }
  } catch (error) {
    console.error(`Failed to fetch chapter for ${version} (${bookName} ${chapter}):`, error);
    throw error;
  }
}

export async function fetchCrossReferenceText(reference: string, version: BibleVersion): Promise<string> {
    const bookNamesForRegex = BIBLE_BOOKS.map(b => b.name.replace(/\s/g, '\\s')).join('|');
    const verseRefRegex = new RegExp(`^(${bookNamesForRegex})\\s+(\\d{1,3})(?::(\\d{1,3}(?:-\\d{1,3})?))?$`, 'i');

    const match = reference.match(verseRefRegex);
    if (!match) {
        throw new Error(`Invalid reference format: ${reference}`);
    }

    const [, bookName, chapterStr, versePart] = match;
    const chapter = parseInt(chapterStr, 10);
    
    const hasVersePart = !!versePart;
    let startVerse = 1;
    let endVerse = -1; // Indicates whole chapter if it remains -1

    if (hasVersePart) {
        const verseRangeParts = versePart.split('-').map(Number);
        startVerse = verseRangeParts[0];
        endVerse = verseRangeParts.length > 1 ? verseRangeParts[1] : startVerse;
    }

    const bookData = BIBLE_BOOKS.find(b => b.name.toLowerCase() === bookName.toLowerCase());
    if (!bookData) {
        throw new Error(`Book not found: ${bookName}`);
    }

    try {
        if (version === BibleVersion.KJV || version === BibleVersion.ACF2007) {
            const apiTranslation = version === BibleVersion.KJV ? 'kjv' : 'almeida';
            const bookForApi = version === BibleVersion.KJV
                ? (bookData.api_name || bookData.name).replace(/\s/g, '+')
                : bookData.pt_name.replace(/\s/g, '+');
            
            let url;
            if (hasVersePart) {
                const verseRangeParam = endVerse > startVerse ? `${startVerse}-${endVerse}` : `${startVerse}`;
                url = `${ACF_2007_API_URL}/${bookForApi}+${chapter}:${verseRangeParam}?translation=${apiTranslation}`;
            } else {
                url = `${ACF_2007_API_URL}/${bookForApi}+${chapter}?translation=${apiTranslation}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API error ${response.status}: ${await response.text()}`);
            const data = await response.json();
            return data.verses.map((v: any) => `${v.verse}. ${v.text.trim()}`).join('\n');
        } else { // ACF2011
            const url = `${ACF_2011_API_URL}/verses/acf/${bookData.pt_abbrev}/${chapter}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API error ${response.status}: ${await response.text()}`);
            const data = await response.json();

            const versesInRange = hasVersePart 
                ? data.verses.filter((v: any) => v.number >= startVerse && v.number <= endVerse)
                : data.verses;
                
            return versesInRange.map((v: any) => `${v.number}. ${v.text.trim()}`).join('\n');
        }
    } catch (error) {
        console.error(`Failed to fetch cross reference ${reference}:`, error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Unknown error fetching cross-reference.');
    }
}