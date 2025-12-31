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
    console.error('API Error initializing sheets:', error?.message || error);
    const errorMessage = error?.message || 'Failed to initialize sheets';
    return NextResponse.json({ 
      error: 'Failed to initialize sheets',
      message: errorMessage,
      // Always show details in API response for debugging
      details: errorMessage
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
    console.error('API Error initializing sheets:', error?.message || error);
    const errorMessage = error?.message || 'Failed to initialize sheets';
    return NextResponse.json({ 
      error: 'Failed to initialize sheets',
      message: errorMessage,
      // Always show details in API response for debugging
      details: errorMessage
    }, { status: 500 });
  }
}

