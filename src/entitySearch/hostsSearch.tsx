import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import getHosts from '@redhat-cloud-services/host-inventory-client/dist/ApiHostGetHostList';
import { HostOut } from '@redhat-cloud-services/host-inventory-client/dist/types';
import { ChromeAPI } from '@redhat-cloud-services/types';

const hostsSearchFactory = APIFactory('/api/inventory/v1', { getHosts });

type ListResponse<T> = {
  data: {
    count: number;
    page: number;
    per_page: number;
    total: number;
    results: T[];
  };
};

export const search = async (query: string, chrome: ChromeAPI) => {
  const { data } = (await hostsSearchFactory.getHosts({
    displayName: query,
    perPage: 10,
  })) as unknown as ListResponse<HostOut>;
  return data.results.map((host) => ({
    title: host.display_name,
    description: 'Inventory host' + host.display_name,
    href: `/insights/inventory/${host.id}`,
  }));
};