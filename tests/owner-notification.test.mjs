import test from 'node:test'
import assert from 'node:assert/strict'
import { sendOwnerNotification } from '../src/lib/owner-notification.mjs'

const reference = '00000000-0000-4000-8000-000000000003'
const env = { ZOHO_SMTP_HOST:'smtppro.zoho.com', ZOHO_SMTP_USER:'info@zedsparehub.com', ZOHO_SMTP_PASSWORD:'synthetic-test-secret', ZOHO_SMTP_PORT:'465' }

test('missing credentials do not attempt SMTP', async () => {
 let connected = false
 const events = []
 const result = await sendOwnerNotification(reference,{env:{},createTransport:()=>{connected=true},log:e=>events.push(e)})
 assert.equal(result,'not_configured'); assert.equal(connected,false)
 assert.deepEqual(events,['part_request_notification_not_configured'])
})

test('owner alert uses encrypted SMTP and keeps customer data out of email', async () => {
 let closed=false
 const result = await sendOwnerNotification(reference,{env,log:()=>{},createTransport:config=>{
  assert.equal(config.secure,true); assert.equal(config.port,465)
  assert.equal(config.logger,false); assert.equal(config.debug,false)
  return {sendMail:async message=>{
   assert.equal(message.to,'info@zedsparehub.com')
   assert.equal(message.from.address,'info@zedsparehub.com')
   assert.match(message.text,/https:\/\/zedsparehub.com\/admin\/requests/)
   assert.match(message.text,new RegExp(reference))
   assert.equal(message.disableFileAccess,true); assert.equal(message.disableUrlAccess,true)
   assert.equal(message.attachments,undefined)
   return {accepted:['info@zedsparehub.com']}
  },close:()=>{closed=true}}
 }})
 assert.equal(result,'sent'); assert.equal(closed,true)
})

test('587 requires STARTTLS', async () => {
 await sendOwnerNotification(reference,{env:{...env,ZOHO_SMTP_PORT:'587'},log:()=>{},createTransport:config=>{
  assert.equal(config.secure,false); assert.equal(config.requireTLS,true)
  return {sendMail:async()=>({accepted:['info@zedsparehub.com']}),close:()=>{}}
 }})
})

test('SMTP errors are contained and do not leak credentials', async () => {
 const events=[]
 const result=await sendOwnerNotification(reference,{env,log:e=>events.push(e),createTransport:()=>({sendMail:async()=>{throw Error('synthetic-test-secret')},close:()=>{}})})
 assert.equal(result,'failed'); assert.deepEqual(events,['part_request_notification_failed'])
})

test('recipient rejection is treated as failure', async () => {
 const result=await sendOwnerNotification(reference,{env,log:()=>{},createTransport:()=>({sendMail:async()=>({accepted:[]}),close:()=>{}})})
 assert.equal(result,'failed')
})
