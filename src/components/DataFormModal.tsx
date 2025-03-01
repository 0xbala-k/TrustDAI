import React from 'react';
import { X } from 'lucide-react';
import { DataType } from '../types';
import BasicDetailsForm from './forms/BasicDetailsForm';
import AddressForm from './forms/AddressForm';
import TravelDataForm from './forms/TravelDataForm';
import BlockchainWalletForm from './forms/BlockchainWalletForm';
import SocialProfileForm from './forms/SocialProfileForm';
import EmploymentHistoryForm from './forms/EmploymentHistoryForm';
import EducationDetailsForm from './forms/EducationDetailsForm';

interface DataFormModalProps {
  type: DataType;
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const DataFormModal: React.FC<DataFormModalProps> = ({
  type,
  initialData,
  onSubmit,
  onCancel
}) => {
  const getTitle = () => {
    switch (type) {
      case 'basic-details':
        return 'Basic Details';
      case 'address':
        return 'Address Information';
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
        return 'Data Form';
    }
  };

  const renderForm = () => {
    switch (type) {
      case 'basic-details':
        return (
          <BasicDetailsForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        );
      case 'address':
        return (
          <AddressForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        );
      case 'travel-data':
        return (
          <TravelDataForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        );
      case 'blockchain-wallets':
        return (
          <BlockchainWalletForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        );
      case 'social-profiles':
        return (
          <SocialProfileForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        );
      case 'employment-history':
        return (
          <EmploymentHistoryForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        );
      case 'education-details':
        return (
          <EducationDetailsForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        );
      default:
        return (
          <div className="p-4 bg-yellow-50 rounded-md">
            <p className="text-yellow-700">Form for {type} is not implemented yet.</p>
            <div className="flex justify-end mt-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onCancel}></div>
        
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">{getTitle()}</h3>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={onCancel}
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            
            {renderForm()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataFormModal;