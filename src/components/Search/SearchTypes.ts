import { LabelProps } from '@patternfly/react-core/dist/dynamic/components/Label';

export interface SearchItem {
  title: string;
  description: string;
  bundleTitle: string;
  pathname: string;
  id: string;
  source?: 'local' | 'mcp';
  labels?: Array<{ text: string; color?: LabelProps['color'] }>;
}

// Search action types
export const SEARCH_ACTION_TYPES = {
  SET_FETCHING: 'SET_FETCHING',
  SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
  SET_MCP_TOOL_RESULT: 'SET_MCP_TOOL_RESULT',
  SET_COMPLETE_RESULTS: 'SET_COMPLETE_RESULTS',
  CLEAR_RESULTS: 'CLEAR_RESULTS',
} as const;

// MCP tool names
export const MCP_TOOLS = {
  SEARCH_QUICKSTARTS: 'searchQuickstarts',
  GREET_USER: 'greetUser',
  ADD_NUMBERS: 'addNumbers',
} as const;

// Search state interface
export interface SearchState {
  searchItems: SearchItem[];
  mcpSearchItems: SearchItem[];
  mcpToolResult: string | null;
  isFetching: boolean;
}

// Search action types
export type SearchAction =
  | { type: typeof SEARCH_ACTION_TYPES.SET_FETCHING; payload: boolean }
  | { type: typeof SEARCH_ACTION_TYPES.SET_SEARCH_RESULTS; payload: { searchItems: SearchItem[]; mcpSearchItems: SearchItem[] } }
  | { type: typeof SEARCH_ACTION_TYPES.SET_MCP_TOOL_RESULT; payload: string }
  | {
      type: typeof SEARCH_ACTION_TYPES.SET_COMPLETE_RESULTS;
      payload: { searchItems: SearchItem[]; mcpSearchItems: SearchItem[]; mcpToolResult: string | null };
    }
  | { type: typeof SEARCH_ACTION_TYPES.CLEAR_RESULTS };
