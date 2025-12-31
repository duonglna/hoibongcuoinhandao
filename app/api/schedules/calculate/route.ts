import { NextResponse } from 'next/server';
import { getSchedules, updateSchedule, addPayments } from '@/lib/googleSheets';

export async function POST(request: Request) {
  try {
    const { scheduleID, racketParticipants, waterParticipants } = await request.json();
    
    const schedules = await getSchedules();
    const schedule = schedules.find((s: any) => s.id === scheduleID);
    
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const allParticipants = schedule.participants;
    const racketParticipantsList = racketParticipants || [];
    const waterParticipantsList = waterParticipants || [];

    // Calculate shares
    const courtSharePerPerson = schedule.courtPrice / allParticipants.length;
    const racketSharePerPerson = racketParticipantsList.length > 0 
      ? schedule.racketPrice / racketParticipantsList.length 
      : 0;
    const waterSharePerPerson = waterParticipantsList.length > 0 
      ? schedule.waterPrice / waterParticipantsList.length 
      : 0;

    // Create payments
    const payments = allParticipants.map((memberID: string) => ({
      scheduleID,
      memberID,
      courtShare: courtSharePerPerson,
      racketShare: racketParticipantsList.includes(memberID) ? racketSharePerPerson : 0,
      waterShare: waterParticipantsList.includes(memberID) ? waterSharePerPerson : 0,
    }));

    await addPayments(payments);
    await updateSchedule(scheduleID, { status: 'done' });

    return NextResponse.json({ success: true, payments });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to calculate payments' }, { status: 500 });
  }
}

