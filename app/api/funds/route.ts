import { NextResponse } from 'next/server';
import { getFunds, addFund } from '@/lib/googleSheets';

export async function GET() {
  try {
    const funds = await getFunds();
    return NextResponse.json(funds);
  } catch (error: any) {
    console.error('API Error getting funds:', error?.message || error);
    return NextResponse.json({ 
      error: 'Failed to fetch funds',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = await addFund(data);
    return NextResponse.json({ id, ...data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add fund' }, { status: 500 });
  }
}

