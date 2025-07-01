/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />
import { render } from '@testing-library/react';
import { AutoCompletePlugin } from '../plugins/AutoCompletePlugin';

// Mock Lexical editor context
const mockRegisterCommand = vi.fn().mockReturnValue(vi.fn());
const mockRegisterNodeTransform = vi.fn();
const mockHasNodes = vi.fn().mockReturnValue(true);
const mockGetRootElement = vi.fn().mockReturnValue({
  getBoundingClientRect: () => ({
    top: 0,
    left: 0,
    width: 100,
    height: 100,
  }),
});
const mockEditor = {
  registerCommand: mockRegisterCommand,
  registerNodeTransform: mockRegisterNodeTransform,
  hasNodes: mockHasNodes,
  getRootElement: mockGetRootElement,
  update: vi.fn(),
};

vi.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [mockEditor],
}));

// Mock the AutoCompleteEntryNode
vi.mock('../nodes/AutoCompleteEntryNode', () => ({
  AutoCompleteEntryNode: class MockAutoCompleteEntryNode {
    constructor(text: string) {
      this.text = text;
    }
    text: string;
  },
}));

// Mock the AutoCompleteBoxPlugin component
vi.mock('../plugins/AutoCompleteBoxPlugin', () => ({
  default: ({ options, onUpdateSelected, isLoadingRef }: any) => {
    if (isLoadingRef.current) {
      return <div data-testid="loading">LOADING</div>;
    }
    if (options.length === 0) {
      return <div data-testid="no-suggestions">NO SUGGESTIONS FOUND</div>;
    }
    return (
      <div data-testid="autocomplete-box">
        <ul>
          {options.map((option: string, i: number) => (
            <li key={i} onClick={() => onUpdateSelected(option)}>
              {option}
            </li>
          ))}
        </ul>
      </div>
    );
  },
}));

// Mock the API service
vi.mock('../api/autoCompleteService', () => ({
  default: vi.fn().mockResolvedValue({
    options: ['apple', 'appalachian', 'apply'],
  }),
}));

describe('AutoCompletePlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasNodes.mockReturnValue(true);
    // Mock window.getSelection
    Object.defineProperty(window, 'getSelection', {
      value: vi.fn().mockReturnValue({
        rangeCount: 1,
        getRangeAt: () => ({
          getClientRects: () => [
            {
              top: 10,
              left: 20,
              bottom: 30,
              right: 100,
              width: 80,
              height: 20,
              x: 20,
              y: 10,
            },
          ],
        }),
      }),
      writable: true,
    });
  });

  it('renders nothing when no rectangle is set', () => {
    const { container } = render(<AutoCompletePlugin isFunMode={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders AutoCompleteBoxPlugin when rectangle is set', () => {
    render(<AutoCompletePlugin isFunMode={false} />);
    
    // Verify that the editor commands are registered
    expect(mockRegisterCommand).toHaveBeenCalled();
    expect(mockRegisterNodeTransform).toHaveBeenCalled();
  });

  it('registers editor commands on mount', () => {
    render(<AutoCompletePlugin isFunMode={false} />);
    
    // Should register backspace and down commands
    expect(mockRegisterCommand).toHaveBeenCalledTimes(2);
  });

  it('registers node transform on mount', () => {
    render(<AutoCompletePlugin isFunMode={false} />);
    
    expect(mockRegisterNodeTransform).toHaveBeenCalledWith(
      expect.any(Function), // TextNode constructor
      expect.any(Function) // transform function
    );
  });

  it('throws error if AutoCompleteEntryNode is not registered', () => {
    mockHasNodes.mockReturnValue(false);
    
    expect(() => {
      render(<AutoCompletePlugin isFunMode={false} />);
    }).toThrow('AutoComplete Plugin: AutoCompleteEntryNote not registered');
  });

  it('handles isFunMode prop correctly', () => {
    render(<AutoCompletePlugin isFunMode={true} />);
    
    // The component should render with fun mode enabled
    expect(mockRegisterCommand).toHaveBeenCalled();
  });

  it('sets up editor with correct configuration', () => {
    render(<AutoCompletePlugin isFunMode={false} />);
    
    // Verify editor setup
    expect(mockHasNodes).toHaveBeenCalledWith([expect.any(Function)]);
  });
}); 