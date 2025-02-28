import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { trustDAIContract } from '@/services/TrustDAI';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Power, FileText, Upload, Database } from "lucide-react";
import FileUpload from '@/components/FileUpload';
import { FileList } from '@/components/FileLists';

const FilesPage = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      toast({
        title: "Account Changed",
        description: `Switched to account: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } else {
      setAccount(null);
      toast({
        title: "Disconnected",
        description: "No account connected",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async () => {
    try {
      const account = await trustDAIContract.connect();
      setAccount(account);
      await trustDAIContract.initializeContract();
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to MetaMask",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    await trustDAIContract.disconnect();
    setAccount(null);
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    toast({
      title: "Wallet Disconnected",
      description: "Successfully disconnected from MetaMask",
    });
  };

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const [account] = await window.ethereum.request({ method: 'eth_accounts' });
        if (account) {
          setAccount(account);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };
    
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: "File Uploaded",
      description: "Your file has been successfully uploaded and registered",
    });
  };

  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">TrustDAI File Management</h1>
        <div>
          {!account ? (
            <Button
              variant="outline"
              onClick={handleConnect}
              className="glass"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          ) : (
            <div className="flex items-center space-x-4">
              <p className="text-sm text-muted-foreground font-mono">
                {account.slice(0, 6)}...{account.slice(-4)}
              </p>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="glass"
              >
                <Power className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </div>

      {account ? (
        <Tabs defaultValue="files" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="files">
              <FileText className="mr-2 h-4 w-4" />
              My Files
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </TabsTrigger>
          </TabsList>
          <TabsContent value="files" className="space-y-4">
            <FileList refreshTrigger={refreshTrigger} />
          </TabsContent>
          <TabsContent value="upload">
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="glass animate-fadeIn mt-10">
          <CardHeader className="text-center pb-4">
            <Database className="w-12 h-12 mx-auto text-primary opacity-80" />
            <CardTitle className="text-2xl mt-4">
              Secure File Management with TrustDAI
            </CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Connect your wallet to start managing files with blockchain-secured access control
              powered by EthStorage.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-6 pb-8">
            <div className="flex flex-col space-y-2 items-center">
              <ul className="text-left text-sm text-muted-foreground space-y-1 mb-6">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                  Store files securely using EthStorage
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                  Control who has access to your files
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                  Share and revoke access using blockchain permissions
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                  Complete transparency and security for your data
                </li>
              </ul>
              <Button onClick={handleConnect} className="px-8">
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet to Begin
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FilesPage; 