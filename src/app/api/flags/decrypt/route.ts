import { NextRequest, NextResponse } from 'next/server'
import { decryptOverrides } from 'flags'

export async function POST(request: NextRequest) {
  try {
    const { encryptedFlags } = await request.json()
    
    if (!encryptedFlags) {
      return NextResponse.json({ error: 'No encrypted flags provided' }, { status: 400 })
    }

    const overrides = await decryptOverrides(encryptedFlags)
    
    return NextResponse.json(overrides)
  } catch (error) {
    console.error('Failed to decrypt flags:', error)
    return NextResponse.json({ error: 'Failed to decrypt flags' }, { status: 500 })
  }
}