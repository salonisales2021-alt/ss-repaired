
/**
 * Biometric Authentication Service
 * 
 * NOTE: For this specific Demo/Preview environment, we prioritize a simulated experience
 * because WebAuthn (navigator.credentials) strictly requires a Secure Context (HTTPS)
 * and valid domain binding, which often fails in preview containers or local IPs.
 */

// Check if the device supports biometric authentication
export const isBiometricSupported = async (): Promise<boolean> => {
    // Always return true for the demo so the UI elements are visible and testable.
    // In production, you would check window.PublicKeyCredential
    return true;
};

// Register a new credential (Enable Biometrics)
export const registerBiometric = async (userId: string, userName: string): Promise<boolean> => {
    try {
        // Attempt Real WebAuthn first if available and secure
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
        console.warn("Real biometric registration failed/cancelled. Falling back to simulation.", err);
    }

    // Fallback Simulation for Demo
    // We use a confirm dialog to simulate the OS prompt
    return new Promise(resolve => {
        setTimeout(() => {
            const success = window.confirm(`[DEMO MODE]\n\nSimulate Biometric Registration for ${userName}?\n(Click OK to succeed)`);
            resolve(success);
        }, 500);
    });
};

// Verify user (Login with Biometrics)
export const verifyBiometric = async (): Promise<boolean> => {
    try {
        // Attempt Real WebAuthn first
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
        console.warn("Real biometric verification failed/cancelled. Falling back to simulation.", err);
        // If user explicitly cancelled the real prompt (NotAllowedError), we might not want to show the shim immediately,
        // but for this demo ensuring "it works" is priority.
    }

    // Fallback Simulation for Demo
    return new Promise(resolve => {
        setTimeout(() => {
            const success = window.confirm("[DEMO MODE]\n\nSimulate FaceID/TouchID Verification?\n(Click OK to pass)");
            resolve(success);
        }, 500);
    });
};
