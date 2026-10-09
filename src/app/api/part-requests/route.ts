import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validatePartRequest } from '@/lib/part-request'

export async function POST(request: Request) {
 if (Number(request.headers.get('content-length') || 0) > 12000) return NextResponse.json({error:'Request too large.'},{status:413})
 let body: Record<string, unknown>
 try {
  const text = await request.text()
  if (text.length > 12000) return NextResponse.json({error:'Request too large.'},{status:413})
  body = JSON.parse(text)
 } catch { return NextResponse.json({error:'Please submit a valid request.'},{status:400}) }
 if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({error:'Please submit a valid request.'},{status:400})
 if (body.website) return NextResponse.json({error:'Unable to submit this request.'},{status:400})
 const validation = validatePartRequest(body)
 if (!validation.data) return NextResponse.json({error:validation.error},{status:400})
 const id = body.id
 if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({error:'Please refresh the page and try again.'},{status:400})
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL
 const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 if (!url || !key) return NextResponse.json({error:'Requests are temporarily unavailable. Please contact us on WhatsApp.'},{status:503})
 const db = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
 try {
  const {error} = await db.from('part_requests').insert({id,...validation.data})
  if (error && error.code !== '23505') return NextResponse.json({error:'We could not save your request. Please try again.'},{status:503})
  return NextResponse.json({reference:id},{status:201})
 } catch { return NextResponse.json({error:'We could not save your request. Please try again.'},{status:503}) }
}
