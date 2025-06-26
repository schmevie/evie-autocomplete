export type autoCompleteResponse = {
    options: [];
  };

export type AutoCompleteParams = {
    autoCompleteWord: string;
}

interface DatamuseItem {
    word: string;
    score: number;
    tags: string[];
}

const getAutoCompleteSuggestionsMuse = async (params: AutoCompleteParams): Promise<autoCompleteResponse> => {
      try {
          //TODO should validate this.
        const {autoCompleteWord} = params;
        const response = await fetch(`https://api.datamuse.com/sug?s=${autoCompleteWord}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.log("Server error response:", errorData);
            throw new Error(`Server responded with status ${response.status}`);
          }
  
          const data = await response.json();
          const wordsOnly = data.map((item: DatamuseItem) => item.word);

          return {
            options: wordsOnly
          } as autoCompleteResponse;
      } catch (error) {
          console.log("AutoComplete error", error);
          throw new Error('Failed to get AutoComplete Suggestions');
      }
  };

export default getAutoCompleteSuggestionsMuse;