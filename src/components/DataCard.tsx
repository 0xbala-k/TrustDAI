import React from 'react';
import { DataItem } from '../types';
import { Edit, Trash2, User, Home, Plane, Wallet, AtSign, Briefcase, GraduationCap } from 'lucide-react';

interface DataCardProps {
  item: DataItem;
  onEdit: () => void;
  onDelete: () => void;
}

const DataCard: React.FC<DataCardProps> = ({ item, onEdit, onDelete }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'basic-details':
        return <User className="h-5 w-5" />;
      case 'address':
        return <Home className="h-5 w-5" />;
      case 'travel-data':
        return <Plane className="h-5 w-5" />;
      case 'blockchain-wallets':
        return <Wallet className="h-5 w-5" />;
      case 'social-profiles':
        return <AtSign className="h-5 w-5" />;
      case 'employment-history':
        return <Briefcase className="h-5 w-5" />;
      case 'education-details':
        return <GraduationCap className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (item.type) {
      case 'basic-details':
        return 'Basic Details';
      case 'address':
        return 'Address';
      case 'travel-data':
        return 'Travel Data';
      case 'blockchain-wallets':
        return 'Blockchain Wallet';
      case 'social-profiles':
        return 'Social Profile';
      case 'employment-history':
        return 'Employment History';
      case 'education-details':
        return 'Education Details';
      default:
        return 'Data Item';
    }
  };

  const renderPreview = () => {
    switch (item.type) {
      case 'basic-details':
        return (
          <div>
            <p className="text-sm text-gray-600">{item.data.firstName} {item.data.lastName}</p>
            <p className="text-xs text-gray-500">{item.data.email}</p>
          </div>
        );
      case 'address':
        return (
          <div>
            <p className="text-sm text-gray-600">{item.data.street}</p>
            <p className="text-xs text-gray-500">{item.data.city}, {item.data.state} {item.data.postalCode}</p>
          </div>
        );
      case 'blockchain-wallets':
        return (
          <div>
            <p className="text-sm text-gray-600">{item.data.walletName}</p>
            <p className="text-xs text-gray-500">
              {item.data.walletAddresses && item.data.walletAddresses.length > 0 
                ? `${item.data.walletAddresses.length} address${item.data.walletAddresses.length > 1 ? 'es' : ''}`
                : 'No addresses'}
            </p>
          </div>
        );
      case 'travel-data':
        return (
          <div>
            <p className="text-sm text-gray-600">Passport: {item.data.passportNumber}</p>
            <p className="text-xs text-gray-500">Expires: {new Date(item.data.expiryDate).toLocaleDateString()}</p>
          </div>
        );
      case 'social-profiles':
        return (
          <div>
            <p className="text-sm text-gray-600">{item.data.platform}</p>
            <p className="text-xs text-gray-500">{item.data.username}</p>
          </div>
        );
      case 'employment-history':
        return (
          <div>
            <p className="text-sm text-gray-600">{item.data.position} at {item.data.company}</p>
            <p className="text-xs text-gray-500">
              {new Date(item.data.startDate).toLocaleDateString()} - 
              {item.data.isCurrent ? ' Present' : new Date(item.data.endDate).toLocaleDateString()}
            </p>
          </div>
        );
      case 'education-details':
        return (
          <div>
            <p className="text-sm text-gray-600">{item.data.degree} in {item.data.field}</p>
            <p className="text-xs text-gray-500">{item.data.institution}</p>
          </div>
        );
      default:
        return (
          <p className="text-sm text-gray-600 truncate">
            {JSON.stringify(item.data).substring(0, 50)}...
          </p>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="p-1.5 bg-blue-50 rounded-full text-blue-600 mr-2">
              {getIcon()}
            </div>
            <h3 className="font-medium text-gray-900">{getTitle()}</h3>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              aria-label="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button 
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="mb-3">
          {renderPreview()}
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
          <span className="capitalize">{item.type.replace('-', ' ')}</span>
        </div>
      </div>
    </div>
  );
};

export default DataCard;