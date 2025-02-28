import React from 'react';
import { createRoot } from 'react-dom/client';

// Simple React component
function BasicApp() {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '40px auto', 
      padding: '20px', 
      backgroundColor: '#f0f8ff', 
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h1>Basic React App</h1>
      <p>This is a minimal React application to test if React rendering works correctly.</p>
      
      <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#d1e7dd', borderRadius: '4px' }}>
        <h2>Success!</h2>
        <p>If you can see this, React is working properly.</p>
      </div>
      
      <div>
        <h3>Next Steps:</h3>
        <ul>
          <li>Check browser console for errors related to the main application</li>
          <li>Look for issues in environment variables or configuration</li>
          <li>Verify that all required packages are installed</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <a 
          href="/" 
          style={{ 
            display: 'inline-block', 
            padding: '10px 15px', 
            backgroundColor: '#0d6efd', 
            color: 'white', 
            borderRadius: '4px', 
            textDecoration: 'none' 
          }}
        >
          Try Main App Again
        </a>
      </div>
    </div>
  );
}

// Initialize the app
try {
  console.log('Starting basic-app.tsx initialization');
  const container = document.getElementById('root');
  
  if (container) {
    console.log('Root element found, creating React root');
    const root = createRoot(container);
    console.log('Rendering BasicApp component');
    root.render(
      <React.StrictMode>
        <BasicApp />
      </React.StrictMode>
    );
    console.log('BasicApp component rendered successfully');
  } else {
    console.error('Root element not found');
    document.body.innerHTML += '<div style="color:red;padding:20px;">Error: Root element not found</div>';
  }
} catch (error) {
  console.error('Error initializing basic app:', error);
  document.body.innerHTML += `<div style="color:red;padding:20px;">Error: ${error.message}</div>`;
} 