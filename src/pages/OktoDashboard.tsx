import { useOkto, getAccount, getPortfolio } from "@okto_web3/react-sdk";
import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
 
export function Dashboard() {
    const oktoClient = useOkto();
    const [accounts, setAccounts] = useState([]);
    const [portfolio, setPortfolio] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleGoogleLogin(credentialResponse: any) {
        try {
            setIsLoading(true);
            await oktoClient.loginUsingOAuth({
                idToken: credentialResponse.credential,
                provider: "google",
            });
        } catch (error) {
            console.error("Authentication error:", error);
        } finally {
            setIsLoading(false);
        }
    }
 
    useEffect(() => {
        async function fetchUserData() {
            // Get user's accounts/wallets
            const userAccounts = await getAccount(oktoClient);
            setAccounts(userAccounts);
 
            // Get user's portfolio
            const userPortfolio = await getPortfolio(oktoClient);
            setPortfolio(userPortfolio);
        }
 
        fetchUserData();
    }, []);
 
    return (
        <div>
            {isLoading ? (
                <div>Loading...</div>
            ) : oktoClient.userSWA ? (
                <div>
                <h2>Welcome {oktoClient.userSWA}</h2>
                <h3>Your Accounts:</h3>
                {accounts.map(account => (
                    <div key={account.caipId}>
                        <p>Network: {account.networkName}</p>
                        <p>Address: {account.address}</p>
                    </div>
                ))}
    
                <h3>Portfolio:</h3>
                <pre>{JSON.stringify(portfolio, null, 2)}</pre>
                </div>
            ) : (
                <GoogleLogin onSuccess={handleGoogleLogin} />
            )}
        </div>
    );
}