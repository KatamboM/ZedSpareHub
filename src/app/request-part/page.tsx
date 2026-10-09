'use client'

import { useRef, useState, type FormEvent } from 'react'
import { validatePartRequest } from '@/lib/part-request'
import styles from './request.module.css'

const fields = [
 ['buyer_name','Your name',true,100,'e.g. John Mulenga'],
 ['buyer_phone','Mobile / WhatsApp number',true,20,'e.g. 0971234567'],
 ['buyer_location','Town or delivery area',true,160,'e.g. Woodlands, Lusaka'],
 ['part_name','What part do you need?',true,200,'e.g. Front brake pads'],
 ['car_make','Vehicle make',true,60,'e.g. Toyota'],
 ['car_model','Vehicle model',true,80,'e.g. Vitz'],
 ['vehicle_year','Year (optional)',false,4,'e.g. 2012'],
 ['engine_code','Engine code (optional)',false,80,'e.g. 1NZ-FE'],
 ['part_number','Part / OEM number (optional)',false,100,'If you have it'],
 ['chassis_number','Chassis / frame number (optional)',false,80,'If you have it'],
] as const

export default function RequestPartPage() {
 const [error,setError] = useState('')
 const [loading,setLoading] = useState(false)
 const [reference,setReference] = useState('')
 const requestId = useRef('')
 const pending = useRef(false)
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  if (pending.current) return
  const body = Object.fromEntries(new FormData(event.currentTarget))
  const checked = validatePartRequest(body)
  if (!checked.data) { setError(checked.error || 'Please check your details.'); return }
  pending.current = true
  setLoading(true); setError('')
  if (!requestId.current) requestId.current = crypto.randomUUID()
  try {
   const response = await fetch('/api/part-requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...checked.data,id:requestId.current,website:body.website})})
   const result = await response.json()
   if (!response.ok) throw new Error(result.error || 'We could not save your request.')
   setReference(result.reference)
  } catch (e) { setError(e instanceof Error ? e.message : 'Connection interrupted. Please try again.') }
  finally { setLoading(false); pending.current = false }
 }
 return <main className={styles.page}>
  <a href="/search" className={styles.back}>← Browse parts</a>
  <div className={styles.heading}><p className={styles.eyebrow}>LET US HELP YOU FIND IT</p><h1>Request a part</h1><p>Can’t find what you need? Tell us about your vehicle and the part. We’ll check with our sellers and contact you with availability and pricing.</p></div>
  {reference ? <section className={styles.success} role="status">
   <h2>Request received</h2><p>Your reference is <strong>{reference}</strong>. Keep it for any follow-up.</p><p>This is a sourcing enquiry, not an order. Availability, price and delivery will be confirmed before you decide to buy.</p>
   <a className="btn btn-amber" href={'https://wa.me/260772924926?text='+encodeURIComponent('Hello ZedSpareHub, I would like to share a part photo for request '+reference)}>Share a part photo on WhatsApp</a>
   <a className={styles.back} href="/search">Continue browsing →</a>
  </section> : <div className={styles.layout}>
   <form className={styles.form} onSubmit={submit}>
    <h2>Your details and vehicle</h2><p className={styles.hint}>Fields marked * are required. Leave any unknown optional details blank.</p>
    <div className={styles.grid}>{fields.map(([name,label,required,max,placeholder])=><label key={name} htmlFor={name}>{label}{required?' *':''}<input id={name} name={name} required={required} maxLength={max} placeholder={placeholder} type={name==='buyer_phone'?'tel':'text'} inputMode={name==='vehicle_year'?'numeric':undefined} autoComplete={name==='buyer_name'?'name':name==='buyer_phone'?'tel':'off'} /></label>)}</div>
    <label htmlFor="notes">Extra details (optional)<textarea id="notes" name="notes" maxLength={1500} rows={4} placeholder="Which side, quantity needed, new or used, or anything else that would help us find it." /></label>
    <div className={styles.trap} aria-hidden="true"><label htmlFor="website">Website<input id="website" name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <p className={styles.hint}>We use your contact and vehicle details to respond to this request. No payment is required.</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <button className="btn btn-amber" type="submit" disabled={loading}>{loading?'Sending request…':'Send part request →'}</button>
   </form>
   <aside className={styles.aside}><h2>What happens next?</h2><ol><li>We review your part and vehicle details.</li><li>We check availability with our sellers.</li><li>We contact you with options, pricing and delivery details.</li></ol><p>Have a photo of the old part or its packaging? You can share it on WhatsApp after submitting.</p><p>Finding a match isn’t guaranteed. We’ll confirm compatibility before you place an order.</p></aside>
  </div>}
 </main>
}
