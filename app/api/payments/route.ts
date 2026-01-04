import { NextResponse } from 'next/server';
import { getPayments } from '@/lib/googleSheets';

export async function GET() {
  try {
    const payments = await getPayments();
    console.log('API /api/payments - Total payments:', payments.length);
    if (payments.length > 0) {
      console.log('API /api/payments - Sample payment:', payments[0]);
    }
    return NextResponse.json(payments);
  } catch (error) {
    console.error('API /api/payments - Error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

