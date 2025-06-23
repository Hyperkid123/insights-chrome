import axios from 'axios';
import { QuickStart } from '@patternfly/quickstarts';
import { ChromeAPI } from '@redhat-cloud-services/types';
import { LabelProps } from '@patternfly/react-core/dist/dynamic/components/Label';
import { ResultItem } from './localSearch';
import { FilterApiResponse, FilterData } from '../components/Search/SearchMenuFilterItemTypes';
import { MCP_TOOLS } from '../components/Search/SearchTypes';

// Base MCP response structure
export type MCPResponse = {
  status: string;
  query: string;
  tool_result: {
    tool: string;
    data: MCPToolData;
  };
};

// Union type for different tool data structures
export type MCPToolData =
  | { result: MCPQuickstartResult } // searchQuickstarts has nested result
  | string; // greetUser and addNumbers have direct string data

// Type guards for MCP tool data
export function isQuickstartToolData(data: MCPToolData): data is { result: MCPQuickstartResult } {
  return typeof data === 'object' && data !== null && 'result' in data;
}

export function isStringToolData(data: MCPToolData): data is string {
  return typeof data === 'string';
}

// Specific tool result types
export type MCPQuickstartResult = {
  quickstart: {
    content: QuickStart;
  };
};

export type MCPGreetUserResult = string;

export type MCPAddNumbersResult = string;

// Cache for MCP responses to avoid duplicate requests for the same term
const mcpResponseCache: {
  [term: string]: MCPResponse | null;
} = {};

// Cache for FilterData to avoid multiple API calls
let filterDataCache: FilterData | null = null;
let filterDataPromise: Promise<FilterData | null> | null = null;
let filterDataFetched = false; // Flag to track if we've already attempted to fetch

// Flattened lookup map for efficient tag matching: "categoryId:itemId" -> {label, color}
let tagLookupMap: Map<string, { label: string; color?: LabelProps['color'] }> = new Map();

// Debouncing timeout
let mcpDebounceTimeout: NodeJS.Timeout | null = null;

// Current pending request promise
let currentRequestPromise: Promise<MCPResponse | null> | null = null;
let currentRequestTerm: string = '';

// Function to create a flattened lookup map from FilterData
function createTagLookupMap(filterData: FilterData): Map<string, { label: string; color?: LabelProps['color'] }> {
  const lookupMap = new Map<string, { label: string; color?: LabelProps['color'] }>();

  if (!filterData.categories || !Array.isArray(filterData.categories)) {
    return lookupMap;
  }

  for (const category of filterData.categories) {
    if (!category.categoryId || !category.categoryData || !Array.isArray(category.categoryData)) {
      continue;
    }

    for (const categoryGroup of category.categoryData) {
      if (!categoryGroup.data || !Array.isArray(categoryGroup.data)) {
        continue;
      }

      for (const item of categoryGroup.data) {
        if (item.id && item.filterLabel) {
          const key = `${category.categoryId}:${item.id}`;
          lookupMap.set(key, {
            label: item.filterLabel,
            color: item.color as LabelProps['color'],
          });
        }
      }
    }
  }

  return lookupMap;
}

// Function to fetch FilterData from the API
async function fetchFilterData(): Promise<FilterData | null> {
  // Return cached data if available
  if (filterDataCache) {
    return filterDataCache;
  }

  // If we've already tried to fetch and failed, don't try again
  if (filterDataFetched && !filterDataCache) {
    return null;
  }

  // Return existing promise if already fetching
  if (filterDataPromise) {
    return filterDataPromise;
  }

  // Create new request
  filterDataPromise = (async () => {
    try {
      const response = await axios.get<FilterApiResponse>('/api/quickstarts/v1/quickstarts/filters');
      filterDataCache = response.data.data; // Extract the actual FilterData from the wrapper
      filterDataFetched = true;

      // Create the lookup map for efficient tag matching
      tagLookupMap = createTagLookupMap(filterDataCache);

      return filterDataCache;
    } catch (error) {
      console.error('Error fetching FilterData (will not retry):', error);
      filterDataFetched = true; // Mark as attempted even on failure
      return null;
    } finally {
      filterDataPromise = null;
    }
  })();

  return filterDataPromise;
}

// Function to match quickstart tags against FilterData and create labels
async function createTagLabels(quickstart: QuickStart): Promise<Array<{ text: string; color?: LabelProps['color'] }>> {
  // Ensure FilterData is loaded (this will use cached data if already loaded)
  await fetchFilterData();

  if (!quickstart.metadata?.tags || tagLookupMap.size === 0) {
    return [];
  }

  const labels: Array<{ text: string; color?: LabelProps['color'] }> = [];
  const quickstartTags = quickstart.metadata.tags;

  // Simple O(1) lookup for each tag
  for (const tag of quickstartTags) {
    const { kind, value } = tag;

    if (!kind || !value) {
      continue; // Skip tags without both kind and value
    }

    const lookupKey = `${kind}:${value}`;
    const filterInfo = tagLookupMap.get(lookupKey);

    if (filterInfo) {
      labels.push({
        text: filterInfo.label,
        color: filterInfo.color,
      });
    }
  }

  return labels;
}

export async function fetchMCPQuickstarts(term: string): Promise<MCPResponse | null> {
  // Return cached response if available
  if (term in mcpResponseCache) {
    return mcpResponseCache[term];
  }

  // If there's already a pending request for the same term, return it
  if (currentRequestPromise && currentRequestTerm === term) {
    return currentRequestPromise;
  }

  // Clear any existing timeout
  if (mcpDebounceTimeout) {
    clearTimeout(mcpDebounceTimeout);
  }

  // Create a new debounced request
  return new Promise<MCPResponse | null>((resolve) => {
    mcpDebounceTimeout = setTimeout(async () => {
      try {
        // Set current request tracking
        currentRequestTerm = term;
        currentRequestPromise = makeActualRequest(term);

        const result = await currentRequestPromise;

        // Cache the result
        mcpResponseCache[term] = result;

        resolve(result);
      } catch (error) {
        console.error('Error in debounced MCP request:', error);
        resolve(null);
      } finally {
        // Clear current request tracking
        currentRequestPromise = null;
        currentRequestTerm = '';
        mcpDebounceTimeout = null;
      }
    }, 750); // 750ms debounce delay
  });
}

// Separate function to make the actual HTTP request
async function makeActualRequest(term: string): Promise<MCPResponse | null> {
  try {
    const response = await axios.post<MCPResponse>('/api/quickstarts/v1/mcp', {
      query: term,
    });

    if (response.data.status === 'success') {
      return response.data;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching MCP quickstarts:', error);
    return null;
  }
}

// Function to handle MCP tool responses
export async function handleMCPToolResponse(mcpResponse: MCPResponse, chromeApi?: ChromeAPI): Promise<boolean> {
  const { tool } = mcpResponse.tool_result;

  try {
    switch (tool) {
      case MCP_TOOLS.SEARCH_QUICKSTARTS: {
        // Handle quickstart activation
        const quickstartData = mcpResponse.tool_result.data;
        if (isQuickstartToolData(quickstartData)) {
          const quickstartResult = quickstartData.result;
          const quickstart = quickstartResult.quickstart?.content;

          if (!quickstart) {
            console.warn('No quickstart content found in MCP response');
            return false;
          }

          if (!chromeApi) {
            console.warn('Chrome API not available, cannot activate quickstart');
            return false;
          }

          const quickstartName = quickstart.metadata?.name;
          if (quickstartName) {
            // Add the quickstart to the store (same as activateQuickstart does)
            chromeApi.quickStarts.set('mcp', [quickstart]);

            // Set the active quickstart ID to open the drawer (same as activateQuickstart does)
            chromeApi.quickStarts.toggle(quickstartName);

            return true;
          }
        }
        return false;
      }

      case MCP_TOOLS.GREET_USER: {
        // Handle greet user response - just log for now
        const greetData = mcpResponse.tool_result.data;
        if (isStringToolData(greetData)) {
          // TODO: Add visual handling for greet user
          return true;
        }
        return false;
      }

      case MCP_TOOLS.ADD_NUMBERS: {
        // Handle add numbers response - just log for now
        const addData = mcpResponse.tool_result.data;
        if (isStringToolData(addData)) {
          // TODO: Add visual handling for add numbers
          return true;
        }
        return false;
      }

      default:
        console.warn('Unknown MCP tool:', tool);
        return false;
    }
  } catch (error) {
    console.error('Error handling MCP tool response:', error);
    return false;
  }
}

// Legacy function for backward compatibility - now delegates to handleMCPToolResponse
export async function activateMCPQuickstart(quickstart: QuickStart, chromeApi?: ChromeAPI) {
  // Create a mock MCPResponse for backward compatibility
  const mockResponse: MCPResponse = {
    status: 'success',
    query: '',
    tool_result: {
      tool: MCP_TOOLS.SEARCH_QUICKSTARTS,
      data: {
        result: {
          quickstart: {
            content: quickstart,
          },
        } as MCPQuickstartResult,
      },
    },
  };

  return handleMCPToolResponse(mockResponse, chromeApi);
}

// Helper function to check if a quickstart is external (has a link)
export function isExternalQuickstart(quickstart: QuickStart): boolean {
  return !!quickstart.spec?.link?.href;
}

// Helper function to convert an external quickstart to a search result item
export async function createExternalQuickstartResultItem(quickstart: QuickStart): Promise<ResultItem> {
  const link = quickstart.spec.link!;
  const labels = await createTagLabels(quickstart);

  return {
    id: quickstart.metadata.name || 'unknown',
    title: quickstart.spec.displayName || quickstart.metadata.name || 'Untitled Quickstart',
    description: quickstart.spec.description || 'External quickstart documentation',
    bundleTitle: 'External Documentation',
    pathname: link.href,
    source: 'mcp' as const,
    labels: labels.length > 0 ? labels : undefined,
  };
}
