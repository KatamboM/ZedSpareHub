# Owner email notifications (Zoho Mail)

A fresh part request is saved first, then the server attempts an owner email to info@zedsparehub.com. The email contains only a reference and https://zedsparehub.com/admin/requests, not customer contact/vehicle data.

## Vercel setup

Add these variables on the ZedSpareHub project under Settings > Environment Variables:

- ZOHO_SMTP_HOST: the exact outgoing SMTP hostname shown in Zoho Mail Settings > Mail Accounts > Server Configuration Details. Paid organization accounts commonly use smtppro.zoho.com; regions and plans differ.
- ZOHO_SMTP_PORT: 465 (TLS at connection) or 587 (required STARTTLS).
- ZOHO_SMTP_USER: info@zedsparehub.com
- ZOHO_SMTP_PASSWORD: a Zoho app-specific password created privately in Zoho Accounts > Security > App Passwords. Store as a server-only secret/sensitive variable. Never put it in chat, git or a NEXT_PUBLIC_ variable.

Use Production and, only for intentional tests, Preview. Redeploy after configuration. This implementation deliberately only permits the confirmed owner mailbox as sender and recipient.

Official guidance:
https://www.zoho.com/mail/help/zoho-smtp.html
https://help.zoho.com/portal/en/kb/accounts/faqs-troubleshooting/faqs/security/articles/can-i-use-a-different-password-while-signing-in-to-my-zoho-account-from-a-third-party-application

## Verification

Run npm run test:notifications. SMTP is mocked and no messages are sent.

After adding real credentials, submit one clearly marked test request in preview and confirm that the mailbox receives the alert. Retrying the same request reference must not trigger another send. Verify the saved request even if SMTP is unavailable. Then deploy with Production credentials and repeat one intentional test.

## Failure behavior

An SMTP failure or missing configuration does not cancel a saved request. Server logs contain only generic event names (part_request_notification_failed or part_request_notification_not_configured), without credentials or SMTP error payloads. Connection, greeting and socket timeouts bound SMTP waits.

This first integration attempts one notification for a newly inserted request. Duplicate request retries skip email to avoid repeated alerts. There is no automatic retry queue; a failed alert stays visible as a request in the dashboard. An SMTP acceptance is not proof of inbox delivery; check the mailbox and spam folder during activation.

Nodemailer is pinned and package-lock.json records dependency resolutions. Node.js 20+ is required.
