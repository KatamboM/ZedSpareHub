const ownerEmail = 'info@zedsparehub.com'
const dashboardUrl = 'https://zedsparehub.com/admin/requests'

/**
 * Only request references go into email; customer details stay in the private dashboard.
 * @param {string} reference
 * @param {{env?: Record<string,string|undefined>, createTransport?: Function, log?: Function}} options
 */
export async function sendOwnerNotification(reference, options = {}) {
 const env = options.env || process.env
 const log = options.log || ((event, ...details) => console.warn(event, ...details))
 if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reference)) return 'failed'
 const host = env.ZOHO_SMTP_HOST?.trim()
 const user = env.ZOHO_SMTP_USER?.trim()
 const pass = env.ZOHO_SMTP_PASSWORD
 const port = Number(env.ZOHO_SMTP_PORT || '465')
 if (!host || !user || !pass || ![465,587].includes(port) || user.toLowerCase() !== ownerEmail) {
  log('part_request_notification_not_configured')
  return 'not_configured'
 }
 let transport
 try {
  const createTransport = options.createTransport || (await import('nodemailer')).default.createTransport
  transport = createTransport({
   host, port, secure: port === 465, requireTLS: port === 587,
   auth: {user, pass}, connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 8000,
   logger: false, debug: false,
  })
  const result = await transport.sendMail({
   from: {name:'ZedSpareHub',address:ownerEmail},
   to: ownerEmail,
   subject: 'New ZedSpareHub part request',
   messageId: '<part-request-' + reference.toLowerCase() + '@zedsparehub.com>',
   text: 'A customer has submitted a new part sourcing request.\n\nReference: ' + reference + '\n\nReview and follow up in your private owner dashboard:\n' + dashboardUrl + '\n\nSign in to view customer and vehicle details.',
   disableFileAccess: true,
   disableUrlAccess: true,
  })
  const accepted = (result.accepted || []).some(value => (typeof value === 'string' ? value : value.address)?.toLowerCase() === ownerEmail)
  if (!accepted) throw new Error('Recipient not accepted')
  log('part_request_notification_sent')
  return 'sent'
 } catch (error) {
  const allowedCodes = ['EAUTH','ECONNECTION','ETIMEDOUT','ESOCKET','EDNS','ETLS','EENVELOPE','EMESSAGE']
  const code = allowedCodes.includes(error?.code) ? error.code : 'UNKNOWN'
  const smtpStatus = Number.isInteger(error?.responseCode) ? error.responseCode : undefined
  log('part_request_notification_failed', {code, smtpStatus})
  return 'failed'
 } finally {
  try { transport?.close() } catch { /* Preserve saved-request success. */ }
 }
}
