import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tokenContract } from '../services/TokenContract';
import { addData, getData } from '../services/helpers.ts'; // Adjust import path accordingly
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Wallet, Power } from "lucide-react";
import { trustDAIContract } from '@/services/TrustDAI.ts';

const Index = () => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // States for file operations
  const [uploadFileId, setUploadFileId] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [fileResult, setFileResult] = useState(null);

  const { data: tokenData, isLoading: isLoadingTokenData } = useQuery({
    queryKey: ['tokenData', account],
    queryFn: () => tokenContract.getTokenData(),
    enabled: !!account,
  });

  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useQuery({
    queryKey: ['balance', account],
    queryFn: () => tokenContract.getBalance(),
    enabled: !!account,
  });

  const transferMutation = useMutation({
    mutationFn: () => tokenContract.transfer(recipientAddress, amount),
    onSuccess: () => {
      toast({
        title: "Transfer Successful",
        description: `${amount} tokens sent to ${recipientAddress}`,
      });
      refetchBalance();
      setAmount('');
      setRecipientAddress('');
    },
    onError: (error) => {
      toast({
        title: "Transfer Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['tokenData'] });
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
  }, [queryClient, toast]);

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
    await tokenContract.disconnect();
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
  }, [handleAccountsChanged]);

  // Handlers for file operations
  const handleAddData = async () => {
    try {
      await addData([{ fileID: uploadFileId, data: uploadContent }]);
      toast({
        title: 'Data Uploaded',
        description: 'File data uploaded successfully.',
      });
      setUploadFileId('');
      setUploadContent('');
    } catch (error) {
      console.error('Error uploading data:', error);
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleGetData = async () => {
    try {
      const data = await getData();
      setFileResult(data);
    } catch (error) {
      console.error('Error getting data:', error);
      toast({
        title: 'Fetch Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        {account && (
          <p className="text-sm text-muted-foreground font-mono">
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        )}
        <div>
          {!account ? (
            <Button variant="outline" onClick={handleConnect} className="glass">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          ) : (
            <Button variant="outline" onClick={handleDisconnect} className="glass">
              <Power className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          )}
        </div>
      </div>

      <Card className="glass animate-fadeIn">
        <CardHeader>
          <CardTitle className="text-3xl font-light">
            {isLoadingTokenData ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              `${tokenData?.name || 'Connect Wallet'} ${tokenData?.symbol ? `(${tokenData.symbol})` : ''}`
            )}
          </CardTitle>
          <CardDescription>Transfer tokens to another address</CardDescription>
        </CardHeader>
        {account ? (
          <>
            <CardContent className="space-y-6">
              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <p className="text-3xl font-semibold">
                  {isLoadingBalance ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `${balance || '0'} ${tokenData?.symbol || ''}`
                  )}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Recipient Address
                  </label>
                  <Input
                    placeholder="0x..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="glass"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="glass"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => transferMutation.mutate()}
                disabled={!recipientAddress || !amount || transferMutation.isPending}
              >
                {transferMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Tokens'
                )}
              </Button>
            </CardFooter>
          </>
        ) : (
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Connect your wallet to view token details and make transfers
            </p>
          </CardContent>
        )}
      </Card>

      {/* File Operations Section */}
      <Card className="glass animate-fadeIn mt-8">
        <CardHeader>
          <CardTitle className="text-2xl">File Operations</CardTitle>
          <CardDescription>Upload and retrieve file data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="uploadFileId" className="block text-sm font-medium mb-1">
              File ID
            </label>
            <Input
              id="uploadFileId"
              placeholder="Enter File ID"
              value={uploadFileId}
              onChange={(e) => setUploadFileId(e.target.value)}
              className="glass"
            />
          </div>
          <div>
            <label htmlFor="uploadContent" className="block text-sm font-medium mb-1">
              Data
            </label>
            <Input
              id="uploadContent"
              placeholder="Enter Data"
              value={uploadContent}
              onChange={(e) => setUploadContent(e.target.value)}
              className="glass"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={handleAddData}>Upload Data</Button>
          <Button onClick={handleGetData}>Get Data</Button>
        </CardFooter>
      </Card>

      {/* Display Retrieved File Data */}
      {fileResult && (
        <Card className="glass animate-fadeIn mt-4">
          <CardHeader>
            <CardTitle>Retrieved Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre>{JSON.stringify(fileResult, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;
