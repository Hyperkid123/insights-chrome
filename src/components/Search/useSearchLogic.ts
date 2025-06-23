import { useContext, useMemo, useReducer } from 'react';
import { useAtomValue } from 'jotai';
import { asyncLocalOrama } from '../../state/atoms/localSearchAtom';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';
import { ReleaseEnv } from '../../@types/types.d';
import { localQuery } from '../../utils/localSearch';
import {
  createExternalQuickstartResultItem,
  fetchMCPQuickstarts,
  handleMCPToolResponse,
  isExternalQuickstart,
  isQuickstartToolData,
  isStringToolData,
} from '../../utils/mcpQuickstarts';
import InternalChromeContext from '../../utils/internalChromeContext';
import useFeoConfig from '../../hooks/useFeoConfig';
import { MCP_TOOLS, SEARCH_ACTION_TYPES } from './SearchTypes';
import type { SearchAction, SearchItem, SearchState } from './SearchTypes';

const initialState: SearchState = {
  searchItems: [],
  mcpSearchItems: [],
  mcpToolResult: null,
  isFetching: false,
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case SEARCH_ACTION_TYPES.SET_FETCHING:
      return { ...state, isFetching: action.payload };

    case SEARCH_ACTION_TYPES.SET_SEARCH_RESULTS:
      return {
        ...state,
        searchItems: action.payload.searchItems,
        mcpSearchItems: action.payload.mcpSearchItems,
        isFetching: false,
      };

    case SEARCH_ACTION_TYPES.SET_MCP_TOOL_RESULT:
      return {
        ...state,
        searchItems: [],
        mcpSearchItems: [],
        mcpToolResult: action.payload,
        isFetching: false,
      };

    case SEARCH_ACTION_TYPES.SET_COMPLETE_RESULTS:
      return {
        ...state,
        searchItems: action.payload.searchItems,
        mcpSearchItems: action.payload.mcpSearchItems,
        mcpToolResult: action.payload.mcpToolResult,
        isFetching: false,
      };

    case SEARCH_ACTION_TYPES.CLEAR_RESULTS:
      return {
        ...state,
        searchItems: [],
        mcpSearchItems: [],
        mcpToolResult: null,
      };

    default:
      return state;
  }
}

export const useSearchLogic = () => {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  const asyncLocalOramaData = useAtomValue(asyncLocalOrama);
  const isPreview = useAtomValue(isPreviewAtom);
  const useFeoGenerated = useFeoConfig();
  const chrome = useContext(InternalChromeContext);

  const performSearch = async (searchValue: string) => {
    dispatch({ type: SEARCH_ACTION_TYPES.SET_FETCHING, payload: true });

    try {
      // Fire both requests in parallel
      const [localResults, mcpResponse] = await Promise.allSettled([
        localQuery(asyncLocalOramaData, searchValue, isPreview ? ReleaseEnv.PREVIEW : ReleaseEnv.STABLE, useFeoGenerated),
        fetchMCPQuickstarts(searchValue),
      ]);

      // Handle local results
      let searchResults: SearchItem[] = [];
      if (localResults.status === 'fulfilled') {
        searchResults = localResults.value;
      }

      // Handle MCP response and check if quickstart was activated
      let mcpActivatedQuickstart = false;
      let mcpSearchResults: SearchItem[] = [];
      let mcpToolResultString: string | null = null;

      if (mcpResponse.status === 'fulfilled' && mcpResponse.value) {
        const mcpData = mcpResponse.value;

        if (mcpData.status === 'success' && mcpData.tool_result) {
          const { tool } = mcpData.tool_result;

          switch (tool) {
            case MCP_TOOLS.SEARCH_QUICKSTARTS: {
              // Handle quickstart tool response
              const quickstartData = mcpData.tool_result.data;
              if (isQuickstartToolData(quickstartData)) {
                const quickstartResult = quickstartData.result;
                const quickstart = quickstartResult.quickstart?.content;

                if (quickstart) {
                  // Check if this is an external quickstart
                  if (isExternalQuickstart(quickstart)) {
                    // Add external quickstart as a search result item
                    const externalResultItem = await createExternalQuickstartResultItem(quickstart);
                    mcpSearchResults = [externalResultItem];
                  } else {
                    // Try to activate internal quickstart
                    const activated = await handleMCPToolResponse(mcpData, chrome);
                    mcpActivatedQuickstart = activated;
                  }
                }
              }
              break;
            }

            case MCP_TOOLS.GREET_USER:
            case MCP_TOOLS.ADD_NUMBERS: {
              // Handle other tools - store the string result to display in menu
              const toolData = mcpData.tool_result.data;
              if (isStringToolData(toolData)) {
                mcpToolResultString = toolData;
                // Clear search results when we have a tool result
                searchResults = [];
                mcpSearchResults = [];
                await handleMCPToolResponse(mcpData, chrome);
              }
              break;
            }

            default:
              break;
          }
        }
      }

      // Set all results in one atomic action
      dispatch({
        type: SEARCH_ACTION_TYPES.SET_COMPLETE_RESULTS,
        payload: {
          searchItems: searchResults,
          mcpSearchItems: mcpSearchResults,
          mcpToolResult: mcpToolResultString,
        },
      });

      return { mcpActivatedQuickstart };
    } finally {
      // Always set fetching to false when done, regardless of mount state
      dispatch({ type: SEARCH_ACTION_TYPES.SET_FETCHING, payload: false });
    }
  };

  const clearResults = () => {
    dispatch({ type: SEARCH_ACTION_TYPES.CLEAR_RESULTS });
  };

  const resultCount = useMemo(
    () => state.searchItems.length + state.mcpSearchItems.length + (state.mcpToolResult ? 1 : 0),
    [state.searchItems.length, state.mcpSearchItems.length, state.mcpToolResult]
  );

  return {
    searchItems: state.searchItems,
    mcpSearchItems: state.mcpSearchItems,
    mcpToolResult: state.mcpToolResult,
    isFetching: state.isFetching,
    resultCount,
    performSearch,
    clearResults,
  };
};
