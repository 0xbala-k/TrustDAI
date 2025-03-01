import { OktoProvider } from "@okto_web3/react-sdk";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const config = {
    environment: "sandbox",
    clientPrivateKey: import.meta.env.VITE_CLIENT_PRIV_KEY,
    clientSWA: import.meta.env.VITE_CLIENT_SWA,
};

createRoot(document.getElementById("root")!).render(
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <OktoProvider config={config}>
            <App />
        </OktoProvider>
    </GoogleOAuthProvider>
);
