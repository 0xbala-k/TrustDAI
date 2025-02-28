import React, { useState, createContext, useContext, ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import { FileList } from './FileLists';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import CategoryFileUpload from './CategoryFileUpload';
import { useWallet } from '../contexts/WalletContext';

// Environment context type
interface EnvContextType {
  activeEnvironment: 'dev' | 'dev-ai';
  setActiveEnvironment: (env: 'dev' | 'dev-ai') => void;
}

// Create context with default values
const EnvContext = createContext<EnvContextType>({
  activeEnvironment: 'dev',
  setActiveEnvironment: () => {}
});

// Hook to use environment context
export const useEnv = () => useContext(EnvContext);

// Environment provider component
export const EnvProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeEnvironment, setActiveEnvironment] = useState<'dev' | 'dev-ai'>('dev');
  
  return (
    <EnvContext.Provider value={{ activeEnvironment, setActiveEnvironment }}>
      {children}
    </EnvContext.Provider>
  );
};

// MockFileService for demonstration
const mockUpload = async (data: any, prices: Record<string, string>): Promise<string> => {
  // Simulate blockchain upload
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate a mock CID
  const cid = `Qm${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
  
  console.log('Uploaded data:', data);
  console.log('With prices:', prices);
  
  return cid;
};

// Main environment tabs component
const EnvTabs: React.FC = () => {
  const { activeEnvironment, setActiveEnvironment } = useEnv();
  const { isConnected } = useWallet();
  const [sharedFiles, setSharedFiles] = useState<any[]>([]);
  
  // Simulate sharing a file between environments
  const handleShareFile = (file: any, targetEnv: 'dev' | 'dev-ai') => {
    setSharedFiles(prev => [...prev, { ...file, sharedTo: targetEnv }]);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">TrustDAI Data Manager</h2>
        
        {isConnected && <CategoryFileUpload onUpload={mockUpload} />}
      </div>
      
      <Tabs 
        defaultValue="dev" 
        value={activeEnvironment}
        onValueChange={(value) => setActiveEnvironment(value as 'dev' | 'dev-ai')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dev" className="relative">
            dev
            {activeEnvironment === 'dev-ai' && sharedFiles.some(f => f.sharedTo === 'dev') && (
              <Badge variant="default" className="absolute -top-2 -right-2 w-4 h-4 p-0 flex items-center justify-center">
                {sharedFiles.filter(f => f.sharedTo === 'dev').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dev-ai" className="relative">
            dev-ai
            {activeEnvironment === 'dev' && sharedFiles.some(f => f.sharedTo === 'dev-ai') && (
              <Badge variant="default" className="absolute -top-2 -right-2 w-4 h-4 p-0 flex items-center justify-center">
                {sharedFiles.filter(f => f.sharedTo === 'dev-ai').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dev" className="p-0 border-none">
          <Card className="shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle>Dev Environment</CardTitle>
              <CardDescription>
                This environment represents your personal data wallet.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <FileList 
                environment="dev"
                onShareFile={(file) => handleShareFile(file, 'dev-ai')}
                sharedFiles={sharedFiles.filter(f => f.sharedTo === 'dev-ai')}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dev-ai" className="p-0 border-none">
          <Card className="shadow-sm">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-purple-50">
              <CardTitle>Dev-AI Environment</CardTitle>
              <CardDescription>
                This environment represents the AI's access to your shared data.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <FileList 
                environment="dev-ai"
                onShareFile={(file) => handleShareFile(file, 'dev')}
                sharedFiles={sharedFiles.filter(f => f.sharedTo === 'dev')}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnvTabs; 