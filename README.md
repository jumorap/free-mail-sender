# Strapi plugin free-mail-sender

This Strapi plugin is designed to streamline the process of sending emails through the 
REST API. It enables you to send emails using different providers and customize the 
email content to suit your specific needs.

---

# Installation

```sh
npm i free-mail-sender
```

Or

```sh
yarn add free-mail-sender
```

Or

```sh
pnpm i free-mail-sender
```

---

# Config

To allow public use to the POST endpoint, go to:

```
<URL>/admin/settings/users-permissions/roles/2
```

Pick `Free-mail-sender` selector and check the `mailto` box option

# Usage

## Examples

Send an email:

Using a **POST** request to the following endpoint:

```
<URL>/api/free-mail-sender/send-email
```

1. With the following body to a single recipient:

```json
{
    "toEmail": "yourMail@provider.com",
    "subject": "Important subject",
    "mailText": "Simple text content"
}
```

Or

2. With the following body (using html content) to a single recipient:

```json
{
    "toEmail": "theirMail@theirProvider.com",
    "subject": "Important subject",
    "mailText": "<p><b>HTML</b> content</p>"
}
```

Or

3. To multiple recipients using an array with simple content in HTML:

```json
{
  "toEmail": [
    "theirMail@theirProvider.com",
    "theirMail2@theirProvider2.es",
    "theirMail3@theirProvider3.com.co"
  ],
  "subject": "Important subject",
  "mailText": "<p><b>HTML</b> content</p>"
}
```

Or 

4. With complex content to multiple recipients:

```json
{
  "toEmail": [
    "theirMail@theirProvider.com",
    "theirMail2@theirProvider2.es",
    "theirMail3@theirProvider3.com.co"
  ],
  "subject": "Important subject",
  "mailText": "<!DOCTYPE html><html><head><style>#myHeader {background-color: lightblue;color: black;padding: 40px;text-align: center;} </style></head><body><h2>The id Attribute</h2><p>Use CSS to style an element with the id myHeader:</p><h1 id='myHeader'>My Header</h1></body></html>"
}
```

---

## IMPORTANT
The current plugin sends mails vía SMTP. (In the future, it will support other providers), 
so you need to configure the SMTP settings in your setting of your email provider (Gmail, 
Outlook, etc).

## Limits
The usage of SMTP to send mails has a limit of 300 emails per day to 100 different 
recipients, but check the limits of your email provider.

---

# Configuration
The default values can be customized via the plugin config. To do it, create or edit your 
`plugins.js/plugins.ts` file.

## Example configuration

`config/plugins.js`

```js
module.exports = ({ env }) => ({
  'free-mail-sender': {
    config: {
      provider: 'gmail', // Check the providers list -> DEFAULT: 'outlook'
      sender: env('EMAIL_SENDER', ''),
      pass: env('PASSWORD_SENDER', ''),
      token: env("TOKEN", ''), // Token generated from Strapi UI
    },
  },
});
```

Or

`config/plugins.ts`

```ts
export default ({ env }) => ({
  'free-mail-sender': {
    config: {
      provider: 'gmail', // Check the providers list -> DEFAULT: 'outlook'
      sender: env('EMAIL_SENDER', ''),
      pass: env('PASSWORD_SENDER', ''),
      token: env("TOKEN", ''), // Token generated from Strapi UI
    },
  },
});
```

The plugin configuration **requires** the email and password of the sender. 
You can set them in the `.env` file using the variables `EMAIL_SENDER` 
and `PASSWORD_SENDER` as follows:

`.env`
```env
JWT_SECRET=...

#...
EMAIL_SENDER=yourMail@provider.com
PASSWORD_SENDER=superSecretPasswordMailHere
TOKEN=GeneratedTokenViaStrapiUI
```

## Configuration options extended
1. `provider` - 'gmail' | 'outlook' | 'yahoo' | 'zoho' | 'sendgrid' | 'mailgun' | 'yandex' | 'protonmail' | 'icloud' | 'aol' | 'zohomail' | 'gmx' -> DEFAULT: 'outlook'

### Providers list
- **Gmail**: 'gmail'
- **Outlook**: 'outlook'
- **Yahoo**: 'yahoo'
- **Zoho**: 'zoho'
- **Sendgrid**: 'sendgrid'
- **Mailgun**: 'mailgun'
- **Yandex**: 'yandex'
- **Protonmail**: 'protonmail'
- **icloud**: 'icloud'
- **aol**: 'aol'
- **Zohomail**: 'zohomail'
- **gmx**: 'gmx'

---
# Quick Tutorial Step by Step

## 1. Configure the front-end environment

Before starting, make sure to save the **token** generated from the Strapi UI as an environment variable in your front-end application. This token will be used as the public key to encrypt the email data.

## 2. Implement Hybrid Encryption Functions

Create utility functions for the hybrid encryption approach (RSA+AES), which allows you to encrypt emails of any size:

```js
// Utility functions for conversion
const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * Imports the RSA public key for encryption
 * @param {string} publicKeyBase64 - Public key encoded in base64
 * @returns {Promise<CryptoKey>} - Imported crypto key
 */
const importPublicKey = async (publicKeyBase64) => {
  try {
    const keyData = base64ToArrayBuffer(publicKeyBase64);
    
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );
    
    return publicKey;
  } catch (error) {
    console.error('Error importing public key:', error);
    throw new Error(`Failed to import public key: ${error.message}`);
  }
};

/**
 * Generates a random AES key for symmetric encryption
 * @returns {Promise<CryptoKey>} - Generated AES key
 */
const generateAESKey = async () => {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Exports the AES key to raw format
 * @param {CryptoKey} key - AES key to export
 * @returns {Promise<ArrayBuffer>} - Raw key data
 */
const exportAESKey = async (key) => {
  return await window.crypto.subtle.exportKey('raw', key);
};

/**
 * Encrypts data using AES-GCM
 * @param {string} data - Data to encrypt
 * @param {CryptoKey} aesKey - AES key for encryption
 * @returns {Promise<{encryptedData: string, iv: string}>} - Encrypted data and IV in base64
 */
const encryptWithAES = async (data, aesKey) => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Generate random IV (12 bytes for GCM)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    dataBuffer
  );
  
  return {
    encryptedData: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer)
  };
};

/**
 * Encrypts the AES key using RSA-OAEP
 * @param {ArrayBuffer} aesKeyRaw - Raw AES key data
 * @param {string} publicKeyBase64 - RSA public key encoded in base64
 * @returns {Promise<string>} - Encrypted AES key in base64
 */
const encryptAESKeyWithRSA = async (aesKeyRaw, publicKeyBase64) => {
  const publicKey = await importPublicKey(publicKeyBase64);
  
  const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP'
    },
    publicKey,
    aesKeyRaw
  );
  
  return arrayBufferToBase64(encryptedKeyBuffer);
};

/**
 * Encrypts data using hybrid encryption (RSA + AES)
 * @param {string} data - Data to encrypt
 * @param {string} publicKeyBase64 - Public key encoded in base64
 * @returns {Promise<string>} - Encrypted package in base64
 */
const encryptData = async (data, publicKeyBase64) => {
  try {
    // Generate AES key
    const aesKey = await generateAESKey();
    const aesKeyRaw = await exportAESKey(aesKey);
    
    // Encrypt data with AES
    const { encryptedData, iv } = await encryptWithAES(data, aesKey);
    
    // Encrypt AES key with RSA
    const encryptedAESKey = await encryptAESKeyWithRSA(aesKeyRaw, publicKeyBase64);
    
    // Create encrypted package
    const encryptedPackage = {
      encryptedKey: encryptedAESKey,
      encryptedData: encryptedData,
      iv: iv
    };
    
    // Convert package to base64
    return window.btoa(JSON.stringify(encryptedPackage));
    
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
};
```

## 3. Prepare the Email Data

Create the email data object with recipient(s), subject, and content:

```js
// Email configuration
const EMAIL = "recipient@example.com";
const SUBJECT = "Test Email with Hybrid Encryption";
const MAIL_TEXT = "This message uses hybrid RSA+AES encryption! Now we can send emails of any size without limitations. 🚀🔐";

// Create email data object
const mail = JSON.stringify({
  toEmail: [EMAIL],
  subject: SUBJECT,
  mailText: MAIL_TEXT
});

console.log("Email data length:", mail.length, "bytes");
```

## 4. Encrypt the Email Data

Use the hybrid encryption approach to encrypt the email data with your public key:

```js
// Your public key from Strapi
const PUBLIC_KEY = "YOUR_PUBLIC_KEY_HERE"; // Replace with your token from Strapi

// Encrypt email data using hybrid encryption
const encryptedMail = await encryptData(mail, PUBLIC_KEY);

console.log("Encrypted mail package length:", encryptedMail.length, "bytes");
```

## 5. Send the Encrypted Email

Make a `POST` request to the plugin endpoint using the encrypted email:

```js
const sendEncryptedMail = async (encryptedMail) => {
  try {
    const response = await fetch("http://<STRAPI_URL>/api/free-mail-sender/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mail: encryptedMail, // Encrypted email data
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Email sent successfully:", result);
      return result;
    } else {
      const error = await response.json();
      console.error("Error sending the email:", error);
      throw new Error(`Server error: ${error.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error("Network error:", error);
    throw new Error(`Network error: ${error.message}`);
  }
};

// Call the function with the encrypted mail
await sendEncryptedMail(encryptedMail);
```

---

# Contributing
The current development is in progress, so feel free to contribute to the project.
