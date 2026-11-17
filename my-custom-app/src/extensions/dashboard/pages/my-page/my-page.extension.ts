import { extensions } from '@wix/custom-extensions';

export default extensions.dashboardPage({
  id: 'bf2b862e-be58-4a54-a5c8-01cf91437509',
  title: 'My Page',
  routePath: '',
  component: './extensions/dashboard/pages/my-page/my-page.tsx',
  fullPage: false,
  metaData: {
    searchable: true,
    description: 'Manage My Page in your dashboard.',
  },
});
