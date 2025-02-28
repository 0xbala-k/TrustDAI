import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertCircle, 
  FileText, 
  Search, 
  Share2, 
  Link2, 
  ExternalLink,
  Copy,
  Download
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from './ui/dialog';
import { formatDate, formatWeb3Link, getShareableUrl, openWeb3Link } from '../utils/formatters';

// Mock file data for demonstration
const MOCK_FILES = [
  { 
    cid: 'QmA1B2C3D4', 
    name: 'Personal Information', 
    createdAt: new Date().toISOString(),
    accessCount: 3,
    size: 1024,
    category: 'personal_info',
    web3Link: 'trustdai://QmA1B2C3',
    owner: 'dev',
    price: '0.01 ETH'
  },
  { 
    cid: 'QmE5F6G7H8', 
    name: 'Travel History', 
    createdAt: new Date(Date.now() - 86400000).toISOString(), 
    accessCount: 1,
    size: 2048,
    category: 'travel',
    web3Link: 'trustdai://QmE5F6G7',
    owner: 'dev',
    price: '0.025 ETH'
  },
  { 
    cid: 'QmI9J0K1L2', 
    name: 'Shopping Preferences', 
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    accessCount: 0,
    size: 512,
    category: 'purchasing_habits',
    web3Link: 'trustdai://QmI9J0K1',
    owner: 'dev-ai',
    price: '0.03 ETH'
  }
];

// Type definition for file items
interface FileItem {
  cid: string;
  name: string;
  createdAt: string;
  accessCount: number;
  size: number;
  category: string;
  web3Link: string;
  owner: 'dev' | 'dev-ai';
  price: string;
}

interface FileListProps {
  environment: 'dev' | 'dev-ai';
  onShareFile?: (file: FileItem) => void;
  sharedFiles?: FileItem[];
}

export const FileList: React.FC<FileListProps> = ({ 
  environment = 'dev',
  onShareFile,
  sharedFiles = []
}) => {
  const { isConnected, address } = useWallet();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // Load files data
  useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter mock files based on the current environment
      const filteredFiles = MOCK_FILES.filter(file => file.owner === environment);
      
      // Add shared files from the other environment
      const allFiles = [
        ...filteredFiles,
        ...sharedFiles
      ];
      
      setFiles(allFiles);
      setIsLoading(false);
    };
    
    loadFiles();
  }, [environment, sharedFiles]);
  
  // Filter files based on search query
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.cid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle sharing file
  const handleShare = (file: FileItem) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
  };
  
  // Confirm file sharing
  const confirmShare = () => {
    if (selectedFile && onShareFile) {
      onShareFile(selectedFile);
      setShareDialogOpen(false);
      setSelectedFile(null);
    }
  };
  
  // Copy web3 link to clipboard
  const handleCopyWeb3Link = (link: string) => {
    navigator.clipboard.writeText(link);
  };
  
  // Get badge color based on category
  const getCategoryBadge = (category: string) => {
    switch(category) {
      case 'personal_info':
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">Personal Info</Badge>;
      case 'addresses':
        return <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">Addresses</Badge>;
      case 'interests':
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">Interests</Badge>;
      case 'travel':
        return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">Travel</Badge>;
      case 'purchasing_habits':
        return <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-200">Shopping</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };
  
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <AlertCircle className="h-5 w-5 text-orange-500 mb-2" />
          <CardTitle>Wallet Not Connected</CardTitle>
          <CardDescription>
            Please connect your wallet to view your files.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Search files..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Files Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredFiles.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Web3 Link</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map((file) => (
                <TableRow key={file.cid}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-600" />
                      <span>{file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Link2 className="h-4 w-4 text-blue-600" />
                      <span className="font-mono text-sm">{formatWeb3Link(file.cid, file.name)}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopyWeb3Link(formatWeb3Link(file.cid, file.name))}
                        title="Copy web3 link"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0"
                        onClick={() => openWeb3Link(file.cid, file.name)}
                        title="Open web3 link"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getCategoryBadge(file.category)}
                  </TableCell>
                  <TableCell>
                    {formatDate(file.createdAt)}
                  </TableCell>
                  <TableCell>
                    {file.price}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {file.owner === environment && onShareFile && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleShare(file)}
                        >
                          <Share2 className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-1">No Files Found</h3>
            <p className="text-gray-500 mb-4 text-center">
              {searchQuery 
                ? `No files matching "${searchQuery}"`
                : `Your ${environment} environment doesn't have any files yet.`}
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share {selectedFile?.name}</DialogTitle>
            <DialogDescription>
              This will securely share the file with the {environment === 'dev' ? 'dev-ai' : 'dev'} environment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-md">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">{selectedFile?.name}</p>
                <p className="text-sm font-mono text-gray-600">{selectedFile ? formatWeb3Link(selectedFile.cid, selectedFile.name) : ''}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <a 
                    href={selectedFile ? getShareableUrl(selectedFile.cid) : '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open shareable link
                  </a>
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share to {environment === 'dev' ? 'dev-ai' : 'dev'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileList; 