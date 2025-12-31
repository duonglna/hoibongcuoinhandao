import { NextResponse } from 'next/server';
import { getSchedules, addSchedule, updateSchedule, deleteSchedule } from '@/lib/googleSheets';

export async function GET() {
  try {
    const schedules = await getSchedules();
    return NextResponse.json(schedules);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = await addSchedule(data);
    return NextResponse.json({ id, ...data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add schedule' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    await updateSchedule(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 });
    }
    await deleteSchedule(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}

