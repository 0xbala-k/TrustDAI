import React from 'react';
import { WalletProvider } from './contexts/WalletContext';
import WalletConnection from './components/WalletConnection';
import AddFile from './components/AddFile';
import FileDetails from './components/FileDetails';
import FeatureToggle from './components/FeatureToggle';
import { Routes, Route } from 'react-router-dom';
import SimpleTestRunner from './components/SimpleTestRunner';
import { FeatureFlagsProvider } from './components/FeatureToggle';
import EnvTabs, { EnvProvider } from './components/EnvTabs';
import './App.css';

const App: React.FC = () => {
  return (
    <FeatureFlagsProvider>
      <WalletProvider>
        <EnvProvider>
          <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
              <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">TrustDAI</h1>
                <WalletConnection />
              </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<EnvTabs />} />
                <Route path="/add" element={<AddFile />} />
                <Route path="/file/:cid" element={<FileDetails />} />
                <Route path="/tests" element={<SimpleTestRunner />} />
                <Route path="/features" element={<FeatureToggle />} />
              </Routes>
            </main>
          </div>
        </EnvProvider>
      </WalletProvider>
    </FeatureFlagsProvider>
  );
};

export default App;
