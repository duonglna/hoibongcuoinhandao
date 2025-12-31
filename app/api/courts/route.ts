import { NextResponse } from 'next/server';
import { getCourts, addCourt, updateCourt, deleteCourt } from '@/lib/googleSheets';

export async function GET() {
  try {
    const courts = await getCourts();
    return NextResponse.json(courts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch courts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = await addCourt(data);
    return NextResponse.json({ id, ...data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add court' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    await updateCourt(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update court' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Court ID required' }, { status: 400 });
    }
    await deleteCourt(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete court' }, { status: 500 });
  }
}

