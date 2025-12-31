import { NextResponse } from 'next/server';
import { getMembers, addMember, updateMember, deleteMember } from '@/lib/googleSheets';

export async function GET() {
  try {
    const members = await getMembers();
    // Always return array, even if empty
    return NextResponse.json(Array.isArray(members) ? members : []);
  } catch (error: any) {
    console.error('API Error getting members:', error?.message || error);
    // Return empty array instead of error to prevent 500
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = await addMember(data);
    return NextResponse.json({ id, ...data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    await updateMember(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }
    await deleteMember(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}

