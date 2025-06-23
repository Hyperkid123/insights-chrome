import React, { useEffect, useState } from 'react';
import { MenuContent, MenuGroup, MenuItem, MenuList } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import SearchMenuItem from './SearchMenuItem';
import EmptySearchState from './EmptySearchState';
import type { SearchItem } from './SearchTypes';

interface SearchMenuContentProps {
  searchItems: SearchItem[];
  mcpSearchItems: SearchItem[];
  mcpToolResult: string | null;
  isFetching: boolean;
  onMenuClose: () => void;
}

// Typewriter animation component for MCP tool results
const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (displayedText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[displayedText.length]);
      }, 30);

      return () => clearTimeout(timeout);
    }
  }, [displayedText.length, text]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
  }, [text]);

  return (
    <Content style={{ margin: 0 }}>
      {displayedText.split('').map((char, index) => (
        <span
          key={index}
          style={{
            opacity: 0,
            animation: `fadeIn 0.3s ease-in-out ${index * 0.05}s forwards`,
          }}
        >
          {char}
        </span>
      ))}
    </Content>
  );
};

const SearchMenuContent = ({ searchItems, mcpSearchItems, mcpToolResult, isFetching, onMenuClose }: SearchMenuContentProps) => {
  // Debug logging
  console.log('SearchMenuContent props:', {
    searchItemsLength: searchItems.length,
    mcpSearchItemsLength: mcpSearchItems.length,
    mcpToolResult,
    isFetching,
  });

  // If we have an MCP tool result, show only that
  if (mcpToolResult) {
    console.log('Showing MCP tool result:', mcpToolResult);
    return (
      <MenuContent>
        <MenuList>
          <MenuItem isDisabled>
            <div style={{ padding: '12px 8px' }}>
              <TypewriterText text={mcpToolResult} />
            </div>
          </MenuItem>
        </MenuList>
      </MenuContent>
    );
  }

  // Otherwise show normal search results
  const hasResults = searchItems.length > 0 || mcpSearchItems.length > 0;

  return (
    <MenuContent>
      <MenuList>
        {/* MCP External Documentation Results */}
        {mcpSearchItems.length > 0 && (
          <MenuGroup label="External Documentation">
            {mcpSearchItems.map((item, index) => (
              <SearchMenuItem key={`mcp-${index}`} item={item} index={index} isExternal onMenuClose={onMenuClose} />
            ))}
          </MenuGroup>
        )}

        {/* Divider between groups */}
        {mcpSearchItems.length > 0 && searchItems.length > 0 && <Divider className="pf-v6-u-my-md" />}

        {/* Local Search Results */}
        {searchItems.length > 0 && (
          <MenuGroup label={mcpSearchItems.length > 0 ? 'Search Results' : `Top ${searchItems.length} results`}>
            {searchItems.map((item, index) => (
              <SearchMenuItem key={`local-${index}`} item={item} index={index} onMenuClose={onMenuClose} />
            ))}
          </MenuGroup>
        )}

        {/* Empty State */}
        {!hasResults && !isFetching && <EmptySearchState />}
      </MenuList>
    </MenuContent>
  );
};

export default SearchMenuContent;
