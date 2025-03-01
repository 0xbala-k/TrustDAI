export type DataType = 
  | 'basic-details'
  | 'address'
  | 'travel-data'
  | 'blockchain-wallets'
  | 'social-profiles'
  | 'employment-history'
  | 'education-details';

export interface DataItem {
  id: string;
  type: DataType;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BasicDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface TravelData {
  passportNumber: string;
  expiryDate: string;
  visaDetails: string;
  preferredAirlines: string[];
  frequentFlyerNumbers: Record<string, string>;
}

export interface BlockchainWallet {
  walletName: string;
  walletAddresses: {
    blockchain: string;
    address: string;
  }[];
  notes: string;
}

export interface SocialProfile {
  platform: string;
  username: string;
  url: string;
  isPublic: boolean;
  notes: string;
}

export interface EmploymentHistory {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  isCurrent: boolean;
}

export interface EducationDetails {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  grade: string;
  activities: string;
  isCurrent: boolean;
}