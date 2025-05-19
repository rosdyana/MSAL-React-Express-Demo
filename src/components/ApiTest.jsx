import React, { useState } from 'react';
import { getApiToken } from '../utils/authUtils';

export const ApiTest = () => {
    const [apiResponse, setApiResponse] = useState(null);
    const [error, setError] = useState(null);

    const callApi = async () => {
        try {
            const token = await getApiToken();
            console.log("Token acquired:", token);
            
            const response = await fetch('http://localhost:3003/api/profile', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            setApiResponse(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('API call failed:', err);
        }
    };

    return (
        <div>
            <button onClick={callApi}>Call API</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {apiResponse && <pre>{JSON.stringify(apiResponse, null, 2)}</pre>}
        </div>
    );
};
