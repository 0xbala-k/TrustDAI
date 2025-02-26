
interface Window {
  ethereum: import('ethers').Eip1193Provider & {
    on(event: string, callback: (...args: any[]) => void): void;
    removeListener(event: string, callback: (...args: any[]) => void): void;
  };
}
