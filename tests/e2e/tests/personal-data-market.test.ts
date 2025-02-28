import { ethers } from 'ethers';
import { TestCase } from '../test-runner';
import assert from 'assert';

// Define personal data categories for testing
interface DataCategory {
  id: string;
  name: string;
  description: string;
  sampleData: any;
}

// Sample data categories for the personal data marketplace
const DATA_CATEGORIES: DataCategory[] = [
  {
    id: 'personal_info',
    name: 'Personal Information',
    description: 'Basic personal details like name, date of birth, etc.',
    sampleData: {
      name: 'Jane Doe',
      dateOfBirth: '1985-07-15',
      gender: 'Female',
      occupation: 'Software Engineer',
      bio: 'Passionate about decentralized technology and privacy.'
    }
  },
  {
    id: 'addresses',
    name: 'Addresses',
    description: 'Current and historical addresses',
    sampleData: {
      current: {
        street: '123 Blockchain Ave',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94107',
        country: 'USA',
        residence_type: 'Apartment',
        years_at_address: 3
      },
      previous: [
        {
          street: '456 Web3 Street',
          city: 'Boston',
          state: 'MA',
          postalCode: '02115',
          country: 'USA',
          residence_type: 'Condo',
          years_at_address: 2
        }
      ]
    }
  },
  {
    id: 'interests',
    name: 'Interests and Preferences',
    description: 'Hobbies, interests, preferences and behavioral data',
    sampleData: {
      hobbies: ['Hiking', 'Cooking', 'Reading', 'Blockchain Development'],
      preferences: {
        cuisines: ['Italian', 'Japanese', 'Mediterranean'],
        musicGenres: ['Jazz', 'Classical', 'Electronic'],
        entertainment: ['Documentaries', 'Sci-Fi', 'Podcasts']
      },
      online_behavior: {
        active_hours: ['morning', 'evening'],
        frequently_visited_sites: ['tech news', 'educational', 'finance']
      }
    }
  },
  {
    id: 'travel',
    name: 'Travel History',
    description: 'Countries visited, travel preferences and history',
    sampleData: {
      visited_countries: ['Japan', 'France', 'Brazil', 'South Africa'],
      favorite_destinations: ['Kyoto', 'Paris', 'Rio de Janeiro'],
      travel_preferences: {
        accommodation: 'Boutique hotels',
        transportation: 'Train',
        activities: ['Cultural sites', 'Local cuisine', 'Nature hikes']
      },
      recent_trips: [
        {
          destination: 'Tokyo, Japan',
          dates: '2023-03-10 to 2023-03-25',
          purpose: 'Tourism'
        }
      ]
    }
  },
  {
    id: 'purchasing_habits',
    name: 'Purchasing Habits',
    description: 'Shopping preferences, spending patterns and brand affiliations',
    sampleData: {
      preferred_shopping: {
        method: 'Online',
        payment_types: ['Cryptocurrency', 'Credit Card'],
        times: 'Evenings and weekends'
      },
      frequent_categories: ['Technology', 'Books', 'Eco-friendly products'],
      average_monthly_spend: {
        technology: '$200-300',
        entertainment: '$50-100',
        groceries: '$400-500'
      },
      brand_preferences: {
        technology: ['Apple', 'Samsung', 'Dell'],
        clothing: ['Eco-conscious brands', 'Minimalist designs']
      }
    }
  }
];

/**
 * Tests for personal data marketplace functionality
 */
const tests: TestCase[] = [
  {
    name: 'data-categories-structure',
    description: 'Validate personal data categories structure',
    run: async (provider: ethers.Provider, signer: ethers.Signer, mode: 'live' | 'mock') => {
      // This test simply validates the structure of the data categories
      for (const category of DATA_CATEGORIES) {
        // Ensure each category has the required fields
        assert(category.id, 'Category should have an ID');
        assert(category.name, 'Category should have a name');
        assert(category.description, 'Category should have a description');
        assert(category.sampleData, 'Category should have sample data');
        
        // Validate that sample data is properly formatted JSON
        assert(
          typeof category.sampleData === 'object',
          `Sample data for ${category.name} should be a valid object`
        );
        
        // Ensure we can stringify and parse the data without errors
        const serialized = JSON.stringify(category.sampleData);
        const parsed = JSON.parse(serialized);
        
        assert.deepStrictEqual(
          parsed, 
          category.sampleData,
          'Data should serialize and deserialize correctly'
        );
        
        console.log(`Validated category: ${category.name}`);
      }
    }
  },
  
  {
    name: 'data-sharing-simulation',
    description: 'Simulate personal data sharing between wallets',
    run: async (provider: ethers.Provider, signer: ethers.Signer, mode: 'live' | 'mock') => {
      // This test simulates the process of sharing personal data categories
      
      // Mock wallet addresses
      const dataOwnerAddress = await signer.getAddress();
      const dataConsumerAddress = ethers.Wallet.createRandom().address;
      
      console.log(`Data owner: ${dataOwnerAddress}`);
      console.log(`Data consumer (env-ai): ${dataConsumerAddress}`);
      
      // Select categories to share
      const sharedCategories = [
        DATA_CATEGORIES[0], // Personal info
        DATA_CATEGORIES[2]  // Interests
      ];
      
      console.log(`Sharing ${sharedCategories.length} data categories:`);
      for (const category of sharedCategories) {
        console.log(` - ${category.name}`);
      }
      
      // Set mock prices for categories
      const prices = {
        [DATA_CATEGORIES[0].id]: ethers.parseEther('0.01'), // 0.01 ETH for personal info
        [DATA_CATEGORIES[1].id]: ethers.parseEther('0.02'), // 0.02 ETH for addresses
        [DATA_CATEGORIES[2].id]: ethers.parseEther('0.015'), // 0.015 ETH for interests
        [DATA_CATEGORIES[3].id]: ethers.parseEther('0.025'), // 0.025 ETH for travel
        [DATA_CATEGORIES[4].id]: ethers.parseEther('0.03')  // 0.03 ETH for purchasing habits
      };
      
      // Calculate total price for shared categories
      const totalPrice = sharedCategories.reduce(
        (sum, category) => sum + prices[category.id],
        ethers.parseEther('0')
      );
      
      console.log(`Total price: ${ethers.formatEther(totalPrice)} ETH`);
      
      // In a real implementation, this would involve:
      // 1. Creating a smart contract transaction to transfer payment
      // 2. Using Lit Protocol to encrypt the data with access control
      // 3. Storing the data in IPFS or other storage
      // 4. Granting access to the data consumer
      
      // For this test, we just simulate the process
      const sharedData = sharedCategories.map(category => ({
        category_id: category.id,
        category_name: category.name,
        data: category.sampleData,
        price: ethers.formatEther(prices[category.id]),
        timestamp: new Date().toISOString(),
        owner: dataOwnerAddress,
        consumer: dataConsumerAddress
      }));
      
      // Store the shared data in localStorage for env-ai to access
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          'trustdai_shared_personal_data',
          JSON.stringify(sharedData)
        );
      } else {
        // In Node.js, just log the data
        console.log('Mock storing shared data for env-ai:');
        console.log(JSON.stringify(sharedData, null, 2));
      }
      
      // Verify that the correct data was shared
      assert.strictEqual(
        sharedData.length,
        sharedCategories.length,
        'Number of shared data items should match selected categories'
      );
      
      for (let i = 0; i < sharedData.length; i++) {
        assert.strictEqual(
          sharedData[i].category_id,
          sharedCategories[i].id,
          'Category ID should match'
        );
        
        assert.deepStrictEqual(
          sharedData[i].data,
          sharedCategories[i].sampleData,
          'Shared data should match sample data'
        );
      }
      
      console.log('Data sharing simulation completed successfully');
    }
  },
  
  {
    name: 'elizaos-rag-integration',
    description: 'Test ElizaOS RAG integration with personal data',
    run: async (provider: ethers.Provider, signer: ethers.Signer, mode: 'live' | 'mock') => {
      // This test simulates the integration with ElizaOS RAG
      
      // In a real implementation, this would involve:
      // 1. Retrieving the shared data from storage
      // 2. Processing it for use with RAG
      // 3. Sending it to ElizaOS
      // 4. Retrieving a response
      
      // For this test, we just simulate the process
      console.log('Simulating ElizaOS RAG integration');
      
      // Define a simple function to mimic ElizaOS RAG
      const mockElizaOsRag = (data: any[]): string => {
        // Count the number of data categories
        const categoryCount = data.length;
        
        // Extract category names
        const categoryNames = data.map(item => item.category_name).join(', ');
        
        // Check if interests category is included
        const hasInterests = data.some(item => item.category_id === 'interests');
        
        // Generate a mock response based on the data
        if (hasInterests) {
          const interests = data.find(item => item.category_id === 'interests')?.data?.hobbies || [];
          return `Based on your ${categoryCount} shared data categories (${categoryNames}), I see you're interested in ${interests.join(', ')}. I can provide personalized recommendations based on these interests.`;
        } else {
          return `Thank you for sharing ${categoryCount} data categories (${categoryNames}). I can provide insights based on this information. Consider sharing your interests for more personalized recommendations.`;
        }
      };
      
      // Retrieve the mock shared data
      let sharedData;
      
      if (typeof localStorage !== 'undefined') {
        const storedData = localStorage.getItem('trustdai_shared_personal_data');
        sharedData = storedData ? JSON.parse(storedData) : [];
      } else {
        // In Node.js, create mock data
        sharedData = [
          {
            category_id: 'personal_info',
            category_name: 'Personal Information',
            data: DATA_CATEGORIES[0].sampleData
          },
          {
            category_id: 'interests',
            category_name: 'Interests and Preferences',
            data: DATA_CATEGORIES[2].sampleData
          }
        ];
      }
      
      // Process the data with mock ElizaOS RAG
      const elizaResponse = mockElizaOsRag(sharedData);
      
      console.log('ElizaOS RAG response:');
      console.log(elizaResponse);
      
      // Verify the response
      assert(
        elizaResponse.includes('shared data categories'),
        'ElizaOS response should acknowledge the shared data'
      );
      
      if (sharedData.some(item => item.category_id === 'interests')) {
        assert(
          elizaResponse.includes('interested in'),
          'ElizaOS response should reference interests if they were shared'
        );
      }
      
      console.log('ElizaOS RAG integration test completed successfully');
    }
  }
];

export default tests; 