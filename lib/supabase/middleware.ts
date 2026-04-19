import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // For now, just pass through - auth will be handled client-side
  return NextResponse.next({ request })
}
