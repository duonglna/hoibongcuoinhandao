import { NextResponse } from 'next/server';
import { getFunds, addFund } from '@/lib/googleSheets';

export async function GET() {
  try {
    const funds = await getFunds();
    return NextResponse.json(funds);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch funds' }, { status: 500 });
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

