import { app } from '@wix/custom-extensions';
import myPage from './extensions/dashboard/pages/my-page/my-page.extension.ts';
import dataCollections from './extensions/data/collections.extension.ts';

export default app().use(myPage).use(dataCollections);
