import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { connectWallet, disconnectWallet, setupAccountChangeListener, fetchProfiles, addProfile } from "../services/helpers.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Wallet, Power, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { z } from "zod";

interface Profile {
  name: string;
  age: string;
}

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  age: z.string().regex(/^\d+$/, "Age must be a number").transform(Number),
  fileID: z.string().min(1, "File ID is required"),
});

const Index = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newProfile, setNewProfile] = useState({ name: "", age: "", fileID: "" });
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  // Wallet Connection Handlers
  const handleConnect = async () => {
    try {
      const account = await connectWallet();
      setAccount(account);
      setNewProfile((prev) => ({ ...prev, fileID: `${account}-${Date.now()}` })); // Set default fileID
      toast({ title: "Wallet Connected", description: `Connected to ${account.slice(0, 6)}...${account.slice(-4)}` });
    } catch (error: any) {
      toast({ title: "Connection Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setAccount(null);
      setProfiles([]);
      setNewProfile({ name: "", age: "", fileID: "" });
      toast({ title: "Wallet Disconnected" });
    } catch (error: any) {
      toast({ title: "Disconnect Failed", description: error.message, variant: "destructive" });
    }
  };

  // Account Change Listener (only after connect)
  useEffect(() => {
    if (!account) return; // Only setup listener after manual connection

    const cleanup = setupAccountChangeListener((accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setNewProfile((prev) => ({ ...prev, fileID: `${accounts[0]}-${Date.now()}` }));
        queryClient.invalidateQueries({ queryKey: ["profiles"] });
        toast({
          title: "Account Changed",
          description: `Switched to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      } else {
        handleDisconnect();
      }
    });

    return cleanup;
  }, [account, queryClient, toast]);

  // Fetch Profiles
  const { data: profilesData, isLoading } = useQuery({
    queryKey: ["profiles", account],
    queryFn: fetchProfiles,
    enabled: !!account,
    retry: 0,
    retryDelay: (attempt) => attempt * 10000,
    onError: (error: any) => {
      toast({ title: "Fetch Failed", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (profilesData) setProfiles(profilesData);
  }, [profilesData]);

  // Add Profile with Editable fileID
  const handleAddProfile = async () => {
    try {
      const validatedProfile = profileSchema.parse(newProfile);
      if (!account) throw new Error("No account connected");
      setIsAdding(true);
      const fileID = await addProfile(account, validatedProfile.name, validatedProfile.age.toString());
      toast({ title: "Profile Added", description: `ID: ${fileID}` });
      setNewProfile({ name: "", age: "", fileID: `${account}-${Date.now()}` });
      queryClient.invalidateQueries({ queryKey: ["profiles", account] });
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.code === 4001 || error.message.includes("user rejected")) {
        errorMessage = "You rejected the transaction. Please approve the gas fee to add your profile.";
      }
      toast({ title: "Failed to Add Profile", description: errorMessage, variant: "destructive" });
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
          <Button variant="outline" size="icon" onClick={toggleTheme} className="glass">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["profiles", account] })}
                className="glass mb-2"
              >
                Refresh Profiles
              </Button>
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
              <div>
                <label className="text-sm font-medium mb-2 block">File ID</label>
                <Input
                  placeholder={`${account}-${Date.now()}`}
                  value={newProfile.fileID}
                  onChange={(e) => setNewProfile({ ...newProfile, fileID: e.target.value })}
                  className="glass"
                  disabled={isAdding}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleAddProfile}
                disabled={isAdding || !newProfile.name || !newProfile.age || !newProfile.fileID}
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