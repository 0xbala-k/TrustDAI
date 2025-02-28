import React, { useState, useEffect, createContext, useContext } from 'react';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

// Define feature flags interface
interface FeatureFlags {
  litProtocol: boolean;
}

// Create context for feature flags
interface FeatureFlagsContextType {
  features: FeatureFlags;
  toggleFeature: (feature: keyof FeatureFlags) => void;
}

const defaultFeatures: FeatureFlags = {
  litProtocol: false
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  features: defaultFeatures,
  toggleFeature: () => {}
});

// Feature flags provider component
export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureFlags>(defaultFeatures);
  
  // Load feature flags from localStorage on mount
  useEffect(() => {
    const storedFeatures = localStorage.getItem('trustdai_feature_flags');
    if (storedFeatures) {
      try {
        setFeatures(JSON.parse(storedFeatures));
      } catch (error) {
        console.error('Failed to parse stored feature flags:', error);
      }
    }
  }, []);
  
  // Save feature flags to localStorage when they change
  useEffect(() => {
    localStorage.setItem('trustdai_feature_flags', JSON.stringify(features));
  }, [features]);
  
  // Toggle a feature flag
  const toggleFeature = (feature: keyof FeatureFlags) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };
  
  return (
    <FeatureFlagsContext.Provider value={{ features, toggleFeature }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

// Hook to use feature flags
export const useFeatureFlags = () => useContext(FeatureFlagsContext);

// Feature toggle component
const FeatureToggle: React.FC = () => {
  const { features, toggleFeature } = useFeatureFlags();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Toggles</CardTitle>
        <CardDescription>
          Enable or disable experimental features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="lit-protocol-toggle" className="font-medium">
                Lit Protocol Encryption
              </Label>
              <p className="text-sm text-gray-500">
                End-to-end encryption for sensitive files using Lit Protocol
              </p>
            </div>
            <Switch
              id="lit-protocol-toggle"
              checked={features.litProtocol}
              onCheckedChange={() => toggleFeature('litProtocol')}
            />
          </div>
          
          {features.litProtocol && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                Lit Protocol encryption is enabled. Your files will be encrypted before upload and can only be decrypted by wallets with explicit access.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureToggle; 