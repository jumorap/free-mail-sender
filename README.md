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

## 1. Configure the front-end enviroment

Before starting, make sure to save the **token** generated from the Strapi UI as an environment variable in your front-end application. This token will be used as the public key to encrypt the email data.

```js
// Create a string with the required format for the plugin
const mail = `{"toEmail": ["${EMAIL}"],"subject": "${SUBJECT}","mailText": "${MAIL_TEXT}"}`;
```

## 2. Encrypt the Email Data

To secure the email data, use the encryptData function. You'll need the public token generated from Strapi (public key) as the second parameter.

```js
// Import the 'crypto' module
const crypto = require("crypto");

/**
 * Encrypts the data using a public key
 * @param {String} data - Data to encrypt
 * @param {String} publicKey - Public key for encryption
 * @returns {String} - Encrypted data in base64
 */
const encryptData = (data, publicKey) => {
  publicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
  const buffer = Buffer.from(data, "utf8");
  const encryptedData = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buffer
  );
  return encryptedData.toString("base64");
};

// Use the function to encrypt the email data
const publicKey = process.env.STRAPI_PUBLIC_KEY; // Your public token from Strapi
const encryptedMail = encryptData(mail, publicKey);

console.log("Encrypted mail:", encryptedMail);
```

## 3. Send the Encrypted Email

Make a `POST` request to the plugin endpoint using the encrypted email. Here's an example using `fetch`:

```js
const sendEncryptedMail = async (encryptedMail) => {
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
    console.log("Email sent successfully");
  } else {
    console.error("Error sending the email:", await response.json());
  }
};

// Call the function with the encrypted mail
sendEncryptedMail(encryptedMail);
```

---

# Contributing
The current development is in progress, so feel free to contribute to the project.
