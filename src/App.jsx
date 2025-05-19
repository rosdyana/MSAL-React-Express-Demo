import React, { useState } from 'react';
import './styles/App.css';
import { PageLayout } from './components/PageLayout';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import Button from 'react-bootstrap/Button';
import { loginRequest, apiRequest } from './authConfig';
import { callMsGraph } from './graph';
import { ProfileData } from './components/ProfileData';
import { ApiTest } from './components/ApiTest';


/**
 * Renders information about the signed-in user or a button to retrieve data about the user
 */
const ProfileContent = () => {
    const { instance, accounts } = useMsal();
    const [graphData, setGraphData] = useState(null);
    const [apiData, setApiData] = useState(null);

    React.useEffect(() => {
        // Set the active account on component mount or when accounts change
        if (accounts.length > 0) {
            instance.setActiveAccount(accounts[0]);
        }
    }, [instance, accounts]);

    function RequestProfileData() {
        // Silently acquires an access token which is then attached to a request for MS Graph data
        instance
            .acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            })
            .then((response) => {
                callMsGraph(response.accessToken).then((response) => setGraphData(response));
            });
    }

    function GetAccessToken() {
        instance
            .acquireTokenSilent({
                ...apiRequest,
                account: accounts[0],
            })
            .then((response) => {
                setApiData(response.accessToken);
                console.log('API Token acquired:', response);
            })
            .catch((error) => {
                console.error('Error acquiring token:', error);
                // Handle token acquisition error - you might want to request interactive sign-in
                instance.acquireTokenRedirect(apiRequest);
            });
    }

    return (
        <>
            <h5 className="card-title">Welcome {accounts[0].name}</h5>
            <div className="button-container">
                {graphData ? (
                    <ProfileData graphData={graphData} />
                ) : (
                    <Button variant="secondary" onClick={RequestProfileData} className="profile-button">
                        Request Profile Information
                    </Button>
                )}
                
                <Button 
                    variant="primary" 
                    onClick={GetAccessToken} 
                    className="token-button"
                    style={{ marginTop: '10px' }}
                >
                    Get Bearer Token
                </Button>
                
                {apiData && (
                    <div className="token-container" style={{ marginTop: '10px' }}>
                        <textarea
                            readOnly
                            value={apiData}
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                marginTop: '10px',
                                padding: '8px',
                                fontFamily: 'monospace',
                                fontSize: '12px'
                            }}
                        />
                    </div>
                )}
                <ApiTest />
            </div>
        </>
    );
};

/**
 * If a user is authenticated the ProfileContent component above is rendered. Otherwise a message indicating a user is not authenticated is rendered.
 */
const MainContent = () => {
    return (
        <div className="App">
            <AuthenticatedTemplate>
                <ProfileContent />
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
                <h5 className="card-title">Please sign-in to see your profile information.</h5>
            </UnauthenticatedTemplate>
        </div>
    );
};

export default function App() {
    return (
        <PageLayout>
            <MainContent />
        </PageLayout>
    );
}
