import { msalInstance } from "../index";
import { apiRequest } from "../authConfig";

export async function getApiToken() {
    const account = msalInstance.getActiveAccount();
    if (!account) {
        throw new Error("No active account! Verify a user has been signed in and setActiveAccount has been called.");
    }

    const response = await msalInstance.acquireTokenSilent({
        ...apiRequest,
        account: account
    });

    console.log("API Token acquired:", response);
    return response.accessToken;
}
