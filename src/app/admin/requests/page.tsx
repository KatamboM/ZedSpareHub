'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './requests.module.css'

const statuses = ['New', 'Sourcing', 'Quoted', 'Closed'] as const
type Status = typeof statuses[number]
type RequestRow = {
 id: string; buyer_name: string; buyer_phone: string; buyer_location: string;
 car_make: string; car_model: string; vehicle_year: number | null; engine_code: string | null;
 chassis_number: string | null; part_name: string; part_number: string | null; notes: string | null;
 status: Status; operator_notes: string; created_at: string;
}
const fields = 'id,buyer_name,buyer_phone,buyer_location,car_make,car_model,vehicle_year,engine_code,chassis_number,part_name,part_number,notes,status,operator_notes,created_at'
const pageSize = 25

export default function RequestDashboard() {
 const [access, setAccess] = useState<'loading' | 'login' | 'denied' | 'allowed'>('loading')
 const [email, setEmail] = useState('')
 const [password, setPassword] = useState('')
 const [rows, setRows] = useState<RequestRow[]>([])
 const [selected, setSelected] = useState<RequestRow | null>(null)
 const [status, setStatus] = useState<Status>('New')
 const [notes, setNotes] = useState('')
 const [filter, setFilter] = useState('All')
 const [query, setQuery] = useState('')
 const [search, setSearch] = useState('')
 const [page, setPage] = useState(0)
 const [count, setCount] = useState(0)
 const [busy, setBusy] = useState(false)
 const [loading, setLoading] = useState(false)
 const [message, setMessage] = useState('')
 const generation = useRef(0)
 const accessGeneration = useRef(0)
 const pending = useRef(false)

 const checkAccess = useCallback(async () => {
  const ticket = ++accessGeneration.current
  ++generation.current
  setRows([]); setSelected(null); setCount(0); setLoading(false); setAccess('loading')
  const { data, error } = await supabase.auth.getUser()
  if (ticket !== accessGeneration.current) return
  if (error || !data.user) { setAccess('login'); return }
  const membership = await supabase.from('request_operators').select('user_id').eq('user_id', data.user.id).maybeSingle()
  if (ticket !== accessGeneration.current) return
  setAccess(membership.data && !membership.error ? 'allowed' : 'denied')
 }, [])

 useEffect(() => {
  void checkAccess()
  const { data } = supabase.auth.onAuthStateChange(() => { setTimeout(() => void checkAccess(), 0) })
  return () => { data.subscription.unsubscribe(); ++accessGeneration.current; ++generation.current }
 }, [checkAccess])

 const load = useCallback(async () => {
  if (access !== 'allowed') return
  const ticket = ++generation.current
  setLoading(true); setMessage('')
  let request = supabase.from('part_requests').select(fields, { count: 'exact' }).order('created_at', { ascending: false }).order('id', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1)
  if (filter !== 'All') request = request.eq('status', filter)
  if (search) {
   const term = search.replace(/[%_,().\\]/g, ' ').trim()
   if (term) request = request.or('part_name.ilike.%' + term + '%,buyer_name.ilike.%' + term + '%,car_make.ilike.%' + term + '%,car_model.ilike.%' + term + '%')
  }
  const result = await request
  if (ticket !== generation.current) return
  setLoading(false)
  if (result.error) { setRows([]); setCount(0); setMessage('Could not load requests. Try refreshing.'); return }
  setRows((result.data || []) as RequestRow[]); setCount(result.count || 0)
 }, [access, page, filter, search])
 useEffect(() => { setSelected(null); void load() }, [load])

 async function login(event: React.FormEvent) {
  event.preventDefault()
  if (pending.current) return
  pending.current = true; setBusy(true); setMessage('')
  try {
   const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
   setPassword('')
   if (error) setMessage('Unable to sign in. Check your email and password.')
   else await checkAccess()
  } catch { setMessage('Unable to sign in. Please try again.') }
  finally { pending.current = false; setBusy(false) }
 }

 async function signOut() {
  ++generation.current; ++accessGeneration.current
  setRows([]); setSelected(null); setCount(0); setAccess('loading')
  const { error } = await supabase.auth.signOut()
  if (error) { setMessage('Could not sign out. Please try again.'); await checkAccess() }
  else { setAccess('login'); setMessage('') }
 }

 async function save(event: React.FormEvent) {
  event.preventDefault()
  if (!selected || pending.current || access !== 'allowed') return
  pending.current = true; setBusy(true); setMessage('')
  const original = selected
  const ticket = generation.current
  try {
   const result = await supabase.from('part_requests').update({ status, operator_notes: notes.trim() }).eq('id', original.id).eq('status', original.status).eq('operator_notes', original.operator_notes).select(fields).maybeSingle()
   if (ticket !== generation.current) return
   if (result.error) { setMessage('Could not save. Your edits are still here; try again.'); return }
   if (!result.data) { setMessage('This request changed or your access expired. Refresh to get the latest version.'); return }
   const updated = result.data as RequestRow
   setSelected(updated); setNotes(updated.operator_notes)
   setRows(current => current.map(row => row.id === updated.id ? updated : row))
   setMessage('Changes saved.')
  } catch { if (ticket === generation.current) setMessage('Could not save. Please try again.') }
  finally { pending.current = false; setBusy(false) }
 }

 return <main className={styles.page}>
  <div className={styles.heading}><div><p className={styles.eyebrow}>PRIVATE OWNER WORKSPACE</p><h1>Part requests</h1><p>Review enquiries, source parts and keep track of follow-up.</p></div>{access === 'allowed' || access === 'denied' ? <button className="btn btn-ghost" onClick={() => void signOut()}>Sign out</button> : null}</div>
  {message ? <p role="status" className={styles.message}>{message}</p> : null}
  {access === 'loading' ? <p role="status">Checking access…</p> : access === 'login' ? <form className={styles.login} onSubmit={login}>
   <h2>Owner sign in</h2><p>Use your approved ZedSpareHub account. Seller approval does not grant access to customer sourcing requests.</p>
   <label htmlFor="owner-email">Email<input id="owner-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
   <label htmlFor="owner-password">Password<input id="owner-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
   <button className="btn btn-amber" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
   <a href="/seller/account">Create a ZedSpareHub login</a><p>Your login must be separately approved for this private workspace.</p>
  </form> : access === 'denied' ? <section className={styles.login}><h2>Owner access required</h2><p>You are signed in, but this account has not been approved to manage part requests. Contact the site owner to request access.</p></section> : <>
   <form className={styles.toolbar} onSubmit={e => { e.preventDefault(); setPage(0); setSearch(query.trim()) }}>
    <label htmlFor="request-search">Search requests<input id="request-search" placeholder="Part, customer, make or model" maxLength={100} value={query} onChange={e => setQuery(e.target.value)} /></label>
    <label htmlFor="request-filter">Status<select id="request-filter" value={filter} onChange={e => { setFilter(e.target.value); setPage(0) }}><option>All</option>{statuses.map(item => <option key={item}>{item}</option>)}</select></label>
    <button className="btn btn-amber" disabled={busy}>Search</button><button className="btn btn-ghost" type="button" disabled={busy || loading} onClick={() => { setSelected(null); void load() }}>Refresh</button>
   </form>
   <p className={styles.total}>{count} matching request{count === 1 ? '' : 's'} · Newest first</p>
   <div className={styles.layout}><section aria-label="Request list">
    {loading ? <p role="status">Loading requests…</p> : rows.length ? rows.map(row => <button disabled={busy} type="button" key={row.id} className={styles.request} aria-pressed={selected?.id === row.id} onClick={() => { setSelected(row); setStatus(row.status); setNotes(row.operator_notes); setMessage('') }}>
     <span className={styles.badge}>{row.status}</span><strong>{row.part_name}</strong><span>{row.car_make} {row.car_model} {row.vehicle_year || ''}</span><span>{row.buyer_name} · {row.buyer_location}</span><small>{new Date(row.created_at).toLocaleString('en-ZM')} · {row.id.slice(0, 8)}</small>
    </button>) : <div className={styles.empty}><h2>No matching requests</h2><p>New customer enquiries will appear here. Try another search or status filter.</p></div>}
    <div className={styles.pagination}><button className="btn btn-ghost" disabled={page === 0 || busy || loading} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page + 1}</span><button className="btn btn-ghost" disabled={(page + 1) * pageSize >= count || busy || loading} onClick={() => setPage(value => value + 1)}>Next</button></div>
   </section>
   {selected ? <form onSubmit={save} className={styles.detail}>
    <h2>{selected.part_name}</h2><p className={styles.reference}>Reference: {selected.id}</p>
    <dl><dt>Customer</dt><dd>{selected.buyer_name}</dd><dt>Phone / WhatsApp</dt><dd><a href={'tel:' + selected.buyer_phone}>{selected.buyer_phone}</a></dd><dt>Location</dt><dd>{selected.buyer_location}</dd><dt>Vehicle</dt><dd>{selected.car_make} {selected.car_model} {selected.vehicle_year || ''}</dd><dt>Engine code</dt><dd>{selected.engine_code || 'Not provided'}</dd><dt>Chassis / frame</dt><dd>{selected.chassis_number || 'Not provided'}</dd><dt>Part / OEM number</dt><dd>{selected.part_number || 'Not provided'}</dd><dt>Customer notes</dt><dd className={styles.notes}>{selected.notes || 'Not provided'}</dd></dl>
    <a className="btn btn-ghost" target="_blank" rel="noopener noreferrer" href={'https://wa.me/' + selected.buyer_phone.replace('+', '') + '?text=' + encodeURIComponent('Hello ' + selected.buyer_name + ', following up on your ZedSpareHub part request ' + selected.id + ' for ' + selected.part_name + '.')}>Open WhatsApp follow-up</a>
    <label htmlFor="sourcing-status">Request status<select id="sourcing-status" value={status} onChange={e => setStatus(e.target.value as Status)}>{statuses.map(item => <option key={item}>{item}</option>)}</select></label>
    <label htmlFor="operator-notes">Private sourcing notes<textarea id="operator-notes" rows={6} maxLength={3000} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Seller contacted, quote details, next action…" /></label>
    <p className={styles.hint}>These notes are only visible to approved operators. Saving does not send a customer message.</p>
    <button className="btn btn-amber" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
   </form> : <aside className={styles.detail}><h2>Select a request</h2><p>Choose an enquiry to view contact and fitment details, add notes or update progress.</p></aside>}
   </div>
  </>}
 </main>
}
