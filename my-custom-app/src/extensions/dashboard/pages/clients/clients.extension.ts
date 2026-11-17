import { extensions } from '@wix/custom-extensions';

export default extensions.dashboardPage({
  id: 'bf2b862e-be58-4a54-a5c8-01cf91437509',
  title: 'Clientes',
  routePath: '',
  component: './extensions/dashboard/pages/clients/clients.tsx',
  fullPage: false,
  metaData: {
    searchable: true,
    description: 'Cadastro de clientes do HA Automation Builder.',
  },
});
