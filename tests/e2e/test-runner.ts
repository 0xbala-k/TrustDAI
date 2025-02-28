import chalk from 'chalk';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import minimist from 'minimist';

// Test modes
type TestMode = 'live' | 'mock';

// Test result status
type TestStatus = 'pass' | 'fail' | 'skip';

// Test result interface
interface TestResult {
  name: string;
  status: TestStatus;
  duration: number;
  error?: Error;
  details?: any;
}

// Test case interface
interface TestCase {
  name: string;
  description: string;
  run: (provider: ethers.Provider, signer: ethers.Signer, mode: TestMode) => Promise<void>;
  skip?: boolean;
  only?: boolean;
}

// Test suite class
export class TestSuite {
  private tests: TestCase[] = [];
  private results: TestResult[] = [];
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private mode: TestMode = 'mock';
  private startTime: number = 0;
  private uiCallback?: (results: TestResult[]) => void;

  constructor(mode: TestMode = 'mock') {
    this.mode = mode;
  }

  /**
   * Add a test to the suite
   */
  addTest(test: TestCase): void {
    this.tests.push(test);
  }

  /**
   * Set UI callback for real-time updates
   */
  setUICallback(callback: (results: TestResult[]) => void): void {
    this.uiCallback = callback;
  }

  /**
   * Initialize blockchain connection
   */
  async initialize(): Promise<void> {
    if (this.mode === 'live') {
      // Use actual blockchain for live testing
      if (typeof window !== 'undefined' && window.ethereum) {
        // Browser environment with MetaMask
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        console.log(`Using browser provider with address: ${await this.signer.getAddress()}`);
      } else {
        // Node.js environment
        const envFile = process.env.TEST_ENV === 'env-ai' ? '.env-ai' : '.env';
        
        try {
          require('dotenv').config({ path: envFile });
          const privateKey = process.env.TEST_WALLET_PRIVATE_KEY;
          const rpcUrl = process.env.TEST_RPC_URL || 'https://sepolia.infura.io/v3/your-project-id';
          
          if (!privateKey) {
            throw new Error(`Private key not found in ${envFile}. Please add TEST_WALLET_PRIVATE_KEY to your environment file.`);
          }
          
          this.provider = new ethers.JsonRpcProvider(rpcUrl);
          this.signer = new ethers.Wallet(privateKey, this.provider);
          
          console.log(`Using JSON-RPC provider (${rpcUrl}) with address: ${await this.signer.getAddress()}`);
        } catch (error) {
          console.error(`Failed to load environment from ${envFile}:`, error);
          throw error;
        }
      }
    } else {
      // Use mock provider for testing
      console.log('Using mock provider for testing');
      this.provider = new MockProvider();
      this.signer = await this.provider.getSigner();
    }
  }

  /**
   * Run all tests in the suite
   */
  async runTests(): Promise<TestResult[]> {
    if (!this.provider || !this.signer) {
      await this.initialize();
    }

    console.log(chalk.blue.bold(`Running tests in ${this.mode} mode...\n`));
    this.startTime = Date.now();
    this.results = [];

    const testsToRun = this.tests.filter(t => !t.skip && (!this.tests.some(x => x.only) || t.only));
    
    for (const test of testsToRun) {
      await this.runTest(test);
      
      // Call UI callback if set
      if (this.uiCallback) {
        this.uiCallback([...this.results]);
      }
    }

    // Print summary
    this.printSummary();
    
    return this.results;
  }

  /**
   * Run a single test
   */
  private async runTest(test: TestCase): Promise<void> {
    console.log(chalk.cyan(`Running test: ${test.name}`));
    console.log(chalk.gray(`  ${test.description}`));
    
    const startTime = Date.now();
    
    try {
      await test.run(this.provider!, this.signer!, this.mode);
      
      const duration = Date.now() - startTime;
      console.log(chalk.green(`  ✓ Passed (${duration}ms)`));
      
      this.results.push({
        name: test.name,
        status: 'pass',
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(chalk.red(`  ✗ Failed (${duration}ms)`));
      console.log(chalk.red(`    Error: ${error.message}`));
      
      this.results.push({
        name: test.name,
        status: 'fail',
        duration,
        error
      });
    }
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.tests.filter(t => t.skip).length;
    
    console.log('\n' + chalk.blue.bold('Test Summary:'));
    console.log(chalk.green(`  Passed: ${passed}`));
    console.log(chalk.red(`  Failed: ${failed}`));
    console.log(chalk.yellow(`  Skipped: ${skipped}`));
    console.log(chalk.blue(`  Total time: ${totalDuration}ms`));
    
    if (failed > 0) {
      console.log('\n' + chalk.red.bold('Failed Tests:'));
      this.results.filter(r => r.status === 'fail').forEach(result => {
        console.log(chalk.red(`  ✗ ${result.name}: ${result.error?.message}`));
      });
    }
  }

  /**
   * Export results to JSON file
   */
  exportResults(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(
      filePath, 
      JSON.stringify({
        timestamp: new Date().toISOString(),
        mode: this.mode,
        results: this.results,
        summary: {
          total: this.tests.length,
          passed: this.results.filter(r => r.status === 'pass').length,
          failed: this.results.filter(r => r.status === 'fail').length,
          skipped: this.tests.filter(t => t.skip).length,
          duration: Date.now() - this.startTime
        }
      }, null, 2)
    );
    
    console.log(chalk.blue(`Results exported to ${filePath}`));
  }
}

// Mock provider for testing
class MockProvider extends ethers.JsonRpcProvider {
  private mockWallet: ethers.Wallet;
  
  constructor() {
    super('http://localhost:8545');
    this.mockWallet = ethers.Wallet.createRandom();
  }
  
  async getSigner(): Promise<ethers.Signer> {
    return this.mockWallet.connect(this);
  }
}

// Command-line runner
if (require.main === module) {
  const args = minimist(process.argv.slice(2));
  const mode = args.mode === 'live' ? 'live' : 'mock';
  const outputFile = args.output || 'test-results.json';
  
  const runner = new TestSuite(mode);
  
  // Import and add all test files
  const testDir = path.join(__dirname, 'tests');
  
  if (fs.existsSync(testDir)) {
    fs.readdirSync(testDir)
      .filter(file => file.endsWith('.test.js') || file.endsWith('.test.ts'))
      .forEach(file => {
        const tests = require(path.join(testDir, file)).default;
        tests.forEach(test => runner.addTest(test));
      });
  }
  
  runner.runTests().then(() => {
    if (args.export) {
      runner.exportResults(outputFile);
    }
  });
}

export default TestSuite; 