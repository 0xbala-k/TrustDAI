import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { 
  Wallet, 
  Power, 
  ChevronsUpDown, 
  Copy, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2,
  Loader2 
} from 'lucide-react';
import { truncateAddress, formatBalance } from '../utils/formatters';
import { ethers } from 'ethers';

// Network configuration
const NETWORKS = {
  sepolia: {
    name: 'Sepolia',
    symbol: 'ETH',
    icon: '🔵',
    explorerUrl: 'https://sepolia.etherscan.io/address/'
  },
  quark: {
    name: 'QuarkChain',
    symbol: 'QKC',
    icon: '🟣',
    explorerUrl: 'https://mainnet.quarkchain.io/address/'
  },
  lit: {
    name: 'LitProtocol',
    symbol: 'LIT',
    icon: '🔥',
    explorerUrl: 'https://explorer.litprotocol.com/address/'
  }
};

const WalletConnection: React.FC = () => {
  const { 
    isConnected, 
    address, 
    isCorrectNetwork,
    connect, 
    disconnect, 
    networkName
  } = useWallet();

  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [quarkBalance, setQuarkBalance] = useState<string | null>(null);
  const [litBalance, setLitBalance] = useState<string | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeEnvironment, setActiveEnvironment] = useState<'dev' | 'dev-ai'>('dev');

  // Fetch balances when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();
    } else {
      // Reset balances when disconnected
      setEthBalance(null);
      setQuarkBalance(null);
      setLitBalance(null);
    }
  }, [isConnected, address, networkName]);

  const fetchBalances = async () => {
    if (!isConnected || !address) return;
    
    setIsLoadingBalances(true);
    
    try {
      // Fetch ETH balance from current provider
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum);
        const balance = await provider.getBalance(address);
        setEthBalance(ethers.formatEther(balance));
      }
      
      // Simulate QuarkChain balance fetch
      // In a real implementation, you would connect to the QuarkChain RPC
      setTimeout(() => {
        setQuarkBalance('10.5');
      }, 1000);
      
      // Simulate LIT balance fetch
      setTimeout(() => {
        setLitBalance('25.75');
      }, 1500);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  const openExplorer = (network: keyof typeof NETWORKS) => {
    if (address && NETWORKS[network]) {
      window.open(`${NETWORKS[network].explorerUrl}${address}`, '_blank');
    }
  };

  const getNetworkBadge = () => {
    let color = 'bg-gray-100 text-gray-800 border-gray-200';
    let label = 'Unknown Network';
    let icon = '❓';
    
    if (networkName === 'sepolia') {
      color = 'bg-blue-100 text-blue-800 border-blue-200';
      label = 'Sepolia Testnet';
      icon = '🔵';
    } else if (networkName === 'quarkchain') {
      color = 'bg-purple-100 text-purple-800 border-purple-200';
      label = 'QuarkChain L2';
      icon = '🟣';
    }
    
    return (
      <Badge variant="outline" className={`${color} ml-2`}>
        {icon} {label}
      </Badge>
    );
  };

  // Handle environment switch
  const toggleEnvironment = () => {
    setActiveEnvironment(prev => prev === 'dev' ? 'dev-ai' : 'dev');
  };

  return (
    <div>
      {/* Environment Toggle */}
      <div className="flex items-center space-x-2 mb-2 justify-end">
        <Badge 
          variant={activeEnvironment === 'dev' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setActiveEnvironment('dev')}
        >
          dev
        </Badge>
        <Badge 
          variant={activeEnvironment === 'dev-ai' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setActiveEnvironment('dev-ai')}
        >
          dev-ai
        </Badge>
      </div>
      
      {isConnected && address ? (
        <div className="flex items-center">
          {/* Network Badge */}
          {getNetworkBadge()}
          
          {/* Wallet Dropdown */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="ml-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
              >
                <Wallet className="mr-2 h-4 w-4 text-blue-600" />
                <span className="text-blue-800">{truncateAddress(address)}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 text-blue-600" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Wallet {activeEnvironment}</DropdownMenuLabel>
              
              <div className="px-2 py-2">
                <p className="text-sm font-mono text-center mb-1 text-gray-600">
                  {truncateAddress(address, 10, 10)}
                </p>
                <div className="flex justify-center gap-2 mb-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 w-7 p-0" 
                    onClick={handleCopyAddress}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 w-7 p-0"
                    onClick={() => openExplorer('sepolia')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Balances Section */}
              <div className="p-2">
                <div className="text-sm font-medium mb-1">Balances</div>
                
                <div className="space-y-2">
                  {/* ETH Balance */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <div className="bg-blue-100 text-blue-800 h-6 w-6 rounded-full flex items-center justify-center mr-2">
                        🔵
                      </div>
                      <span>Sepolia ETH</span>
                    </div>
                    {isLoadingBalances ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      <span className="font-mono">{formatBalance(ethBalance, 4, 'ETH')}</span>
                    )}
                  </div>
                  
                  {/* QuarkChain Balance */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <div className="bg-purple-100 text-purple-800 h-6 w-6 rounded-full flex items-center justify-center mr-2">
                        🟣
                      </div>
                      <span>QuarkChain</span>
                    </div>
                    {isLoadingBalances ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      <span className="font-mono">{formatBalance(quarkBalance, 4, 'QKC')}</span>
                    )}
                  </div>
                  
                  {/* LIT Balance */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <div className="bg-amber-100 text-amber-800 h-6 w-6 rounded-full flex items-center justify-center mr-2">
                        🔥
                      </div>
                      <span>Lit Protocol</span>
                    </div>
                    {isLoadingBalances ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      <span className="font-mono">{formatBalance(litBalance, 4, 'LIT')}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Network Status */}
              <div className="px-2 py-1.5">
                <div className="flex items-center text-xs">
                  {isCorrectNetwork ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-green-700">Connected to Correct Network</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 text-orange-600 mr-1" />
                      <span className="text-orange-700">Please switch to Sepolia Testnet</span>
                    </>
                  )}
                </div>
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Disconnect Button */}
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700 cursor-pointer"
                onClick={disconnect}
              >
                <Power className="mr-2 h-4 w-4" />
                Disconnect Wallet
              </DropdownMenuItem>
              
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <Button 
          variant="default" 
          onClick={connect}
          className="bg-gradient-to-r from-blue-600 to-indigo-600"
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      )}
    </div>
  );
};

export default WalletConnection; 