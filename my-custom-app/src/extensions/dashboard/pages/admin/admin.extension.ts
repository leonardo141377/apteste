import { extensions } from '@wix/custom-extensions';

export default extensions.dashboardPage({
  id: 'bf2b862e-be58-4a54-a5c8-01cf91437509',
  title: 'HA Admin',
  routePath: '',
  component: './extensions/dashboard/pages/admin/admin.tsx',
  fullPage: false,
  metaData: {
    searchable: true,
    description: 'Clientes, instalações e inventário do HA Automation Builder.',
  },
});
