/**
 * Feature flag configuration
 * Controls which features are enabled in the application
 */

export const FEATURES = {
  // Enable Lit Protocol for file encryption
  LIT_PROTOCOL: false,
  
  // Enable batch operations for files
  BATCH_OPERATIONS: true,
  
  // Enable file metadata storage
  FILE_METADATA: true,
  
  // Enable network switching
  NETWORK_SWITCHING: true
};

/**
 * Helper function to check if a feature is enabled
 * @param feature - The feature to check
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}

// Load feature flags from environment if available
if (typeof window !== 'undefined') {
  try {
    const envFeatures = window.localStorage.getItem('trustdai_features');
    if (envFeatures) {
      const parsedFeatures = JSON.parse(envFeatures);
      Object.keys(parsedFeatures).forEach(key => {
        if (key in FEATURES) {
          (FEATURES as any)[key] = parsedFeatures[key];
        }
      });
    }
  } catch (error) {
    console.error('Error loading feature flags:', error);
  }
}

/**
 * Enable a feature at runtime
 * @param feature - The feature to enable
 */
export function enableFeature(feature: keyof typeof FEATURES): void {
  if (feature in FEATURES) {
    FEATURES[feature] = true;
    saveFeaturesToStorage();
  }
}

/**
 * Disable a feature at runtime
 * @param feature - The feature to disable
 */
export function disableFeature(feature: keyof typeof FEATURES): void {
  if (feature in FEATURES) {
    FEATURES[feature] = false;
    saveFeaturesToStorage();
  }
}

/**
 * Save current feature flags to local storage
 */
function saveFeaturesToStorage(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('trustdai_features', JSON.stringify(FEATURES));
  }
} 