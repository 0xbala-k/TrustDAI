
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { tokenContract } from '../services/TokenContract';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const { toast } = useToast();

  const { data: tokenData, isLoading: isLoadingTokenData } = useQuery({
    queryKey: ['tokenData'],
    queryFn: () => tokenContract.getTokenData(),
  });

  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useQuery({
    queryKey: ['balance'],
    queryFn: () => tokenContract.getBalance(),
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

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-8">
      <Card className="glass animate-fadeIn">
        <CardHeader>
          <CardTitle className="text-3xl font-light">
            {isLoadingTokenData ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              `${tokenData?.name || 'Loading...'} (${tokenData?.symbol || '...'})`
            )}
          </CardTitle>
          <CardDescription>Transfer tokens to another address</CardDescription>
        </CardHeader>
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
      </Card>
    </div>
  );
};

export default Index;
