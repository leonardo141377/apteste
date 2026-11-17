// @ts-check
import { defineWixConfig } from '@wix/cli/config';
import customExtensions from '@wix/custom-extensions/flow';
import zeroConfig from '@wix/cli-zero-config-flow';

const appId = '547e1e40-db6f-4473-8834-bb9f5ddb5345';

export default defineWixConfig({
  flows: [
    customExtensions({
      appId,
      projectId: 'my-custom-app',
      namespace: '@classimin/app-ha',
      codeIdentifier: 'app_ha',
    }),
    zeroConfig({ appId }),
  ],
});
