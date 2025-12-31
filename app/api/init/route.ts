import { NextResponse } from 'next/server';
import { initializeSheets } from '@/lib/googleSheets';

export async function GET() {
  try {
    await initializeSheets();
    return NextResponse.json({ 
      success: true, 
      message: 'Sheets initialized successfully',
      sheets: ['Members', 'Courts', 'Schedules', 'Payments', 'Funds']
    });
  } catch (error: any) {
    console.error('Error initializing sheets:', error?.message || error);
    return NextResponse.json({ 
      error: 'Failed to initialize sheets',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    await initializeSheets();
    return NextResponse.json({ 
      success: true, 
      message: 'Sheets initialized successfully',
      sheets: ['Members', 'Courts', 'Schedules', 'Payments', 'Funds']
    });
  } catch (error: any) {
    console.error('Error initializing sheets:', error?.message || error);
    return NextResponse.json({ 
      error: 'Failed to initialize sheets',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

