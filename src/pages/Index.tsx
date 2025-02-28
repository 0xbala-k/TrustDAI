import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trustDAIContract } from '@/services/TrustDAI.ts';
import { addData, getData } from '../services/helpers.ts'; // Adjust import path accordingly
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // Added CardFooter
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Wallet, Power, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

interface Profile {
  name: string;
  age: string;
}

const Index = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newProfile, setNewProfile] = useState<Profile>({ name: "", age: "" });
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  // Wallet Connection (from your working version)
  const handleConnect = async () => {
    try {
      const account = await trustDAIContract.connect();
      setAccount(account);
      await trustDAIContract.initializeContract(); // Assuming this sets up the contract
      toast({ title: "Wallet Connected", description: "Successfully connected to MetaMask" });
    } catch (error: any) {
      toast({ title: "Connection Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleDisconnect = async () => {
    await trustDAIContract.disconnect();
    setAccount(null);
    setProfiles([]);
    toast({ title: "Wallet Disconnected", description: "Successfully disconnected from MetaMask" });
  };

  // Fetch CIDs from TrustDAI
  const { data: cids, isLoading } = useQuery({
    queryKey: ["userFiles", account],
    queryFn: async () => {
      // Assuming tokenContract provides a way to call TrustDAI methods
      return (await trustDAIContract.getUserFiles()) as string[];
    },
    enabled: !!account,
  });

  // Fetch Profiles from IPFS (no decryption)
  const fetchProfiles = async (cids: string[]): Promise<Profile[]> => {
    const fetchedProfiles: Profile[] = [];
    for (const cid of cids) {
      try {
        const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
        if (!response.ok) throw new Error(`Failed to fetch CID ${cid}`);
        const profileJson = await response.text();
        const profile = JSON.parse(profileJson) as Profile;
        fetchedProfiles.push(profile);
      } catch (error: any) {
        console.error(`Failed to fetch CID ${cid}:`, error);
        toast({ title: "Profile Fetch Failed", description: `CID: ${cid}`, variant: "destructive" });
      }
    }
    return fetchedProfiles;
  };

  useEffect(() => {
    if (cids && account) {
      fetchProfiles(cids).then(setProfiles).catch((err) =>
        toast({ title: "Fetch Failed", description: err.message, variant: "destructive" })
      );
    }
  }, [cids, account]);

  // Add New Profile
  const addProfile = async () => {
    if (!newProfile.name || !newProfile.age) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    try {
      const profileJson = JSON.stringify(newProfile);
      const blob = new Blob([profileJson], { type: "application/json" });
      const formData = new FormData();
      formData.append("file", blob);
      const ipfsResponse = await fetch("https://ipfs.infura.io:5001/api/v0/add", {
        method: "POST",
        body: formData,
      });
      if (!ipfsResponse.ok) throw new Error("IPFS upload failed");
      const ipfsData = await ipfsResponse.json();
      const cid = ipfsData.Hash;

      // Use tokenContract to call addFile
      await trustDAIContract.addFile(cid);

      toast({ title: "Profile Added", description: `CID: ${cid}` });
      setNewProfile({ name: "", age: "" });
      queryClient.invalidateQueries({ queryKey: ["userFiles", account] });
    } catch (error: any) {
      toast({ title: "Failed to Add Profile", description: error.message, variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        {account && (
          <p className="text-sm text-muted-foreground font-mono">
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        )}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="glass"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          {!account ? (
            <Button variant="outline" onClick={handleConnect} className="glass">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          ) : (
            <Button variant="outline" onClick={handleDisconnect} className="glass">
              <Power className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          )}
        </div>
      </div>

      {account && (
        <>
          <Card className="glass animate-fadeIn">
            <CardHeader>
              <CardTitle>Your Profiles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              ) : profiles.length === 0 ? (
                <p className="text-muted-foreground">No profiles found.</p>
              ) : (
                profiles.map((profile, i) => (
                  <div key={i} className="border-b pb-2">
                    <p><strong>Name:</strong> {profile.name || "N/A"}</p>
                    <p><strong>Age:</strong> {profile.age || "N/A"}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass animate-fadeIn animation-delay-200">
            <CardHeader>
              <CardTitle>Add New Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  placeholder="John Doe"
                  value={newProfile.name}
                  onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                  className="glass"
                  disabled={isAdding}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Age</label>
                <Input
                  type="number"
                  placeholder="30"
                  value={newProfile.age}
                  onChange={(e) => setNewProfile({ ...newProfile, age: e.target.value })}
                  className="glass"
                  disabled={isAdding}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={addProfile}
                disabled={isAdding || !newProfile.name || !newProfile.age}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Profile"
                )}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
};

export default Index;