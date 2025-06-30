/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />
import { render, fireEvent, screen } from '@testing-library/react';
import AutoCompleteBoxPlugin from '../plugins/AutoCompleteBoxPlugin';

// Mock Lexical editor context
const mockRegisterCommand = vi.fn().mockReturnValue(vi.fn());
const mockEditor = { registerCommand: mockRegisterCommand };

vi.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [mockEditor],
}));

describe('AutoCompleteBoxPlugin', () => {
  const mockOnUpdateSelected = vi.fn();

  const baseProps = {
    options: ['apple', 'appalachian', 'apply'],
    rectangle: { top: 0, left: 0, x: 0, y: 0 },
    onUpdateSelected: mockOnUpdateSelected,
    isLoadingRef: { current: false },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders options', () => {
    render(<AutoCompleteBoxPlugin {...baseProps} />);
    expect(screen.getByText('apple')).toBeInTheDocument();
    expect(screen.getByText('appalachian')).toBeInTheDocument();
    expect(screen.getByText('apply')).toBeInTheDocument();
  });

  it('calls onUpdateSelected when option is clicked', () => {
    render(<AutoCompleteBoxPlugin {...baseProps} />);
    fireEvent.click(screen.getByText('apply'));
    expect(mockOnUpdateSelected).toHaveBeenCalledWith('apply');
  });

  it('shows loading message when isLoadingRef.current is true', () => {
    render(
      <AutoCompleteBoxPlugin {...baseProps} isLoadingRef={{ current: true }} />
    );
    expect(screen.getByText('LOADING')).toBeInTheDocument();
  });

  it('shows no suggestions when options is empty', () => {
    render(
      <AutoCompleteBoxPlugin
        {...baseProps}
        options={[]}
        isLoadingRef={{ current: false }}
      />
    );
    expect(screen.getByText('NO SUGGESTIONS FOUND')).toBeInTheDocument();
  });

  it('clears selection when clicking outside the box', () => {
    render(<AutoCompleteBoxPlugin {...baseProps} />);
    fireEvent.mouseDown(document);
    expect(mockOnUpdateSelected).toHaveBeenCalledWith('');
  });
});
