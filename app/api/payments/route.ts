import { NextResponse } from 'next/server';
import { getPayments } from '@/lib/googleSheets';

// Disable caching to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Add cache control headers
    const payments = await getPayments();
    console.log('API /api/payments - Total payments:', payments.length);
    if (payments.length > 0) {
      console.log('API /api/payments - Sample payment:', payments[0]);
      console.log('API /api/payments - All memberIDs:', payments.map((p: any) => p.memberID));
    }
    
    return NextResponse.json(payments, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('API /api/payments - Error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

