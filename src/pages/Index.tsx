
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tokenContract } from '../services/TokenContract';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Wallet, Power } from "lucide-react";

const Index = () => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      const account = await tokenContract.connect();
      setAccount(account);
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
            <Button
              variant="outline"
              onClick={handleConnect}
              className="glass"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="glass"
            >
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
            <p className="text-muted-foreground">Connect your wallet to view token details and make transfers</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default Index;
