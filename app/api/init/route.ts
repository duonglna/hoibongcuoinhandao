import { NextResponse } from 'next/server';
import { initializeSheets } from '@/lib/googleSheets';

export async function POST() {
  try {
    await initializeSheets();
    return NextResponse.json({ success: true, message: 'Sheets initialized successfully' });
  } catch (error) {
    console.error('Error initializing sheets:', error);
    return NextResponse.json({ error: 'Failed to initialize sheets' }, { status: 500 });
  }
}

