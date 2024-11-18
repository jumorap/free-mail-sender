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
      pass: env('PASSWORD_SENDER', '')
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
Click on the image below to watch the tutorial on YouTube.
It will guide you through the process of installing and configuring the plugin
and how to test it through the REST API via Postman.

Feel free to ask any questions or suggest improvements.

[![Quick Tutorial Step by Step](https://img.youtube.com/vi/vW8Op4O-z-Y/maxresdefault.jpg)](https://www.youtube.com/watch?v=vW8Op4O-z-Y)
[Quick Tutorial Step by Step](https://www.youtube.com/watch?v=vW8Op4O-z-Y)

---

# Contributing
The current development is in progress, so feel free to contribute to the project.
