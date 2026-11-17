import { app } from '@wix/custom-extensions';
import adminPage from './extensions/dashboard/pages/admin/admin.extension.ts';
import dataCollections from './extensions/data/collections.extension.ts';

export default app().use(adminPage).use(dataCollections);
