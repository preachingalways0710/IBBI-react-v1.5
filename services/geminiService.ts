


import { GoogleGenAI, Chat, Type } from "@google/genai";
import { GEMINI_SYSTEM_INSTRUCTION } from '../constants';
import { OutlineItem, Language, CommonThemeItem, ChapterSummary, WordDefinition, StructuredCommentary, CrossReferenceItem, SermonDataType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export function createChatSession(): Chat {
  const model = 'gemini-2.5-flash';
  const chat = ai.chats.create({
    model: model,
    config: {
      systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
    },
  });
  return chat;
}

export interface VerseCommentaryResponse {
    commentary: StructuredCommentary;
    has_significant_difference: boolean;
}

interface VerseCommentaryParams {
  book: string;
  chapter: number;
  verseNumber: number;
  language: Language;
}

export async function getVerseCommentary({
  book,
  chapter,
  verseNumber,
  language,
}: VerseCommentaryParams): Promise<VerseCommentaryResponse> {
  try {
    const model = 'gemini-2.5-flash';
    const langName = language === 'en' ? 'English' : 'Portuguese';
    const userPrompt = `Provide primary commentary for ${book} chapter ${chapter} verse ${verseNumber}. The commentary MUST be based on original languages and MUST NOT mention KJV/ACF differences. Generate the response in ${langName}. The response must contain a general 'overview' paragraph, a 'phrasal_breakdown' array where each object has a 'phrase' and its 'explanation', and a boolean 'has_significant_difference' field. DO NOT include cross-references.`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            overview: { 
              type: Type.STRING,
              description: "A general overview paragraph of the verse's meaning and context."
            },
            phrasal_breakdown: {
              type: Type.ARRAY,
              description: "An array of commentaries for each significant phrase in the verse.",
              items: {
                type: Type.OBJECT,
                properties: {
                  phrase: {
                    type: Type.STRING,
                    description: "The specific phrase from the verse being explained."
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "The commentary for this specific phrase."
                  }
                },
                required: ["phrase", "explanation"]
              }
            },
            has_significant_difference: { type: Type.BOOLEAN },
        },
        required: ["overview", "phrasal_breakdown", "has_significant_difference"],
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonResponse = JSON.parse(response.text);
    return {
        commentary: {
            overview: jsonResponse.overview,
            phrasal_breakdown: jsonResponse.phrasal_breakdown,
        },
        has_significant_difference: jsonResponse.has_significant_difference,
    };
  } catch (error) {
    console.error("Error calling Gemini API for verse commentary:", error);
    if (error instanceof Error) {
        throw new Error(`An error occurred while fetching commentary. Details: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching commentary.");
  }
}

interface DifferenceExplanationParams extends VerseCommentaryParams {
  version1Name: string;
  version2Name: string;
}

export async function getTranslationDifferenceExplanation({
  book,
  chapter,
  verseNumber,
  language,
  version1Name,
  version2Name,
}: DifferenceExplanationParams): Promise<string> {
  try {
    const model = 'gemini-2.5-flash';
    const langName = language === 'en' ? 'English' : 'Portuguese';
    const userPrompt = `For ${book} ${chapter}:${verseNumber}, provide a detailed but concise and neutral explanation for the significant translation difference between the ${version1Name} and the ${version2Name}. Focus on the linguistic reasons or translational philosophies (e.g., literal vs. dynamic equivalence) that led to the different renderings. Do not take a side. Generate the response in ${langName}.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error fetching translation difference explanation:", error);
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return "An unknown error occurred.";
  }
}


interface ChapterOutlineParams {
  bibleVersion: string;
  book: string;
  chapter: number;
  chapterText: string;
  language: Language;
}

export async function getChapterOutline({
  bibleVersion,
  book,
  chapter,
  chapterText,
  language,
}: ChapterOutlineParams): Promise<OutlineItem[]> {
  try {
    const model = 'gemini-2.5-flash';
    const langName = language === 'en' ? 'English' : 'Portuguese';
    const prompt = `Analyze the text of ${book} chapter ${chapter} from the ${bibleVersion} version provided below. Generate a concise structural outline with 2 to 7 sections. For each section, provide a short heading (3-6 words) that summarizes its main thought or function, and identify the starting and ending verse numbers. Generate the response in ${langName}.

Chapter Text:
${chapterText}
`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: {
            type: Type.STRING,
            description: "A short, descriptive heading for the section (3-6 words).",
          },
          start_verse: {
            type: Type.INTEGER,
            description: "The starting verse number for this section.",
          },
          end_verse: {
            type: Type.INTEGER,
            description: "The ending verse number for this section.",
          },
        },
        required: ["heading", "start_verse", "end_verse"],
      },
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    const jsonResponse = JSON.parse(response.text);
    return jsonResponse;
  } catch (error) {
     console.error("Error calling Gemini API for chapter outline:", error);
     throw error;
  }
}

interface ChapterVerseByVerseParams {
  book: string;
  chapter: number;
  chapterText: string;
  language: Language;
}

export interface VerseCommentaryItem {
  verse_number: number;
  commentary: StructuredCommentary;
  has_significant_difference: boolean;
}

export async function getChapterVerseByVerseCommentary({
  book,
  chapter,
  chapterText,
  language,
}: ChapterVerseByVerseParams): Promise<VerseCommentaryItem[]> {
  try {
    const model = 'gemini-2.5-flash';
    const langName = language === 'en' ? 'English' : 'Portuguese';
    const prompt = `For each verse in ${book} chapter ${chapter} below, provide primary commentary. The commentary MUST be based on original languages and MUST NOT mention KJV/ACF differences. Generate the response in ${langName} as a JSON array. Each object needs 'verse_number', a 'commentary' object (with 'overview' and 'phrasal_breakdown'), and 'has_significant_difference' fields. DO NOT include cross-references.

Chapter Text:
${chapterText}`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          verse_number: {
            type: Type.INTEGER,
            description: "The verse number.",
          },
          commentary: {
            type: Type.OBJECT,
            description: "The structured commentary for the verse.",
            properties: {
               overview: { 
                type: Type.STRING,
                description: "A general overview paragraph of the verse's meaning and context."
              },
              phrasal_breakdown: {
                type: Type.ARRAY,
                description: "An array of commentaries for each significant phrase in the verse.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phrase: {
                      type: Type.STRING,
                      description: "The specific phrase from the verse being explained."
                    },
                    explanation: {
                      type: Type.STRING,
                      description: "The commentary for this specific phrase."
                    }
                  },
                  required: ["phrase", "explanation"]
                }
              },
            },
            required: ["overview", "phrasal_breakdown"]
          },
          has_significant_difference: {
            type: Type.BOOLEAN,
            description: "True if there is a a theologically significant or striking difference between KJV and ACF."
          }
        },
        required: ["verse_number", "commentary", "has_significant_difference"],
      },
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    const jsonResponse = JSON.parse(response.text);
    return jsonResponse;
  } catch (error) {
    console.error("Error calling Gemini API for verse-by-verse commentary:", error);
    throw error;
  }
}


export async function getChapterVerseByVerseSimplifiedCommentary({
  book,
  chapter,
  chapterText,
  language,
}: ChapterVerseByVerseParams): Promise<VerseCommentaryItem[]> {
  try {
    const model = 'gemini-2.5-flash';
    const langName = language === 'en' ? 'English' : 'Portuguese';
    const prompt = `For each verse in ${book} chapter ${chapter} below, provide a simplified primary commentary, suitable for a reader new to the Bible or who prefers easier language. Retain the core theological meaning, but use common words and shorter sentences. The commentary MUST NOT mention KJV/ACF differences. Generate the response in ${langName} as a JSON array. Each object needs 'verse_number', a 'commentary' object (with a simplified 'overview' and 'phrasal_breakdown'), and 'has_significant_difference'. DO NOT include cross-references.

Chapter Text:
${chapterText}`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          verse_number: {
            type: Type.INTEGER,
            description: "The verse number.",
          },
          commentary: {
            type: Type.OBJECT,
            description: "The structured simplified commentary for the verse.",
            properties: {
               overview: { 
                type: Type.STRING,
                description: "A simplified general overview paragraph of the verse's meaning."
              },
              phrasal_breakdown: {
                type: Type.ARRAY,
                description: "An array of simplified commentaries for each significant phrase.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phrase: {
                      type: Type.STRING,
                      description: "The specific phrase from the verse being explained."
                    },
                    explanation: {
                      type: Type.STRING,
                      description: "The simplified commentary for this specific phrase."
                    }
                  },
                  required: ["phrase", "explanation"]
                }
              },
            },
            required: ["overview", "phrasal_breakdown"]
          },
          has_significant_difference: {
            type: Type.BOOLEAN,
            description: "True if there is a a theologically significant or striking difference between KJV and ACF."
          }
        },
        required: ["verse_number", "commentary", "has_significant_difference"],
      },
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    const jsonResponse = JSON.parse(response.text);
    return jsonResponse;
  } catch (error) {
    console.error("Error calling Gemini API for simplified verse-by-verse commentary:", error);
    throw error;
  }
}


interface CommonThemesParams {
  book: string;
  chapter: number;
  chapterText: string;
  language: Language;
}

export async function getCommonThemes({
  book,
  chapter,
  chapterText,
  language,
}: CommonThemesParams): Promise<CommonThemeItem[]> {
  try {
    const model = 'gemini-2.5-flash';
    const langName = language === 'en' ? 'English' : 'Portuguese';
    const prompt = `Analyze the text of ${book} chapter ${chapter} provided below. Identify about 5 of the most common themes for application-focused, expository preaching from this chapter. For each theme, provide a concise name (a few words) and a string listing the key supporting verse numbers (e.g., "1-4, 10"). Generate the response in ${langName}.

Chapter Text:
${chapterText}`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          theme: {
            type: Type.STRING,
            description: "A short, descriptive name for the theme.",
          },
          verses: {
            type: Type.STRING,
            description: "A string listing the key verse numbers supporting the theme (e.g., '1-4, 10, 15').",
          },
        },
        required: ["theme", "verses"],
      },
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse;
  } catch (error) {
    console.error("Error calling Gemini API for common themes:", error);
    throw error;
  }
}

interface ChapterSummaryParams {
  book: string;
  chapter: number;
  chapterText: string;
  language: Language;
}

export async function getChapterSummary({
  book,
  chapter,
  chapterText,
  language,
}: ChapterSummaryParams): Promise<ChapterSummary> {
  const model = 'gemini-2.5-flash';
  const langName = language === 'en' ? 'English' : 'Portuguese';
  const isFirstChapter = chapter === 1;

  let prompt = `Analyze the text of ${book} chapter ${chapter} provided below. Generate the response in ${langName}.`;

  if (isFirstChapter) {
    prompt += ` Because this is the first chapter, also provide a concise summary of the entire book of ${book}.`;
  }

  prompt += `\n\nChapter Text:\n${chapterText}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      book_summary: {
        type: Type.STRING,
        description: "Summary of the entire book. Only include if it is chapter 1.",
        nullable: true,
      },
      chapter_summary: {
        type: Type.STRING,
        description: "A concise summary of this specific chapter.",
      },
      chapter_stats: {
        type: Type.OBJECT,
        properties: {
          key_word: { type: Type.STRING, description: "The most significant single keyword in the chapter. Must be a single word that appears in the text. 'None' if not applicable." },
          key_verse: { type: Type.STRING, description: "The single verse that is most crucial for unlocking the overall meaning and purpose of the chapter as a whole. It should act as a key to the central message of the entire chapter. Return just the verse number (e.g., '15')." },
          other_keywords: {
            type: Type.ARRAY,
            description: "An array of 2-4 other important single words from the chapter. The words must appear in the chapter text. Do not provide phrases. Do not count them.",
            items: {
              type: Type.STRING,
            },
          },
          original_language: { type: Type.STRING, description: "The original language of the book (e.g., 'Hebrew', 'Greek', 'Aramaic')." },
        },
        required: ["key_word", "key_verse", "other_keywords", "original_language"],
      },
    },
    required: ["chapter_summary", "chapter_stats"],
  };
  
  if (isFirstChapter) {
      schema.properties.book_summary.nullable = false;
      schema.required.push('book_summary');
  }


  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonResponse = JSON.parse(response.text);

    const keyWord = jsonResponse.chapter_stats.key_word;
    const otherKeywords: string[] = jsonResponse.chapter_stats.other_keywords || [];

    const wordsToCount = new Set<string>();
    if (keyWord && keyWord.toLowerCase() !== 'none' && keyWord.trim() !== '') {
        wordsToCount.add(keyWord);
    }
    otherKeywords.forEach(word => {
        if(word && word.trim() !== '') {
            wordsToCount.add(word);
        }
    });

    const word_counts = Array.from(wordsToCount).map(keyword => {
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
        const matches = chapterText.match(regex);
        return {
            word: keyword,
            count: matches ? matches.length : 0
        };
    }).filter(wc => wc.count > 0)
      .sort((a, b) => b.count - a.count);

    const finalSummary: ChapterSummary = {
      book_summary: jsonResponse.book_summary,
      chapter_summary: jsonResponse.chapter_summary,
      chapter_stats: {
        key_word: jsonResponse.chapter_stats.key_word,
        key_verse: jsonResponse.chapter_stats.key_verse,
        word_counts: word_counts,
        original_language: jsonResponse.chapter_stats.original_language,
      },
    };

    return finalSummary;
  } catch (error) {
    console.error("Error calling Gemini API for chapter summary:", error);
    throw error;
  }
}

interface WordDefinitionParams {
  word: string;
  contextSentence: string;
  bibleVersion: string;
  language: Language;
}

export async function getWordDefinition({
  word,
  contextSentence,
  bibleVersion,
  language,
}: WordDefinitionParams): Promise<WordDefinition> {
  const model = 'gemini-2.5-flash';
  const langName = language === 'en' ? 'English' : 'Portuguese';
  const prompt = `Define the word "${word}" as used in the bible version "${bibleVersion}" within the context of this sentence: "${contextSentence}". Provide a JSON response. If the word is a known biblical geographical location, provide its 'latitude' and 'longitude', set 'is_location' to true, and critically, specify the 'location_certainty' as 'certain', 'uncertain', or 'disputed' based on scholarly and archaeological consensus. If a location is certain (like Jerusalem), use 'certain'. If there are major competing theories or a general lack of consensus (like the traditional site of Mount Sinai), use 'uncertain' or 'disputed'. Otherwise, set 'is_location' to false and omit location-related fields. The response must also contain 'modern_definition', 'archaic_usage_note' (nullable), 'original_language_word', and 'original_language_definition'. The original language definition should be based on Strong's Concordance. Generate all text in ${langName}.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      modern_definition: {
        type: Type.STRING,
        description: `Definition of the word in modern ${langName}.`,
      },
      archaic_usage_note: {
        type: Type.STRING,
        description: `Note on how the word's meaning has changed since the translation was made. Null if not applicable.`,
        nullable: true,
      },
      original_language_word: {
        type: Type.STRING,
        description: 'The original Hebrew or Greek word being translated.'
      },
      original_language_definition: {
        type: Type.STRING,
        description: 'The definition of the original language word, based on Strong\'s Concordance.'
      },
      is_location: {
        type: Type.BOOLEAN,
        description: "True if the word is a geographical location, otherwise false."
      },
      latitude: {
        type: Type.NUMBER,
        description: "The latitude of the location. Nullable.",
        nullable: true,
      },
      longitude: {
        type: Type.NUMBER,
        description: "The longitude of the location. Nullable.",
        nullable: true,
      },
      location_certainty: {
        type: Type.STRING,
        description: "Certainty of the location's identification based on scholarly consensus. Can be 'certain', 'uncertain', or 'disputed'. Null if not a location.",
        nullable: true,
      }
    },
    required: ["modern_definition", "original_language_word", "original_language_definition", "is_location"],
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse;
  } catch (error) {
    console.error("Error calling Gemini API for word definition:", error);
    throw error;
  }
}

export async function simplifyCommentary(commentary: StructuredCommentary, language: Language): Promise<StructuredCommentary> {
  try {
    const model = 'gemini-2.5-flash';
    const langName = language === 'en' ? 'English' : 'Portuguese';
    const prompt = `Rewrite the following Bible commentary in simpler terms, suitable for a reader who is new to the Bible or prefers easier language. Retain the core theological meaning and scholarly insights, but use more common words and shorter sentences. Return a JSON object with the exact same structure ('overview' and 'phrasal_breakdown' array), but with the text in each part simplified. The response must be in ${langName}.

Commentary content to simplify:
${JSON.stringify({ overview: commentary.overview, phrasal_breakdown: commentary.phrasal_breakdown })}`;

     const schema = {
        type: Type.OBJECT,
        properties: {
            overview: { 
              type: Type.STRING,
              description: "A simplified general overview paragraph of the verse's meaning and context."
            },
            phrasal_breakdown: {
              type: Type.ARRAY,
              description: "An array of simplified commentaries for each significant phrase in the verse.",
              items: {
                type: Type.OBJECT,
                properties: {
                  phrase: {
                    type: Type.STRING,
                    description: "The specific phrase from the verse being explained."
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "The simplified commentary for this specific phrase."
                  }
                },
                required: ["phrase", "explanation"]
              }
            }
        },
        required: ["overview", "phrasal_breakdown"],
    };


    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    const simplifiedContent = JSON.parse(response.text);

    return simplifiedContent;
  } catch (error) {
    console.error("Error calling Gemini API for commentary simplification:", error);
    if (error instanceof Error) {
      throw new Error(`An error occurred while simplifying commentary. Details: ${error.message}`);
    }
    throw new Error("An unknown error occurred while simplifying commentary.");
  }
}

interface VerseCrossReferencesParams {
  book: string;
  chapter: number;
  verseNumber: number;
  verseText: string;
  language: Language;
}

export async function getVerseCrossReferences({
  book,
  chapter,
  verseNumber,
  verseText,
  language,
}: VerseCrossReferencesParams): Promise<CrossReferenceItem[]> {
  try {
    const model = 'gemini-2.5-flash';
    const langName = language === 'en' ? 'English' : 'Portuguese';
    const prompt = `Based on the verse "${book} ${chapter}:${verseNumber} - ${verseText}", generate a list of 2-4 thematically grouped cross-references. Generate the response in ${langName}.`;

    const schema = {
      type: Type.ARRAY,
      description: "An array of thematically grouped cross-references.",
      items: {
        type: Type.OBJECT,
        properties: {
          subject: {
            type: Type.STRING,
            description: "The subject or theme connecting the references.",
          },
          references: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: "An array of bible references (e.g., 'John 1:1').",
          },
        },
        required: ["subject", "references"],
      },
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse;
  } catch (error) {
    console.error("Error calling Gemini API for cross-references:", error);
    throw error;
  }
}


export async function translateText(text: string, targetLanguage: Language): Promise<string> {
  try {
    const model = 'gemini-2.5-flash';
    const langName = targetLanguage === 'en' ? 'English' : 'Portuguese';
    const prompt = `Translate the following text to ${langName}:\n\n${text}`;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for translation:", error);
    if (error instanceof Error) {
        return `Translation Error: ${error.message}`;
    }
    return "An unknown translation error occurred.";
  }
}

export async function generateSermonOutline(data: SermonDataType, language: Language, enableColor: boolean): Promise<string> {
  const langName = language === 'en' ? 'English' : 'Portuguese';
  const systemInstruction = `You are a meticulous sermon outliner and typesetter. Your sole job is to take raw sermon components and format them into a clean, readable, and beautifully structured HTML outline for a preacher. You will be given the sermon data and must return a single, complete, well-formed HTML string without any other text, markdown, or code blocks. You will also be given a flag to enable or disable color formatting.

**Color Formatting Rules (ONLY apply if color is enabled):**

*   **Thesis & Verdict:** The entire text content for the Thesis and Application/Verdict sections MUST be wrapped in \`<strong><span style="color: #F87171;">...</span></strong>\`.
*   **Supporting Scripture References:** The scripture reference text (e.g., "Gênesis 1:1") and any leading verse numbers (e.g., "1. ") MUST be wrapped in \`<span style="color: #7DD3FC;">...</span>\`.
*   **Supporting Scripture Text:** The actual Bible verse text that follows a reference MUST be wrapped in \`<span style="color: #FB923C;">...</span>\`.
*   **All other text** (titles, headers, explanations, illustrations) should remain the default color.

**General Formatting Rules (Follow these EXPLICITLY regardless of color setting):**

1.  **Overall Structure:** Return a single HTML string. Do not wrap it in \`\`\`html ... \`\`\`.
2.  **Title:**
    - The main sermon title MUST be wrapped in an \`<h1>\` tag.
    - It MUST be styled to be significantly larger than the rest of the text. Use an inline style for this.
    - Example: \`<h1 style="font-size: 2.5rem; line-height: 1.2;">The Title of the Sermon</h1>\`

3.  **Section Separation:**
    - There MUST be a clear visual break between each major section (Title, Introduction, Thesis, Body, Conclusion, etc.).
    - Achieve this by putting TWO \`<br>\` tags between the end of one section's content and the start of the next section's header tag (\`<h2>\`). This also applies between individual supporting points in the body.

4.  **Section Headers:**
    - The headers "Bible Text", "Introduction", "Thesis", "Conclusion", and "Application/Verdict" MUST be wrapped in \`<h2>\` tags.
    - The text inside the \`<h2>\` tag must be bolded with \`<strong>\`.
    - **Crucially, DO NOT add a header for the "Sermon Body".**
    - Example: \`<h2><strong>Introduction</strong></h2>\`

5.  **Section Content:**
    - All general text content (like the introduction paragraph, conclusion, etc.) MUST be wrapped in \`<p>\` tags. If color is enabled, apply color rules for Thesis and Verdict content.

6.  **Sermon Body Formatting (This is CRITICAL):**
    - You must analyze the list of 'body items' and group 'scripture' and 'illustration' items under the 'point' they logically support.
    - **Main Points:**
        - You MUST manually number each main supporting point, starting from "1.".
        - The title of the point MUST be on its own line, wrapped in a \`<p>\` tag, and bolded using \`<strong>\`.
        - The explanation of the point MUST follow on the next line, wrapped in its own \`<p>\` tag.
    - **Supporting Scriptures:**
        - Place scripture references directly under the point they support.
        - Indent them by wrapping them in a \`<blockquote>\` tag. The content should be inside a \`<p>\` tag.
        - The text "Scripture(s):" should be bolded, followed by a space.
        - **If the provided content for a scripture item contains HTML tags (e.g., \`<strong>\`, \`<br>\`):** You MUST parse this HTML. The reference part (e.g., \`<strong>Gênesis 1:1</strong>\`) and verse number part (e.g., \`1. \`) should be colored if color is enabled. The verse text that follows should be colored if color is enabled. Append this structured content *directly* after the "Scripture(s): " text, inside the same \`<p>\` tag.
        - **If the provided content is just plain text (a reference):** You must wrap this plain text in \`<em>\` tags. If color is enabled, the entire \`<em>\` tag should be wrapped in the color span for references.
        - Example (color enabled, pre-formatted HTML): \`<blockquote><p><strong>Scripture(s): </strong><span style="color: #7DD3FC;"><strong>Gênesis 1:1</strong></span><br><span style="color: #7DD3FC;">1. </span><span style="color: #FB923C;">No princípio...</span></p></blockquote>\`
        - Example (color enabled, plain text reference): \`<blockquote><p><strong>Scripture(s): </strong><span style="color: #7DD3FC;"><em>John 3:16</em></span></p></blockquote>\`
    - **Illustrations:**
        - Place illustrations directly under the point they support.
        - Indent them by wrapping them in a \`<blockquote>\` tag.
        - The text "Illustration:" should be bolded.
        - Example: \`<blockquote><p><strong>Illustration:</strong> A story about a lost sheep.</p></blockquote>\`
    - **Spacing between Points:**
        - After a complete point and all its supporting items (scriptures, illustrations), you MUST insert a double line break (\`<br><br>\`) before starting the next point. This applies to all points except the very last one.

7.  **Final Output:** Ensure the entire response is a single block of HTML code ready to be injected into a webpage.

Generate the response in ${langName}.
`;

  const bodyContent = data.body.map(item => {
    if (item.type === 'point') {
        return `- Type: point\n  Title: ${item.content.title}\n  Explanation: ${item.content.explanation}`;
    }
    if (item.type === 'scripture') {
      const fullContent = item.content.fetchedText
        ? `${item.content.fetchedText}` // When fetched, prioritize the full text for the AI.
        : item.content.references;
      return `- Type: scripture\n  Content: ${fullContent}`;
    }
    return `- Type: ${item.type}\n  Content: ${item.content}`;
  }).join('\n');

  const userPrompt = `Please generate a sermon outline from the following data, strictly following all formatting rules. Color formatting should be ${enableColor ? 'ENABLED' : 'DISABLED'}.

# Sermon Data:

## Title
${data.title || '(Not provided)'}

## Bible Text
${data.bibleText || '(Not a part of this sermon)'}

## Introduction
${data.introduction || '(Not provided)'}

## Thesis (Main Truth)
${data.thesis || '(Not provided)'}

## Sermon Body Items
(Logically arrange these items into numbered main points with their supporting scriptures and illustrations, and format as per the rules. If full verse text is provided for a scripture, use the full verse text. Do not include a "Sermon Body" heading.)
${bodyContent || '(Not provided)'}

## Conclusion
${data.conclusion || '(Not provided)'}

## Application/Verdict
${data.verdict || '(Not provided)'}
`;

  try {
    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    // The model should return clean HTML. We might want to do a basic cleanup just in case.
    let html = response.text;
    // Remove markdown code block fences if they accidentally appear
    html = html.replace(/^```html\s*/, '').replace(/```$/, '');

    return html.trim();
  } catch (error) {
    console.error("Error calling Gemini API for sermon outline:", error);
    if (error instanceof Error) {
        throw new Error(`An error occurred while generating the outline. Details: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the outline.");
  }
}

export async function parseScriptureReferences(userInput: string): Promise<string[]> {
  const model = 'gemini-2.5-flash';
  const systemInstruction = `You are an intelligent Bible scripture reference parser. Your task is to analyze a user's free-form text input and convert it into a structured list of canonical Bible references.

**CRITICAL RULES:**
1.  **Input Flexibility:** You must handle various formats:
    -   **Book Names:** Recognize full names, common abbreviations (e.g., 'Gen', 'Mt', '1 Cor'), and minor misspellings in both English (e.g., "Genesis", "Matthew") and Portuguese (e.g., "Gênesis", "Mateus").
    -   **Delimiters:** Correctly interpret colons (e.g., 1:16), periods (e.g., 1.16), commas for verse lists (e.g., 1,16), hyphens for ranges (e.g., 1-3), and semicolons for separating distinct references (e.g., John 3:16; 1 John 4:8).
    -   **Complex Queries:** Deconstruct complex strings like "Mateus 12.1-3, 5; Tiago 5:1" into individual, canonical references.
2.  **Output Format:**
    -   The output MUST be a JSON array of strings.
    -   Each string in the array must be a single, canonical Bible reference.
    -   **Canonical Format:** Use the full English book name, a space, chapter number, a colon, and the verse(s). Example: "Matthew 12:1-3".
    -   For verse lists like "John 3:1, 16", expand them into separate references: ["John 3:1", "John 3:16"].
    -   For verse ranges like "1-3", keep them as a single reference: "Matthew 12:1-3".
    -   For whole chapters like "1Cor 13", output a single reference for the chapter: "1 Corinthians 13".
3.  **Accuracy:** Be precise. If a reference is ambiguous or unrecognizable, omit it from the output array. Do not guess.

**Example:**
-   User Input: "gn 1.1-3, 5; Tiago 5:1; 1Cor 13"
-   Your Output: ["Genesis 1:1-3", "Genesis 1:5", "James 5:1", "1 Corinthians 13"]
`;

  const userPrompt = `Parse the following scripture reference string into a canonical list: "${userInput}"`;

  const schema = {
    type: Type.ARRAY,
    description: "An array of canonical Bible reference strings.",
    items: {
      type: Type.STRING,
      description: "A single canonical reference, e.g., 'John 3:16-18' or 'Romans 8'."
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse;
  } catch (error) {
    console.error("Error calling Gemini API for scripture parsing:", error);
    if (error instanceof Error) {
        throw new Error(`An error occurred while parsing scriptures. Details: ${error.message}`);
    }
    throw new Error("An unknown error occurred while parsing scriptures.");
  }
}