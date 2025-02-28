import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import EthereumCheck from './services/EthereumCheck';

// Add global error handling
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  // Display error on page for debugging
  const errorDiv = document.createElement('div');
  errorDiv.style.backgroundColor = '#ffeeee';
  errorDiv.style.color = '#ff0000';
  errorDiv.style.padding = '20px';
  errorDiv.style.margin = '20px';
  errorDiv.style.borderRadius = '5px';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.innerHTML = `<h3>Application Error</h3><p>${event.error?.message || 'Unknown error'}</p>`;
  
  document.body.prepend(errorDiv);
});

// Function to initialize the app
const initializeApp = () => {
  const root = document.getElementById("root");

  if (root) {
    try {
      // Check MetaMask installation
      const providerStatus = EthereumCheck.getProviderStatus();
      
      if (!providerStatus.available) {
        // Display MetaMask installation message if not available
        const errorDiv = document.createElement('div');
        errorDiv.style.backgroundColor = '#f5f5ff';
        errorDiv.style.padding = '20px';
        errorDiv.style.margin = '20px';
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.textAlign = 'center';
        errorDiv.innerHTML = `
          <h2>MetaMask Required</h2>
          <p>${providerStatus.errorMessage}</p>
          <p>Please install <a href="https://metamask.io/" target="_blank">MetaMask</a> to use this application.</p>
          <p>After installation, refresh this page.</p>
        `;
        
        root.appendChild(errorDiv);
      } else {
        // Render the app with BrowserRouter
        createRoot(root).render(
          <React.StrictMode>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </React.StrictMode>
        );
        console.log('App rendered successfully with BrowserRouter');
      }
    } catch (error) {
      console.error('Error rendering application:', error);
      
      // Display user-friendly error
      const errorDiv = document.createElement('div');
      errorDiv.style.backgroundColor = '#ffeeee';
      errorDiv.style.padding = '20px';
      errorDiv.style.margin = '20px';
      errorDiv.style.borderRadius = '5px';
      errorDiv.innerHTML = `
        <h2>Application Error</h2>
        <p>Sorry, something went wrong when loading the application.</p>
        <p>Please check the browser console for more details or try refreshing the page.</p>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
      `;
      
      root.appendChild(errorDiv);
    }
  } else {
    console.error('Root element not found');
    
    // Create root element if missing
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.style.backgroundColor = '#ffeeee';
    errorDiv.style.padding = '20px';
    errorDiv.style.margin = '20px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.innerHTML = '<h2>Root Element Missing</h2><p>The application could not find the root element to render into.</p>';
    
    newRoot.appendChild(errorDiv);
    
    // Try initializing again
    setTimeout(initializeApp, 100);
  }
};

// Initialize the app
initializeApp();
