import { act, renderHook, waitFor } from '@testing-library/react';
import { useSearchLogic } from './useSearchLogic';
import { localQuery } from '../../utils/localSearch';
import {
  createExternalQuickstartResultItem,
  fetchMCPQuickstarts,
  handleMCPToolResponse,
  isExternalQuickstart,
  isQuickstartToolData,
  isStringToolData,
} from '../../utils/mcpQuickstarts';
import { MCP_TOOLS } from './SearchTypes';
import type { SearchItem } from './SearchTypes';

// Mock dependencies
jest.mock('jotai', () => ({
  useAtomValue: jest.fn(),
  atom: jest.fn(),
}));

jest.mock('../../utils/localSearch');
jest.mock('../../utils/mcpQuickstarts');
jest.mock('../../hooks/useFeoConfig');
jest.mock('../../utils/internalChromeContext', () => ({
  __esModule: true,
  default: {
    Consumer: ({ children }: { children: (value: any) => React.ReactNode }) => children(mockChromeApi),
  },
}));

// Import mocked functions
import { useAtomValue } from 'jotai';

// Mock implementations
const mockUseAtomValue = useAtomValue as jest.MockedFunction<typeof useAtomValue>;
const mockLocalQuery = localQuery as jest.MockedFunction<typeof localQuery>;
const mockFetchMCPQuickstarts = fetchMCPQuickstarts as jest.MockedFunction<typeof fetchMCPQuickstarts>;
const mockHandleMCPToolResponse = handleMCPToolResponse as jest.MockedFunction<typeof handleMCPToolResponse>;
const mockIsExternalQuickstart = isExternalQuickstart as jest.MockedFunction<typeof isExternalQuickstart>;
const mockCreateExternalQuickstartResultItem = createExternalQuickstartResultItem as jest.MockedFunction<typeof createExternalQuickstartResultItem>;
const mockIsQuickstartToolData = isQuickstartToolData as jest.MockedFunction<typeof isQuickstartToolData>;
const mockIsStringToolData = isStringToolData as jest.MockedFunction<typeof isStringToolData>;

// Mock Chrome API
const mockChromeApi = {
  quickStarts: {
    set: jest.fn(),
    toggle: jest.fn(),
  },
};

// Mock React Context
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: () => mockChromeApi,
}));

// Mock useFeoConfig
jest.mock('../../hooks/useFeoConfig', () => ({
  __esModule: true,
  default: () => false,
}));

// Sample test data
const mockSearchItems: SearchItem[] = [
  {
    id: '1',
    title: 'Test Service 1',
    description: 'Test description 1',
    bundleTitle: 'Test Bundle',
    pathname: '/test/1',
    source: 'local',
  },
  {
    id: '2',
    title: 'Test Service 2',
    description: 'Test description 2',
    bundleTitle: 'Test Bundle',
    pathname: '/test/2',
    source: 'local',
  },
];

const mockExternalSearchItem: SearchItem = {
  id: 'external-1',
  title: 'External Quickstart',
  description: 'External quickstart description',
  bundleTitle: 'External Documentation',
  pathname: 'https://example.com/docs',
  source: 'mcp',
};

// Create a proper mock QuickStart object
const mockQuickstart = {
  metadata: {
    name: 'test-quickstart',
    uid: 'test-uid',
    resourceVersion: '1',
  },
  spec: {
    displayName: 'Test Quickstart',
    description: 'Test quickstart description',
    icon: 'test-icon',
    durationMinutes: 10,
    introduction: 'Test introduction',
    tasks: [],
  },
  status: { conditions: [] },
};

const mockMCPResponse = {
  status: 'success',
  query: 'test query',
  tool_result: {
    tool: MCP_TOOLS.SEARCH_QUICKSTARTS,
    data: {
      result: {
        quickstart: {
          content: mockQuickstart,
        },
      },
    },
  },
};

const mockMCPToolResponse = {
  status: 'success',
  query: 'hello',
  tool_result: {
    tool: MCP_TOOLS.GREET_USER,
    data: 'Hello there! How can I help you today?',
  },
};

describe('useSearchLogic', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock returns - provide default values for all atoms
    mockUseAtomValue.mockImplementation(() => {
      // Return a safe default for any atom
      return {}; // This works for asyncLocalOrama (empty object) and other atoms
    });

    // Override specific atoms if needed
    mockUseAtomValue
      .mockReturnValueOnce({}) // First call: asyncLocalOrama
      .mockReturnValueOnce(false) // Second call: isPreview
      .mockReturnValueOnce(false); // Third call: useFeoGenerated (from useFeoConfig)

    // Setup default mock implementations for helper functions
    mockIsQuickstartToolData.mockReturnValue(false);
    mockIsStringToolData.mockReturnValue(false);
    mockIsExternalQuickstart.mockReturnValue(false);
    mockHandleMCPToolResponse.mockResolvedValue(false);
    mockCreateExternalQuickstartResultItem.mockResolvedValue(mockExternalSearchItem);
  });

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useSearchLogic());

      expect(result.current.searchItems).toEqual([]);
      expect(result.current.mcpSearchItems).toEqual([]);
      expect(result.current.mcpToolResult).toBeNull();
      expect(result.current.isFetching).toBe(false);
      expect(result.current.resultCount).toBe(0);
    });
  });

  describe('performSearch', () => {
    it('should handle successful local search results', async () => {
      mockLocalQuery.mockResolvedValue(mockSearchItems);
      mockFetchMCPQuickstarts.mockResolvedValue(null);

      const { result } = renderHook(() => useSearchLogic());

      act(() => {
        result.current.performSearch('test query');
      });

      // Should set fetching to true immediately
      expect(result.current.isFetching).toBe(true);

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(result.current.searchItems).toEqual(mockSearchItems);
      expect(result.current.mcpSearchItems).toEqual([]);
      expect(result.current.mcpToolResult).toBeNull();
      expect(result.current.resultCount).toBe(2);
    });

    it('should handle MCP external quickstart results', async () => {
      mockLocalQuery.mockResolvedValue([]);
      mockFetchMCPQuickstarts.mockResolvedValue(mockMCPResponse);
      // Configure type guards for external quickstart
      mockIsQuickstartToolData.mockReturnValue(true);
      mockIsExternalQuickstart.mockReturnValue(true);
      mockCreateExternalQuickstartResultItem.mockResolvedValue(mockExternalSearchItem);

      const { result } = renderHook(() => useSearchLogic());

      await act(async () => {
        await result.current.performSearch('external quickstart');
      });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(result.current.searchItems).toEqual([]);
      expect(result.current.mcpSearchItems).toEqual([mockExternalSearchItem]);
      expect(result.current.mcpToolResult).toBeNull();
      expect(result.current.resultCount).toBe(1);
    });

    it('should handle MCP internal quickstart activation', async () => {
      const internalMCPResponse = {
        ...mockMCPResponse,
        tool_result: {
          ...mockMCPResponse.tool_result,
          data: {
            result: {
              quickstart: {
                content: {
                  ...mockQuickstart,
                  metadata: { ...mockQuickstart.metadata, name: 'internal-quickstart' },
                  spec: { ...mockQuickstart.spec, displayName: 'Internal Quickstart' },
                },
              },
            },
          },
        },
      };

      mockLocalQuery.mockResolvedValue([]);
      mockFetchMCPQuickstarts.mockResolvedValue(internalMCPResponse);
      // Configure type guards for internal quickstart
      mockIsQuickstartToolData.mockReturnValue(true);
      mockIsExternalQuickstart.mockReturnValue(false);
      mockHandleMCPToolResponse.mockResolvedValue(true);

      const { result } = renderHook(() => useSearchLogic());

      const searchResult = await act(async () => {
        return await result.current.performSearch('internal quickstart');
      });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(searchResult?.mcpActivatedQuickstart).toBe(true);
      expect(result.current.searchItems).toEqual([]);
      expect(result.current.mcpSearchItems).toEqual([]);
      expect(result.current.mcpToolResult).toBeNull();
    });

    it('should handle MCP tool results (greetUser/addNumbers)', async () => {
      mockLocalQuery.mockResolvedValue([]);
      mockFetchMCPQuickstarts.mockResolvedValue(mockMCPToolResponse);
      // Configure type guards for string tool data
      mockIsStringToolData.mockReturnValue(true);
      mockHandleMCPToolResponse.mockResolvedValue(true);

      const { result } = renderHook(() => useSearchLogic());

      await act(async () => {
        await result.current.performSearch('hello');
      });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(result.current.searchItems).toEqual([]);
      expect(result.current.mcpSearchItems).toEqual([]);
      expect(result.current.mcpToolResult).toBe('Hello there! How can I help you today?');
      expect(result.current.resultCount).toBe(1);
    });

    it('should handle combined local and MCP results', async () => {
      mockLocalQuery.mockResolvedValue(mockSearchItems);
      mockFetchMCPQuickstarts.mockResolvedValue(mockMCPResponse);
      // Configure type guards for external quickstart
      mockIsQuickstartToolData.mockReturnValue(true);
      mockIsExternalQuickstart.mockReturnValue(true);
      mockCreateExternalQuickstartResultItem.mockResolvedValue(mockExternalSearchItem);

      const { result } = renderHook(() => useSearchLogic());

      await act(async () => {
        await result.current.performSearch('combined search');
      });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(result.current.searchItems).toEqual(mockSearchItems);
      expect(result.current.mcpSearchItems).toEqual([mockExternalSearchItem]);
      expect(result.current.mcpToolResult).toBeNull();
      expect(result.current.resultCount).toBe(3);
    });

    it('should handle API failures gracefully', async () => {
      mockLocalQuery.mockRejectedValue(new Error('Local search failed'));
      mockFetchMCPQuickstarts.mockRejectedValue(new Error('MCP request failed'));

      const { result } = renderHook(() => useSearchLogic());

      await act(async () => {
        await result.current.performSearch('failing query');
      });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      // Should handle failures gracefully and return empty results
      expect(result.current.searchItems).toEqual([]);
      expect(result.current.mcpSearchItems).toEqual([]);
      expect(result.current.mcpToolResult).toBeNull();
      expect(result.current.resultCount).toBe(0);
    });

    it('should handle unknown MCP tools', async () => {
      const unknownToolResponse = {
        status: 'success',
        query: 'test',
        tool_result: {
          tool: 'unknownTool',
          data: 'some data',
        },
      };

      mockLocalQuery.mockResolvedValue([]);
      mockFetchMCPQuickstarts.mockResolvedValue(unknownToolResponse);

      const { result } = renderHook(() => useSearchLogic());

      await act(async () => {
        await result.current.performSearch('unknown tool');
      });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      // The console.warn was removed as part of debug cleanup
      expect(result.current.searchItems).toEqual([]);
      expect(result.current.mcpSearchItems).toEqual([]);
      expect(result.current.mcpToolResult).toBeNull();
    });
  });

  describe('clearResults', () => {
    it('should clear all search results', async () => {
      mockLocalQuery.mockResolvedValue(mockSearchItems);
      mockFetchMCPQuickstarts.mockResolvedValue(mockMCPToolResponse);

      const { result } = renderHook(() => useSearchLogic());

      // First perform a search to populate results
      await act(async () => {
        await result.current.performSearch('test');
      });

      await waitFor(() => {
        expect(result.current.resultCount).toBeGreaterThan(0);
      });

      // Then clear results
      act(() => {
        result.current.clearResults();
      });

      expect(result.current.searchItems).toEqual([]);
      expect(result.current.mcpSearchItems).toEqual([]);
      expect(result.current.mcpToolResult).toBeNull();
      expect(result.current.resultCount).toBe(0);
    });
  });

  describe('resultCount calculation', () => {
    it('should calculate result count correctly', async () => {
      mockLocalQuery.mockResolvedValue(mockSearchItems); // 2 items
      mockFetchMCPQuickstarts.mockResolvedValue(mockMCPResponse);
      // Configure type guards for external quickstart
      mockIsQuickstartToolData.mockReturnValue(true);
      mockIsExternalQuickstart.mockReturnValue(true);
      mockCreateExternalQuickstartResultItem.mockResolvedValue(mockExternalSearchItem); // 1 item

      const { result } = renderHook(() => useSearchLogic());

      await act(async () => {
        await result.current.performSearch('test');
      });

      await waitFor(() => {
        expect(result.current.resultCount).toBe(3); // 2 local + 1 MCP
      });
    });

    it('should count MCP tool result as 1', async () => {
      mockLocalQuery.mockResolvedValue([]);
      mockFetchMCPQuickstarts.mockResolvedValue(mockMCPToolResponse);
      // Configure type guards for string tool data
      mockIsStringToolData.mockReturnValue(true);

      const { result } = renderHook(() => useSearchLogic());

      await act(async () => {
        await result.current.performSearch('hello');
      });

      await waitFor(() => {
        expect(result.current.resultCount).toBe(1); // 1 MCP tool result
      });
    });
  });

  describe('State management', () => {
    it('should update isFetching correctly during async operations', async () => {
      let resolveLocalQuery: (value: SearchItem[]) => void;
      let resolveMCPQuery: (value: any) => void;

      const localQueryPromise = new Promise<SearchItem[]>((resolve) => {
        resolveLocalQuery = resolve;
      });
      const mcpQueryPromise = new Promise<any>((resolve) => {
        resolveMCPQuery = resolve;
      });

      mockLocalQuery.mockReturnValue(localQueryPromise);
      mockFetchMCPQuickstarts.mockReturnValue(mcpQueryPromise);

      const { result } = renderHook(() => useSearchLogic());

      // Start the search
      act(() => {
        result.current.performSearch('async test');
      });

      // Should be fetching immediately
      expect(result.current.isFetching).toBe(true);

      // Resolve the promises
      act(() => {
        resolveLocalQuery!(mockSearchItems);
        resolveMCPQuery!(null);
      });

      // Should stop fetching after promises resolve
      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });
    });
  });
});
