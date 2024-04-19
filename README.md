# Strapi plugin free-mail-sender

This Strapi plugin is designed to streamline the process of sending emails through the REST API. It enables you to send emails using different providers and customize the email content to suit your specific needs.

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

# Usage

## Examples

Send an email:

Using a **POST** request to the following endpoint:

```
<URL>/free-mail-sender/send-email
```

1. With the following body:

```json
{
    "toEmail": "yourMail@provider.com",
    "subject": "Important subject",
    "mailText": "HTML content"
}
```

Or

2. With the following body (using html content):

```json
{
    "toEmail": "yourMail@provider.com",
    "subject": "Important subject",
    "mailText": "<p><b>HTML</b> content</p>"
}
```

---

## IMPORTANT
The current plugin sends mails vía SMTP. (In the future, it will support other providers), so you need to configure the SMTP settings in your setting of your email provider (Gmail, Outlook, etc).

## Limits
The usage of SMTP to send mails has a limit of 300 emails per day to 100 different recipients, but check the limits of your email provider.

---

# Configuration
The default values can be customized via the plugin config. To do it, create or edit your `plugins.js/plugins.ts` file.

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
    },
  },
});
```

The plugin configuration **requires** the email and password of the sender. You can set them in the `.env` file using the variables `EMAIL_SENDER` and `PASSWORD_SENDER` as follows:

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

# Contributing
The current development is in progress, so feel free to contribute to the project.
