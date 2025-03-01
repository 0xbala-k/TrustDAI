import React, { useState } from 'react';
import { BlockchainWallet } from '../../types';
import { Plus, X } from 'lucide-react';

interface BlockchainWalletFormProps {
  initialData?: BlockchainWallet;
  onSubmit: (data: BlockchainWallet) => void;
  onCancel: () => void;
}

const BlockchainWalletForm: React.FC<BlockchainWalletFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<BlockchainWallet>(
    initialData || {
      walletName: '',
      walletAddresses: [],
      notes: ''
    }
  );

  const [newBlockchain, setNewBlockchain] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddWalletAddress = () => {
    if (newBlockchain.trim() && newAddress.trim()) {
      setFormData(prev => ({
        ...prev,
        walletAddresses: [
          ...prev.walletAddresses,
          {
            blockchain: newBlockchain.trim(),
            address: newAddress.trim()
          }
        ]
      }));
      setNewBlockchain('');
      setNewAddress('');
    }
  };

  const handleRemoveWalletAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      walletAddresses: prev.walletAddresses.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const blockchainOptions = [
    'Bitcoin',
    'Ethereum',
    'Solana',
    'Cardano',
    'Polkadot',
    'Avalanche',
    'Binance Smart Chain',
    'Other'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="walletName" className="block text-sm font-medium text-gray-700">
          Wallet Name
        </label>
        <input
          type="text"
          id="walletName"
          name="walletName"
          value={formData.walletName}
          onChange={handleChange}
          required
          placeholder="My Crypto Wallet"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Wallet Addresses
        </label>
        <div className="space-y-2 mb-3">
          {formData.walletAddresses.map((item, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
              <div className="overflow-hidden">
                <div className="font-medium text-sm">{item.blockchain}</div>
                <div className="text-xs font-mono text-gray-500 truncate">{item.address}</div>
              </div>
              <button 
                type="button" 
                onClick={() => handleRemoveWalletAddress(index)}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-4">
            <select
              value={newBlockchain}
              onChange={(e) => setNewBlockchain(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select blockchain</option>
              {blockchainOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="col-span-6">
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Wallet address (0x...)"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
            />
          </div>
          <div className="col-span-2">
            <button
              type="button"
              onClick={handleAddWalletAddress}
              disabled={!newBlockchain || !newAddress}
              className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional information about this wallet"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default BlockchainWalletForm;