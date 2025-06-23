import React from 'react';
import { MenuItem } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { Label, LabelProps } from '@patternfly/react-core/dist/dynamic/components/Label';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';
import { ExternalLinkAltIcon } from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';
import ChromeLink from '../ChromeLink';
import SearchTitle from './SearchTitle';
import SearchDescription from './SearchDescription';
import type { SearchItem } from './SearchTypes';

interface SearchMenuItemProps {
  item: SearchItem;
  index: number;
  isExternal?: boolean;
  onMenuClose: () => void;
}

const SearchMenuItem = ({ item, index, isExternal = false, onMenuClose }: SearchMenuItemProps) => {
  const keyPrefix = isExternal ? 'mcp' : 'local';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setTimeout(() => {
        onMenuClose();
      });
    }
  };

  const labelsSection = item.labels && item.labels.length > 0 && (
    <div className="pf-v6-u-mt-xs">
      <Split hasGutter className="chr-c-search-labels">
        {item.labels.map((label: { text: string; color?: LabelProps['color'] }, labelIndex: number) => (
          <SplitItem key={labelIndex}>
            <Label variant="outline" color={label.color} isCompact>
              {label.text}
            </Label>
          </SplitItem>
        ))}
      </Split>
    </div>
  );

  const content = isExternal ? (
    <div className="pf-v6-u-display-flex pf-v6-u-align-items-flex-start pf-v6-u-gap-xs">
      <div className="pf-v6-u-flex-grow-1">
        <SearchTitle title={item.title} bundleTitle={item.bundleTitle.replace(/(\[|\])/gm, '')} className="pf-v6-u-mb-xs" />
        <SearchDescription description={item.description} />
        {labelsSection}
      </div>
      <ExternalLinkAltIcon className="pf-v6-u-font-size-sm pf-v6-u-color-200 pf-v6-u-mt-xs" />
    </div>
  ) : (
    <>
      <SearchTitle title={item.title} bundleTitle={item.bundleTitle.replace(/(\[|\])/gm, '')} className="pf-v6-u-mb-xs" />
      <SearchDescription description={item.description} />
      {labelsSection}
    </>
  );

  return (
    <MenuItem
      onKeyDown={handleKeyDown}
      key={`${keyPrefix}-${index}`}
      className="pf-v6-u-mb-xs"
      component={(props) => <ChromeLink {...props} href={item.pathname} isExternal={isExternal} />}
    >
      {content}
    </MenuItem>
  );
};

export default SearchMenuItem;
