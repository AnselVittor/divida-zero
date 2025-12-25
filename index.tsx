import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Substitua estas strings pelas suas variáveis de ambiente ou valores do Auth0
// Idealmente use process.env.VITE_AUTH0_DOMAIN e process.env.VITE_AUTH0_CLIENT_ID
const domain = process.env.VITE_AUTH0_DOMAIN || "SEU_AUTH0_DOMAIN_AQUI";
const clientId = process.env.VITE_AUTH0_CLIENT_ID || "SEU_AUTH0_CLIENT_ID_AQUI";

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);