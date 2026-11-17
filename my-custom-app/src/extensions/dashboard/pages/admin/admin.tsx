import { useState, type FC } from 'react';
import { Page, WixDesignSystemProvider } from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { clientsRepo } from '../../../../data/repositories';
import type { Client, Installation } from '../../../../domain/model';
import { RecordSection } from '../../../../ui/RecordSection';
import { ClientView } from './ClientView';
import {
  checkDeleteClient,
  clientColumns,
  clientDisplayName,
  clientFields,
  clientNewValues,
  clientSearch,
  installationDisplayName,
  prepareClient,
} from './config';
import { InstallationView } from './InstallationView';

/** Navegação interna: Clientes → Cliente → Instalação. */
type Route =
  | { view: 'clients' }
  | { view: 'client'; client: Client }
  | { view: 'installation'; client: Client; installation: Installation };

const AdminPage: FC = () => {
  const [route, setRoute] = useState<Route>({ view: 'clients' });

  const header = () => {
    switch (route.view) {
      case 'client':
        return (
          <Page.Header
            title={clientDisplayName(route.client)}
            subtitle="Cliente"
            showBackButton
            onBackClicked={() => setRoute({ view: 'clients' })}
          />
        );
      case 'installation':
        return (
          <Page.Header
            title={installationDisplayName(route.installation)}
            subtitle={`Instalação · ${clientDisplayName(route.client)}`}
            showBackButton
            onBackClicked={() => setRoute({ view: 'client', client: route.client })}
          />
        );
      default:
        return <Page.Header title="Clientes" subtitle="HA Automation Builder · Admin Geral" />;
    }
  };

  const content = () => {
    switch (route.view) {
      case 'client':
        return (
          <ClientView
            key={route.client.id}
            client={route.client}
            onUpdated={(client) => setRoute({ view: 'client', client })}
            onOpenInstallation={(installation) => setRoute({ view: 'installation', client: route.client, installation })}
          />
        );
      case 'installation':
        return (
          <InstallationView
            key={route.installation.id}
            installation={route.installation}
            onUpdated={(installation) => setRoute({ ...route, installation })}
          />
        );
      default:
        return (
          <RecordSection<Client>
            repo={clientsRepo}
            noun={{ singular: 'Cliente', plural: 'Clientes', article: 'o' }}
            columns={clientColumns}
            fields={clientFields}
            newValues={clientNewValues}
            prepare={prepareClient}
            searchText={clientSearch}
            displayName={clientDisplayName}
            checkDelete={checkDeleteClient}
            onOpen={(client) => setRoute({ view: 'client', client })}
          />
        );
    }
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        {header()}
        <Page.Content>{content()}</Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default AdminPage;
