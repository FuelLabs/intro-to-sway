/* ANCHOR: fe_index_all */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { FuelProvider } from '@fuels/react';
import {
  FuelWalletConnector,
  FuelWalletDevelopmentConnector,
  FueletWalletConnector,
} from '@fuels/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
       <QueryClientProvider client={queryClient}>
      <FuelProvider
        fuelConfig={{
          connectors: [
            new FuelWalletConnector(),
            new FuelWalletDevelopmentConnector(),
            new FueletWalletConnector(),
          ],
        }}
      >
        <App />
      </FuelProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
/* ANCHOR: fe_index_all */
