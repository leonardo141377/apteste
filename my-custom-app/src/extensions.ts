import { app } from '@wix/custom-extensions';
import clientsPage from './extensions/dashboard/pages/clients/clients.extension.ts';
import dataCollections from './extensions/data/collections.extension.ts';

export default app().use(clientsPage).use(dataCollections);
