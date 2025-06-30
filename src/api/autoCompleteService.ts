export type autoCompleteResponse = {
  options: [];
};

export type AutoCompleteParams = {
  autoCompleteWord: string;
};

interface DatamuseItem {
  word: string;
  score: number;
  tags: string[];
}

class AutoCompleteError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AutoCompleteError';
  }
}

class AutoCompleteServerError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AutoCompleteServerError';
  }
}

const getAutoCompleteSuggestionsMuse = async (
  params: AutoCompleteParams
): Promise<autoCompleteResponse> => {
  try {
    const { autoCompleteWord } = params;
    const response = await fetch(
      `https://api.datamuse.com/sug?s=${autoCompleteWord}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Datamuse API error', {
        status: response.status,
        body: errorData,
      });

      throw new AutoCompleteServerError(
        `Datamuse API responded with status ${response.status}`
      );
    }

    const data = await response.json();
    const wordsOnly = data.map((item: DatamuseItem) => item.word);
    return {
      options: wordsOnly,
    } as autoCompleteResponse;
  } catch (error) {
    if (error instanceof AutoCompleteServerError) {
      throw error;
    }

    throw new AutoCompleteError(
      'Failed to get AutoComplete Suggestions from Datamuse',
      error as Error
    );
  }
};

// export const getAutoCompleteSuggestionsGPT = async (
//   params: AutoCompleteParams
// ): Promise<autoCompleteResponse> => {
//   const { autoCompleteWord } = params;
//   const hugginFaceToken = import.meta.env.VITE_API_HUGGING_FACE_TOKEN;
//   const API_URL =
//     'https://router.huggingface.co/featherless-ai/v1/chat/completions';
//   const headers = {
//     Authorization: `Bearer ${hugginFaceToken}`,
//     'Content-Type': 'application/json',
//   };

//   const prompt = `Give 3 completions for the string ${autoCompleteWord} one that is a the office quote or the office style dialogue, one normal, and one in the style of Quentin Tarantino. Can you make sure they are words and not phrases? in this exact format["..."]`;

//   const completions = [];
//   try {
//     // const { autoCompleteWord } = params;
//     const response = await fetch(API_URL, {
//       method: 'POST',
//       headers,
//       body: JSON.stringify({
//         model: 'mistralai/Magistral-Small-2506',
//         messages: [{ role: 'user', content: prompt }],
//         stream: false,
//       }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       console.log('Server error response:', errorData);
//       throw new Error(`Server responded with status ${response.status}`);
//     }

//     const data = await response.json();
//     const messageText =
//       data.choices?.[0]?.message?.content || 'Error Generating';
//     const wordsOnly = data.map((item: DatamuseItem) => item.word);

//     return {
//       options: wordsOnly,
//     } as autoCompleteResponse;
//   } catch (error) {
//     console.log('AutoComplete error', error);
//     throw new Error('Failed to get AutoComplete Suggestions');
//   }
// };

export default getAutoCompleteSuggestionsMuse;
