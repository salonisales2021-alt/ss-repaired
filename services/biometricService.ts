
/**
 * Biometric Authentication Service
 * 
 * Uses WebAuthn (navigator.credentials). Requires Secure Context (HTTPS) and valid domain.
 */

// Check if the device supports biometric authentication
export const isBiometricSupported = async (): Promise<boolean> => {
    // In production, check for availability
    if (window.PublicKeyCredential) {
        return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return false;
};

// Register a new credential (Enable Biometrics)
export const registerBiometric = async (userId: string, userName: string): Promise<boolean> => {
    try {
        if (window.PublicKeyCredential && window.isSecureContext) {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
                challenge,
                rp: {
                    name: "Saloni Sales Portal",
                    id: window.location.hostname,
                },
                user: {
                    id: Uint8Array.from(userId, c => c.charCodeAt(0)),
                    name: userName,
                    displayName: userName,
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required",
                },
                timeout: 60000,
                attestation: "direct"
            };

            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            if (credential) return true;
        }
    } catch (err) {
        console.error("Biometric registration failed:", err);
    }
    return false;
};

// Verify user (Login with Biometrics)
export const verifyBiometric = async (): Promise<boolean> => {
    try {
        if (window.PublicKeyCredential && window.isSecureContext) {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
                challenge,
                timeout: 60000,
                userVerification: "required",
                rpId: window.location.hostname,
            };

            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });

            if (assertion) return true;
        }
    } catch (err) {
        console.error("Biometric verification failed:", err);
    }
    return false;
};