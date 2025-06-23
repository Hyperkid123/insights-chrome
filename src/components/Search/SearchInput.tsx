import React, { useCallback, useEffect, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import classNames from 'classnames';
import { Menu, MenuFooter } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { SearchInput as PFSearchInput, SearchInputProps } from '@patternfly/react-core/dist/dynamic/components/SearchInput';
import { Popper } from '@patternfly/react-core/dist/dynamic/helpers/Popper/Popper';

import './SearchInput.scss';

import { useSegment } from '../../analytics/useSegment';
import useWindowWidth from '../../hooks/useWindowWidth';
import SearchFeedback, { SearchFeedbackType } from './SearchFeedback';
import SearchMenuContent from './SearchMenuContent';
import { useSearchLogic } from './useSearchLogic';

export type SearchInputprops = {
  isExpanded?: boolean;
};

const getMaxMenuHeight = (menuElement?: HTMLDivElement | null) => {
  if (!menuElement) {
    return 0;
  }
  const { height: bodyHeight } = document.body.getBoundingClientRect();
  const { top: menuTopOffset } = menuElement.getBoundingClientRect();
  // do not allow the menu to overflow the screen
  // leave 4 px free on the bottom of the viewport
  return bodyHeight - menuTopOffset - 4;
};

type SearchInputListener = {
  onStateChange: (isOpen: boolean) => void;
};

const SearchInput = ({ onStateChange }: SearchInputListener) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currentFeedbackType, setcurrentFeedbackType] = useState<SearchFeedbackType>();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const { ready, analytics } = useSegment();
  const blockCloseEvent = useRef(false);
  const isMounted = useRef(false);
  const toggleRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { md } = useWindowWidth();

  const { searchItems, mcpSearchItems, mcpToolResult, isFetching, resultCount, performSearch, clearResults } = useSearchLogic();

  const debouncedTrack = useCallback(analytics ? debounce(analytics.track, 1000) : () => null, [analytics]);

  useEffect(() => {
    if (currentFeedbackType) {
      setcurrentFeedbackType(undefined);
    }
  }, [searchValue]);

  const handleMenuKeys = (event: KeyboardEvent) => {
    if (!isOpen) {
      return;
    }
    if (menuRef.current?.contains(event.target as Node) || toggleRef.current?.contains(event.target as Node)) {
      if (event.key === 'Escape' || event.key === 'Tab') {
        setIsOpen(!isOpen);
        onStateChange(!isOpen);
        toggleRef.current?.focus();
      }
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (!blockCloseEvent.current && isOpen && !menuRef.current?.contains(event.target as Node)) {
      setIsOpen(false);
      onStateChange(false);
    }
    // unblock the close event to prevent unwanted hanging dropdown menu on subsequent input clicks
    blockCloseEvent.current = false;
  };

  const onInputClick: SearchInputProps['onClick'] = () => {
    if (!isOpen && resultCount > 0) {
      if (!md && isExpanded && searchValue !== '') {
        setIsOpen(true);
        onStateChange(true);
      } else if (md) {
        setIsOpen(true);
        onStateChange(true);
      }
      // can't use event.stoppropagation because it will block other opened menus from triggering their close event
      blockCloseEvent.current = true;
    }
  };

  const onToggleKeyDown: SearchInputProps['onKeyDown'] = (ev) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling, it would close the menu
    if (!isOpen) {
      setIsOpen(true);
      onStateChange(true);
    }

    if (isOpen && ev.key === 'ArrowDown' && menuRef.current) {
      const firstElement = menuRef.current.querySelector('li > button:not(:disabled), li > a:not(:disabled)');
      firstElement && (firstElement as HTMLElement).focus();
    } else if (isOpen && ev.key === 'Escape') {
      setIsOpen(false);
      onStateChange(false);
    }
  };

  const handleWindowResize = () => {
    const maxHeight = getMaxMenuHeight(menuRef.current);
    if (menuRef.current) {
      menuRef.current.style.maxHeight = `${maxHeight}px`;
    }
  };

  useEffect(() => {
    isMounted.current = true;
    // make sure the menu does not overflow the screen and creates extra space bellow the main content
    window.addEventListener('resize', handleWindowResize);
    // calculate initial max height
    handleWindowResize();
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      isMounted.current = false;
    };
  }, [isOpen, menuRef, resultCount]);

  useEffect(() => {
    window.addEventListener('keydown', handleMenuKeys);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleMenuKeys);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, menuRef]);

  const handleChange: SearchInputProps['onChange'] = async (_e, value) => {
    setSearchValue(value);

    const result = await performSearch(value);

    // Don't open the menu if MCP activated a quickstart
    if (result?.mcpActivatedQuickstart) {
      setIsOpen(false);
      onStateChange(false);
    } else if (resultCount > 0) {
      // Open the menu if we have results (including mcpToolResult)
      setIsOpen(true);
      onStateChange(true);
    }

    if (ready && analytics) {
      debouncedTrack('chrome.search-query', { query: value });
    }
  };

  const onToggleExpand = (_event: React.SyntheticEvent<HTMLButtonElement>, isExpanded: boolean) => {
    setIsExpanded(!isExpanded);
    setSearchValue('');
  };

  const willExpand = () => {
    const expanded = isExpanded || searchValue !== '';
    if (expanded !== isExpanded) {
      setIsExpanded(expanded);
    }
    return expanded;
  };

  const handleMenuClose = () => {
    setIsOpen(false);
    onStateChange(false);
  };

  const toggle = (
    <PFSearchInput
      placeholder="Search for services"
      value={searchValue}
      onChange={handleChange}
      onClear={(ev) => {
        setSearchValue('');
        clearResults();
        ev.stopPropagation();
        setIsOpen(false);
        onStateChange(false);
      }}
      {...{
        expandableInput: {
          isExpanded: willExpand(),
          onToggleExpand,
          toggleAriaLabel: 'Expandable search input toggle',
        },
      }}
      onClick={onInputClick}
      ref={toggleRef}
      onKeyDown={onToggleKeyDown}
      className={classNames({
        'pf-u-flex-grow-1': isExpanded,
        'chr-c-search__collapsed': !isExpanded,
        'chr-c-search__loading': isFetching,
      })}
    />
  );

  let menuFooter;
  if ((searchItems.length > 0 || mcpSearchItems.length > 0) && !isFetching) {
    menuFooter = (
      <MenuFooter className="pf-v6-u-px-md">
        <SearchFeedback
          query={searchValue}
          results={[...mcpSearchItems, ...searchItems]}
          feedbackType={currentFeedbackType}
          onFeedbackSubmitted={setcurrentFeedbackType}
        />
      </MenuFooter>
    );
  }

  const menu = (
    <Menu ref={menuRef} className="pf-v6-u-pt-sm chr-c-search__menu">
      <SearchMenuContent
        searchItems={searchItems}
        mcpSearchItems={mcpSearchItems}
        mcpToolResult={mcpToolResult}
        isFetching={isFetching}
        onMenuClose={handleMenuClose}
      />
      {menuFooter}
    </Menu>
  );

  return (
    <div ref={containerRef} className="pf-v6-c-search-input pf-v6-u-w-100 pf-v6-u-align-content-center">
      {!md && <Popper trigger={toggle} popper={menu} appendTo={containerRef.current || undefined} isVisible={isOpen && !isFetching} />}
      {md && <Popper trigger={toggle} popper={menu} appendTo={containerRef.current || undefined} isVisible={isOpen && !isFetching} />}
    </div>
  );
};

export default SearchInput;
