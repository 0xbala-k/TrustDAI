import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Loader2, Upload, Link2, FileText, Info } from 'lucide-react';
import { useFeatureFlags } from './FeatureToggle';
import { useWallet } from '../contexts/WalletContext';
import { truncateAddress, formatWeb3Link, getShareableUrl, openWeb3Link } from '../utils/formatters';
import { toast } from './ui/use-toast';

// Define the data categories
export const DATA_CATEGORIES = [
  {
    id: 'personal_info',
    name: 'Personal Information',
    description: 'Basic personal details like name, date of birth, etc.',
    icon: <Info className="h-5 w-5 text-blue-500" />,
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    fields: [
      { name: 'name', label: 'Full Name', type: 'text' },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
      { name: 'gender', label: 'Gender', type: 'text' },
      { name: 'occupation', label: 'Occupation', type: 'text' },
      { name: 'bio', label: 'Bio', type: 'textarea' }
    ],
    defaultPrice: '0.01'
  },
  {
    id: 'addresses',
    name: 'Addresses',
    description: 'Current and historical addresses',
    icon: <FileText className="h-5 w-5 text-purple-500" />,
    color: 'bg-purple-50 border-purple-200 text-purple-800',
    fields: [
      { name: 'street', label: 'Street Address', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'state', label: 'State/Province', type: 'text' },
      { name: 'postalCode', label: 'Postal Code', type: 'text' },
      { name: 'country', label: 'Country', type: 'text' }
    ],
    defaultPrice: '0.02'
  },
  {
    id: 'interests',
    name: 'Interests & Preferences',
    description: 'Hobbies, interests, preferences and behavioral data',
    icon: <FileText className="h-5 w-5 text-green-500" />,
    color: 'bg-green-50 border-green-200 text-green-800',
    fields: [
      { name: 'hobbies', label: 'Hobbies (comma separated)', type: 'text' },
      { name: 'cuisines', label: 'Favorite Cuisines', type: 'text' },
      { name: 'musicGenres', label: 'Music Genres', type: 'text' },
      { name: 'entertainment', label: 'Entertainment Preferences', type: 'text' },
      { name: 'notes', label: 'Additional Notes', type: 'textarea' }
    ],
    defaultPrice: '0.015'
  },
  {
    id: 'travel',
    name: 'Travel History',
    description: 'Countries visited, travel preferences and history',
    icon: <FileText className="h-5 w-5 text-amber-500" />,
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    fields: [
      { name: 'visitedCountries', label: 'Visited Countries', type: 'text' },
      { name: 'favoriteDestinations', label: 'Favorite Destinations', type: 'text' },
      { name: 'accommodation', label: 'Preferred Accommodation', type: 'text' },
      { name: 'transportation', label: 'Preferred Transportation', type: 'text' },
      { name: 'notes', label: 'Travel Notes', type: 'textarea' }
    ],
    defaultPrice: '0.025'
  },
  {
    id: 'purchasing_habits',
    name: 'Purchasing Habits',
    description: 'Shopping preferences, spending patterns and brand affiliations',
    icon: <FileText className="h-5 w-5 text-rose-500" />,
    color: 'bg-rose-50 border-rose-200 text-rose-800',
    fields: [
      { name: 'preferredShopping', label: 'Preferred Shopping Method', type: 'text' },
      { name: 'paymentMethods', label: 'Payment Methods', type: 'text' },
      { name: 'frequentCategories', label: 'Frequent Purchase Categories', type: 'text' },
      { name: 'brandPreferences', label: 'Brand Preferences', type: 'text' },
      { name: 'notes', label: 'Additional Notes', type: 'textarea' }
    ],
    defaultPrice: '0.03'
  }
];

// Type for form data
interface FormValues {
  [category: string]: {
    [field: string]: string;
  };
}

// Type for selected categories
interface SelectedCategory {
  id: string;
  price: string;
  enabled: boolean;
}

interface CategoryFileUploadProps {
  onUpload: (data: any, prices: Record<string, string>) => Promise<string>;
}

// Add this function to generate mock data for testing
function generateMockDataForCategory(categoryId: string): Record<string, string> {
  switch (categoryId) {
    case 'personal_info':
      return {
        name: 'Jane Smith',
        dateOfBirth: '1985-06-15',
        gender: 'Female',
        occupation: 'Software Engineer',
        bio: 'Passionate about blockchain technology and personal data privacy. Enjoys hiking and reading sci-fi novels in spare time.'
      };
    case 'addresses':
      return {
        street: '123 Blockchain Avenue',
        city: 'Decentraland',
        state: 'CA',
        postalCode: '94103',
        country: 'United States'
      };
    case 'interests':
      return {
        hobbies: 'Hiking, Reading, Blockchain Development, Photography',
        cuisines: 'Italian, Japanese, Indian',
        musicGenres: 'Electronic, Jazz, Classical',
        entertainment: 'Sci-fi movies, Historical documentaries',
        notes: 'Particularly interested in privacy-preserving technologies and their applications.'
      };
    case 'travel':
      return {
        visitedCountries: 'Japan, Spain, Australia, Canada, Italy',
        favoriteDestinations: 'Kyoto, Barcelona, Sydney',
        accommodation: 'Boutique hotels, Local homestays',
        transportation: 'Train, Shared rides',
        notes: 'Enjoys cultural immersion experiences and off-the-beaten-path destinations.'
      };
    case 'purchasing_habits':
      return {
        preferredShopping: 'Online via secure websites',
        paymentMethods: 'Cryptocurrency, Credit card',
        frequentCategories: 'Technology, Books, Outdoor gear',
        brandPreferences: 'Privacy-focused companies, Sustainable brands',
        notes: 'Values privacy, sustainability, and quality when making purchasing decisions.'
      };
    default:
      return {};
  }
}

const CategoryFileUpload: React.FC<CategoryFileUploadProps> = ({ onUpload }) => {
  const { features } = useFeatureFlags();
  const { isConnected, networkName } = useWallet();
  const [formValues, setFormValues] = useState<FormValues>({});
  const [selectedCategories, setSelectedCategories] = useState<SelectedCategory[]>(
    DATA_CATEGORIES.map(cat => ({ id: cat.id, price: cat.defaultPrice, enabled: false }))
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCid, setUploadedCid] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('categories');
  const [isOpen, setIsOpen] = useState(false);

  // Initialize form values
  React.useEffect(() => {
    const initialValues: FormValues = {};
    DATA_CATEGORIES.forEach(category => {
      initialValues[category.id] = {};
      category.fields.forEach(field => {
        initialValues[category.id][field.name] = '';
      });
    });
    setFormValues(initialValues);
  }, []);

  // Handle field value changes
  const handleFieldChange = (categoryId: string, fieldName: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [fieldName]: value
      }
    }));
  };

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, enabled: !cat.enabled } 
          : cat
      )
    );
  };

  // Update category price
  const updateCategoryPrice = (categoryId: string, price: string) => {
    setSelectedCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, price } 
          : cat
      )
    );
  };

  // Calculate total price
  const totalPrice = selectedCategories
    .filter(cat => cat.enabled)
    .reduce((sum, cat) => sum + parseFloat(cat.price || '0'), 0);

  // Handle upload
  const handleUpload = async () => {
    if (!isConnected) return;
    
    try {
      setIsUploading(true);
      
      // Filter out disabled categories and extract prices
      const enabledCategories = selectedCategories
        .filter(cat => cat.enabled)
        .reduce((acc: Record<string, any>, cat) => {
          acc[cat.id] = formValues[cat.id];
          return acc;
        }, {});
      
      const categoryPrices = selectedCategories
        .filter(cat => cat.enabled)
        .reduce((acc: Record<string, string>, cat) => {
          acc[cat.id] = cat.price;
          return acc;
        }, {});
      
      // Generate a filename based on the data being uploaded
      const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
      const fileName = `trustdai_data_${timestamp}.json`;
      setUploadedFileName(fileName);
      
      // Call the onUpload callback
      const cid = await onUpload(enabledCategories, categoryPrices);
      setUploadedCid(cid);
      setActiveTab('result');
      
    } catch (error) {
      console.error("Error uploading data:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Add a new function to handle mock data generation for testing
  const handleGenerateMockData = (categoryId: string) => {
    if (!isConnected) return;
    
    const mockData = generateMockDataForCategory(categoryId);
    
    // Update form values with mock data
    setFormValues(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        ...mockData
      }
    }));
    
    console.log(`Generated mock data for ${categoryId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-gradient-to-r from-blue-600 to-indigo-600">
          <Upload className="mr-2 h-4 w-4" />
          Share Personal Data
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Share Personal Data</DialogTitle>
          <DialogDescription>
            Select categories of personal data to share and set your price for each category.
            {features.litProtocol && (
              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-800 border-blue-200">
                Lit Protocol Encryption Enabled
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="categories">Categories & Pricing</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedCategories.some(cat => cat.enabled)}>
              Data Details
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {DATA_CATEGORIES.map(category => {
                const selectedCat = selectedCategories.find(c => c.id === category.id);
                const isSelected = selectedCat?.enabled || false;
                
                return (
                  <Card 
                    key={category.id}
                    className={`border transition-colors ${isSelected ? category.color : 'border-gray-200'}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          {category.icon}
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                        </div>
                        <Switch
                          checked={isSelected}
                          onCheckedChange={() => toggleCategory(category.id)}
                        />
                      </div>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center">
                        <Label htmlFor={`price-${category.id}`} className="mr-2">
                          Price (ETH):
                        </Label>
                        <Input
                          id={`price-${category.id}`}
                          value={selectedCat?.price || category.defaultPrice}
                          onChange={(e) => updateCategoryPrice(category.id, e.target.value)}
                          disabled={!isSelected}
                          className="w-24"
                          type="number"
                          step="0.001"
                          min="0"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <div>
                <p className="text-lg font-medium">
                  Total Price: {totalPrice.toFixed(3)} ETH
                </p>
                <p className="text-sm text-gray-500">
                  Selected Categories: {selectedCategories.filter(c => c.enabled).length}
                </p>
              </div>
              <Button
                variant="default"
                onClick={() => setActiveTab('details')}
                disabled={!selectedCategories.some(cat => cat.enabled)}
              >
                Continue to Details
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            {selectedCategories
              .filter(cat => cat.enabled)
              .map(selectedCat => {
                const category = DATA_CATEGORIES.find(c => c.id === selectedCat.id)!;
                
                return (
                  <Card key={category.id} className="mb-4">
                    <CardHeader className={`${category.color}`}>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleGenerateMockData(category.id)}
                          className="border-slate-300 bg-white/50 text-slate-800 hover:bg-white/80"
                        >
                          Generate Test Data
                        </Button>
                      </div>
                      <CardDescription className="text-gray-700">
                        Fill in your {category.name.toLowerCase()} details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.fields.map(field => (
                          <div key={field.name} className={field.type === 'textarea' ? 'col-span-2' : ''}>
                            <Label htmlFor={`${category.id}-${field.name}`} className="mb-2 block">
                              {field.label}
                            </Label>
                            {field.type === 'textarea' ? (
                              <Textarea
                                id={`${category.id}-${field.name}`}
                                value={formValues[category.id]?.[field.name] || ''}
                                onChange={(e) => handleFieldChange(category.id, field.name, e.target.value)}
                                className="w-full"
                                rows={3}
                              />
                            ) : (
                              <Input
                                id={`${category.id}-${field.name}`}
                                type={field.type}
                                value={formValues[category.id]?.[field.name] || ''}
                                onChange={(e) => handleFieldChange(category.id, field.name, e.target.value)}
                                className="w-full"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
            <DialogFooter className="flex justify-between items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setActiveTab('categories')}
              >
                Back to Categories
              </Button>
              <Button
                variant="default"
                onClick={handleUpload}
                disabled={isUploading || !isConnected}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Data
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
          
          <TabsContent value="result">
            {uploadedCid && (
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-800 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium">Data Uploaded Successfully!</h3>
                </div>
                
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 inline-block mx-auto">
                  <p className="text-sm text-gray-500 mb-2">Your data is now available at:</p>
                  <div className="flex items-center justify-center space-x-2">
                    <Link2 className="h-4 w-4 text-blue-600" />
                    <a 
                      target="_blank" 
                      rel="noopener noreferrer"
                      href={getShareableUrl(uploadedCid, uploadedFileName)}
                      className="text-blue-600 hover:underline"
                    >
                      {getShareableUrl(uploadedCid, uploadedFileName)}
                    </a>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">
                  Your data has been {features.litProtocol ? 'encrypted with LPX tokens and ' : ''}stored securely on the blockchain.
                  You can manage access to this data at any time through the TrustDAI interface.
                </p>
                
                <div className="flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                      // Reset form after closing
                      setTimeout(() => {
                        setActiveTab('categories');
                        setUploadedCid(null);
                        setSelectedCategories(
                          DATA_CATEGORIES.map(cat => ({ id: cat.id, price: cat.defaultPrice, enabled: false }))
                        );
                      }, 300);
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      // Copy web3 link to clipboard
                      navigator.clipboard.writeText(formatWeb3Link(uploadedCid, uploadedFileName));
                    }}
                  >
                    Copy Web3 Link
                  </Button>
                  <Button 
                    variant="outline" 
                    className="font-semibold" 
                    onClick={() => openWeb3Link(uploadedCid, uploadedFileName)}
                  >
                    Open Link
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryFileUpload; 