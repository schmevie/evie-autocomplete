/// <reference types="vitest/globals" />
import getAutoCompleteSuggestionsMuse, {
  AutoCompleteParams,
} from '../api/autoCompleteService';

describe('getAutoCompleteSuggestionsMuse', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns options from the API response', async () => {
    const mockResponse = [
      { word: 'apple', score: 100, tags: [] },
      { word: 'app', score: 90, tags: [] },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })
    );

    const params: AutoCompleteParams = { autoCompleteWord: 'app' };
    const result = await getAutoCompleteSuggestionsMuse(params);

    expect(result.options).toEqual(['apple', 'app']);
  });

  it('throws an error if the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })
    );

    const params: AutoCompleteParams = { autoCompleteWord: 'fail' };
    await expect(getAutoCompleteSuggestionsMuse(params)).rejects.toThrow(
      'Datamuse API responded with status 500'
    );
  });

  it('throws an error if fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error'))
    );

    const params: AutoCompleteParams = { autoCompleteWord: 'fail' };
    await expect(getAutoCompleteSuggestionsMuse(params)).rejects.toThrow(
      'Failed to get AutoComplete Suggestions'
    );
  });
});
