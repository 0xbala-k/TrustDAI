import React from 'react';
import { DataType } from '../types';
import { 
  User, 
  Home, 
  Plane, 
  Wallet, 
  AtSign, 
  Briefcase, 
  GraduationCap,
  PlusCircle
} from 'lucide-react';

interface DataTypeSelectorProps {
  onSelect: (type: DataType) => void;
}

interface DataTypeOption {
  type: DataType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const dataTypes: DataTypeOption[] = [
  {
    type: 'basic-details',
    label: 'Basic Details',
    icon: <User className="h-6 w-6" />,
    description: 'Personal information like name, email, and phone'
  },
  {
    type: 'address',
    label: 'Address',
    icon: <Home className="h-6 w-6" />,
    description: 'Your residential or mailing address'
  },
  {
    type: 'travel-data',
    label: 'Travel Data',
    icon: <Plane className="h-6 w-6" />,
    description: 'Passport, visa, and travel preferences'
  },
  {
    type: 'blockchain-wallets',
    label: 'Blockchain Wallets',
    icon: <Wallet className="h-6 w-6" />,
    description: 'Cryptocurrency wallet addresses'
  },
  {
    type: 'social-profiles',
    label: 'Social Profiles',
    icon: <AtSign className="h-6 w-6" />,
    description: 'Links to your social media accounts'
  },
  {
    type: 'employment-history',
    label: 'Employment History',
    icon: <Briefcase className="h-6 w-6" />,
    description: 'Your work experience and job history'
  },
  {
    type: 'education-details',
    label: 'Education Details',
    icon: <GraduationCap className="h-6 w-6" />,
    description: 'Schools, degrees, and certifications'
  }
];

const DataTypeSelector: React.FC<DataTypeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {dataTypes.map((dataType) => (
        <button
          key={dataType.type}
          onClick={() => onSelect(dataType.type)}
          className="flex items-start p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100 hover:border-blue-200 text-left"
        >
          <div className="flex-shrink-0 mr-4 p-2 bg-blue-50 rounded-full text-blue-600">
            {dataType.icon}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{dataType.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{dataType.description}</p>
          </div>
        </button>
      ))}
      <button
        onClick={() => {}}
        className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 hover:border-blue-300 hover:bg-gray-100 transition-colors duration-200"
      >
        <div className="text-center">
          <PlusCircle className="h-6 w-6 mx-auto text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-500">Custom Data Type</p>
        </div>
      </button>
    </div>
  );
};

export default DataTypeSelector;