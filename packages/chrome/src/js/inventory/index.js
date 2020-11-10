import { allDetails, drawer } from './accountNumbers.json';
import invData from '@redhat-cloud-services/frontend-components-inventory';

const isEnabled = async () => {
  const isExperimentalEnabled = window.localStorage.getItem('chrome:inventory:experimental_detail');
  const { identity } = await insights.chrome.auth.getUser();
  return (
    (isExperimentalEnabled && isExperimentalEnabled !== 'false') ||
    // eslint-disable-next-line camelcase
    (allDetails.includes(identity?.internal?.account_id) && isExperimentalEnabled !== 'false')
  );
};

const isDrawerEnabled = async () => {
  const drawerEnabled = window.localStorage.getItem('chrome:inventory:experimental_drawer');
  const { identity } = await insights.chrome.auth.getUser();
  return (
    (drawerEnabled && drawerEnabled !== 'false') ||
    // eslint-disable-next-line camelcase
    (drawer.includes(identity?.internal?.account_id) && drawerEnabled !== 'false')
  );
};

export default async () => {
  let SystemAdvisoryListStore;
  let SystemCvesStore;
  let systemProfileStore;
  let RenderWrapper;

  const isDetailsEnabled = await isEnabled();
  const drawerEnabled = await isDrawerEnabled();
  await import(/* webpackChunkName: "inventory-styles" */ './inventoryStyles');

  if (isDetailsEnabled) {
    SystemAdvisoryListStore = (
      await import(
        /* webpackChunkName: "inventory-patch-store" */
        '@redhat-cloud-services/frontend-components-inventory-patchman/dist/cjs/SystemAdvisoryListStore'
      )
    )?.SystemAdvisoryListStore;

    SystemCvesStore = (
      await import(
        /* webpackChunkName: "inventory-vuln-store" */
        '@redhat-cloud-services/frontend-components-inventory-vulnerabilities/dist/cjs/SystemCvesStore'
      )
    )?.SystemCvesStore;
  }

  console.log({ invData });

  return {
    ...invData,
    inventoryConnector: (store) =>
      invData.inventoryConnector(
        store,
        isDetailsEnabled
          ? {
              componentMapper: RenderWrapper.default,
              appList: [
                { title: 'General information', name: 'general_information', pageId: 'inventory' },
                { title: 'Advisor', name: 'advisor', pageId: 'insights' },
                { title: 'Vulnerability', name: 'vulnerabilities', pageId: 'vulnerability' },
                { title: 'Compliance', name: 'compliance' },
                { title: 'Patch', name: 'patch' },
              ],
            }
          : undefined,
        drawerEnabled ? RenderWrapper.default : undefined,
        true
      ),
    mergeWithDetail: (redux) => ({
      ...invData.mergeWithDetail(redux),
      ...((isDetailsEnabled || drawerEnabled) && { systemProfileStore: systemProfileStore.default }),
      ...(isDetailsEnabled && {
        SystemCvesStore,
        SystemAdvisoryListStore,
      }),
    }),
  };
};
