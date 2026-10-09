export type PartRequestInput = {
 buyer_name: string; buyer_phone: string; buyer_location: string; car_make: string; car_model: string;
 part_name: string; vehicle_year: number | null; engine_code: string | null; chassis_number: string | null;
 part_number: string | null; notes: string | null
}
export function validatePartRequest(value: unknown): { data?: PartRequestInput; error?: string } {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'Please complete the request form.' }
 const v = value as Record<string, unknown>
 const fields = { buyer_name: [2,100], buyer_location: [2,160], car_make: [1,60], car_model: [1,80], part_name: [2,200] } as const
 const data: Record<string, unknown> = {}
 for (const [key, limits] of Object.entries(fields)) {
  const text = typeof v[key] === 'string' ? (v[key] as string).trim() : ''
  if (text.length < limits[0] || text.length > limits[1]) return { error: 'Please check your name, location, vehicle and required part.' }
  data[key] = text
 }
 let phone = typeof v.buyer_phone === 'string' ? v.buyer_phone.replace(/[\s()-]/g, '') : ''
 if (/^0[79]\d{8}$/.test(phone)) phone = '+260' + phone.slice(1)
 if (/^260[79]\d{8}$/.test(phone)) phone = '+' + phone
 if (!/^\+260[79]\d{8}$/.test(phone)) return { error: 'Enter a Zambian mobile number, for example 0971234567.' }
 data.buyer_phone = phone
 for (const [key, max] of Object.entries({engine_code:80,chassis_number:80,part_number:100,notes:1500})) {
  if (v[key] != null && typeof v[key] !== 'string') return { error: 'Please check the optional details.' }
  const text = typeof v[key] === 'string' ? (v[key] as string).trim() : ''
  if (text.length > max) return { error: 'Some optional details are too long.' }
  data[key] = text || null
 }
 const year = v.vehicle_year === '' || v.vehicle_year == null ? null : Number(v.vehicle_year)
 if (year !== null && (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear()+1)) return { error: 'Enter a valid vehicle year or leave it blank.' }
 data.vehicle_year = year
 return { data: data as PartRequestInput }
}
