
/**
 * Biometric Authentication Service using WebAuthn API.
 * This allows users to use FaceID (Apple), TouchID, or Android Biometrics
 * to authenticate on supported devices.
 */

// Check if the device supports biometric authentication
export const isBiometricSupported = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) {
        return false;
    }
    // Check if the device has a platform authenticator (FaceID/TouchID/Windows Hello)
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
};

// Register a new credential (Enable Biometrics)
export const registerBiometric = async (userId: string, userName: string): Promise<boolean> => {
    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
            challenge,
            rp: {
                name: "Saloni Sales Portal",
                id: window.location.hostname, // Must match current domain
            },
            user: {
                id: Uint8Array.from(userId, c => c.charCodeAt(0)),
                name: userName,
                displayName: userName,
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
            authenticatorSelection: {
                authenticatorAttachment: "platform", // Forces usage of built-in sensor (FaceID/TouchID)
                userVerification: "required",
            },
            timeout: 60000,
            attestation: "direct"
        };

        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });

        return !!credential;
    } catch (err) {
        console.error("Biometric registration failed:", err);
        return false;
    }
};

// Verify user (Login with Biometrics)
export const verifyBiometric = async (): Promise<boolean> => {
    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
            challenge,
            timeout: 60000,
            userVerification: "required", // Forces FaceID/TouchID prompt
            rpId: window.location.hostname,
        };

        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });

        return !!assertion;
    } catch (err) {
        console.error("Biometric verification failed:", err);
        return false;
    }
};
