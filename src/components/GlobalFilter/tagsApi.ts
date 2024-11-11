/* eslint-disable @typescript-eslint/ban-ts-comment */
// FIXME: Figure out what are the issues with the JS client
/* eslint-disable camelcase */
import { AAP_KEY, MSSQL_KEY, flatTags } from './globalFilterApi';
import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';

import apiHostGetHostList, { ApiHostGetHostListParams } from '@redhat-cloud-services/host-inventory-client/dist/ApiHostGetHostList';
import apiTagsGetTags from '@redhat-cloud-services/host-inventory-client/dist/ApiTagGetTags';
import apiSystemProfileGetSapSids from '@redhat-cloud-services/host-inventory-client/dist/ApiSystemProfileGetSapSids';
import apiSystemProfileGetSapSystem from '@redhat-cloud-services/host-inventory-client/dist/ApiSystemProfileGetSapSystem';
import { FlagTagsFilter } from '../../@types/types';

import { search } from '../../entitySearch/hostsSearch';

const hostInventoryApi = APIFactory({
  apiHostGetHostList,
  apiTagsGetTags,
  apiSystemProfileGetSapSids,
  apiSystemProfileGetSapSystem,
});

export type Workload = { isSelected?: boolean };
export type TagPagination = { perPage?: number; page?: number };
export type TagFilterOptions = { search?: string; registeredWith?: any[]; activeTags?: FlagTagsFilter };

const buildFilter = (workloads?: { [key: string]: Workload }, SID?: string[]) => ({
  system_profile: {
    ...(workloads?.SAP?.isSelected && { sap_system: true }),
    // enable once AAP filter is enabled
    ...(workloads?.[AAP_KEY]?.isSelected && {
      ansible: 'not_nil',
    }),
    ...(workloads?.[MSSQL_KEY]?.isSelected && {
      mssql: 'not_nil',
    }),
    sap_sids: SID,
  },
});

type GenerateFilterData = ReturnType<typeof buildFilter> | string | boolean | string[] | undefined;

/**
 * This has to be pulled out of FEC for a while until we split react and non react helper functions
 */
const generateFilter = (
  data: GenerateFilterData,
  path = 'filter',
  options?: { arrayEnhancer?: string }
): { [key: string]: string | boolean | string[] } =>
  Object.entries(data || {}).reduce<{ [key: string]: boolean | string | string[] }>((acc, [key, value]) => {
    const newPath = `${path || ''}[${key}]${Array.isArray(value) ? `${options?.arrayEnhancer ? `[${options.arrayEnhancer}]` : ''}[]` : ''}`;
    if (value instanceof Function || value instanceof Date) {
      return acc;
    }

    return {
      ...acc,
      ...(Array.isArray(value) || typeof value !== 'object' ? { [newPath]: value } : generateFilter(value, newPath, options)),
    };
  }, {});

export function getAllTags({ search, activeTags, registeredWith }: TagFilterOptions = {}, pagination?: TagPagination) {
  const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);
  
  return hostInventoryApi.apiTagsGetTags({
    tags: selectedTags,
    orderBy: 'tag',
    orderHow: 'ASC',
    perPage: pagination?.perPage || 10,
    page: pagination?.page || 1,
    search,
    registeredWith: registeredWith,
    filter: generateFilter(buildFilter(workloads, SID)) as any,
  });
}

export function getAllSIDs({ search, activeTags, registeredWith }: TagFilterOptions = {}, pagination: TagPagination = {}) {
  const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);

  return hostInventoryApi.apiSystemProfileGetSapSids({
    search,
    tags: selectedTags,
    perPage: pagination.perPage || 10,
    page: pagination.page || 1,
    registeredWith: registeredWith,
    filter: generateFilter(buildFilter(workloads, SID)) as any,
  });
}

export async function getAllWorkloads({ activeTags, registeredWith }: TagFilterOptions = {}, pagination: TagPagination = {}) {
  const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);
  search('test');
  const [SAP, AAP, MSSQL] = await Promise.all([
    hostInventoryApi.apiSystemProfileGetSapSystem({
      tags: selectedTags,
      perPage: pagination.perPage || 10,
      page: pagination.page || 1,
      registeredWith: registeredWith,
      filter: generateFilter(buildFilter(workloads, SID)) as any,
    }),
    hostInventoryApi.apiHostGetHostList({
      registeredWith: registeredWith,
      perPage: 1,
      tags: selectedTags,
      filter: generateFilter(
        buildFilter(
          {
            ...(workloads || {}),
            [AAP_KEY]: { isSelected: true },
          },
          SID
        )
      ) as unknown as ApiHostGetHostListParams['filter'],
    }),
    hostInventoryApi.apiHostGetHostList({
      registeredWith: registeredWith,
      perPage: 1,
      tags: selectedTags,
      filter: generateFilter(
        buildFilter(
          {
            ...(workloads || {}),
            [MSSQL_KEY]: { isSelected: true },
          },
          SID
        )
      ) as unknown as ApiHostGetHostListParams['filter'],
    }),
  ]);
  return { SAP, AAP, MSSQL };
}
