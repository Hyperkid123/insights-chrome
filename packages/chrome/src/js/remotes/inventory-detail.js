import React from 'react';
import { InventoryDetail } from '@redhat-cloud-services/frontend-components-inventory';
const appList = [
  { title: 'General information', name: 'general_information', pageId: 'inventory' },
  { title: 'Advisor', name: 'advisor', pageId: 'insights' },
  { title: 'Vulnerability', name: 'vulnerabilities', pageId: 'vulnerability' },
  { title: 'Compliance', name: 'compliance' },
  { title: 'Patch', name: 'patch' },
];

const ChromeInventoryDetail = (props) => <InventoryDetail {...props} appList={appList} />;
export default ChromeInventoryDetail;
