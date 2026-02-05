
(function () {
    const ENCRYPTION_KEY = "AntigravityClassroomSecretKey_DO_NOT_SHARE"; // Simple static key

    // Simple XOR Cipher + Base64
    const xorEncrypt = (text, key) => {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    };

    window.Security = {
        encrypt: (dataObject) => {
            try {
                const jsonStr = JSON.stringify(dataObject);
                // 1. XOR
                const xored = xorEncrypt(jsonStr, ENCRYPTION_KEY);
                // 2. Base64 encode to make it safe for file storage/transport
                const b64 = btoa(unescape(encodeURIComponent(xored))); // Handle UTF-8

                return JSON.stringify({
                    version: 1,
                    encrypted: true,
                    payload: b64
                });
            } catch (e) {
                console.error("Encryption failed", e);
                return null;
            }
        },

        decrypt: (fileContent) => {
            try {
                // First try to parse as JSON
                let parsed;
                try {
                    parsed = JSON.parse(fileContent);
                } catch (e) {
                    // If not JSON, it might be raw legacy data? Assuming legacy is always JSON.
                    console.error("File is not valid JSON");
                    return null;
                }

                // Check if it's our encrypted format
                if (parsed.encrypted && parsed.payload) {
                    // Decrypt
                    try {
                        const xored = decodeURIComponent(escape(atob(parsed.payload))); // Base64 decode
                        const jsonStr = xorEncrypt(xored, ENCRYPTION_KEY); // XOR is symmetric
                        return JSON.parse(jsonStr);
                    } catch (e2) {
                        console.error("Decryption logic failed", e2);
                        alert("Invalid or corrupted encrypted file.");
                        return null;
                    }
                } else {
                    // Assume legacy plain JSON
                    return parsed;
                }
            } catch (e) {
                console.error("Decryption process failed", e);
                return null;
            }
        }
    };
})();
