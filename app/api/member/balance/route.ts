import { NextResponse } from 'next/server';
import { getMemberBalance } from '@/lib/googleSheets';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberID = searchParams.get('memberID');
    
    if (!memberID) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    const balance = await getMemberBalance(memberID);
    return NextResponse.json({ balance });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get balance' }, { status: 500 });
  }
}

