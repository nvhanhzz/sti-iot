import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import App from './views/App.tsx';
import '../lang/i18n';
import { SocketProvider } from "../context/SocketContext.tsx";

const container = document.getElementById('root');
const root = createRoot(container!); // Non-null assertion

root.render(
  <SocketProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </SocketProvider>
);
