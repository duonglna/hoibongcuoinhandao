import { google } from 'googleapis';

// Skip Google Sheets initialization during build time
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    (process.env.NETLIFY === 'true' && !process.env.GOOGLE_SHEETS_CLIENT_EMAIL);

let auth: any = null;
let sheets: any = null;

function getAuth() {
  if (isBuildTime) {
    // Return a mock auth during build
    return null;
  }
  
  if (!auth) {
    let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    
    if (!privateKey) {
      console.error('GOOGLE_SHEETS_PRIVATE_KEY is not set');
      return null;
    }
    
    // Handle different formats of private key
    // Remove outer quotes if present (but keep inner quotes in the key itself)
    privateKey = privateKey.trim();
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // Replace escaped newlines with actual newlines
    // Handle both \\n (double escaped) and \n (single escaped)
    privateKey = privateKey.replace(/\\\\n/g, '\n'); // First handle double escaped
    privateKey = privateKey.replace(/\\n/g, '\n');   // Then handle single escaped
    
    // If the key doesn't have actual newlines but has \n, try to split and join
    if (!privateKey.includes('\n') && privateKey.includes('\\n')) {
      privateKey = privateKey.split('\\n').join('\n');
    }
    
    // Ensure proper line breaks around BEGIN/END markers
    // Don't add extra newlines if they already exist
    if (!privateKey.match(/-----BEGIN PRIVATE KEY-----\n/)) {
      privateKey = privateKey.replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----\n');
    }
    if (!privateKey.match(/\n-----END PRIVATE KEY-----/)) {
      privateKey = privateKey.replace(/-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----');
    }
    
    // Clean up any double newlines
    privateKey = privateKey.replace(/\n\n+/g, '\n');
    
    // Ensure it starts and ends with proper markers
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      console.error('Private key format is invalid - missing BEGIN PRIVATE KEY');
      return null;
    }
    
    if (!privateKey.includes('END PRIVATE KEY')) {
      console.error('Private key format is invalid - missing END PRIVATE KEY');
      return null;
    }
    
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
      console.error('GOOGLE_SHEETS_CLIENT_EMAIL is not set');
      return null;
    }
    
    try {
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL.trim(),
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } catch (error: any) {
      console.error('Error creating Google Auth:', error?.message || error);
      return null;
    }
  }
  return auth;
}

function getSheets() {
  if (isBuildTime || !getAuth()) {
    return null;
  }
  
  if (!sheets) {
    sheets = google.sheets({ version: 'v4', auth: getAuth() });
  }
  return sheets;
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';

// Sheet names
const SHEETS = {
  MEMBERS: 'Members',
  COURTS: 'Courts',
  SCHEDULES: 'Schedules',
  PAYMENTS: 'Payments',
  FUNDS: 'Funds',
};

// Initialize sheets if they don't exist
export async function initializeSheets() {
  if (isBuildTime) {
    throw new Error('Cannot initialize sheets during build time');
  }
  
  // Validate environment variables
  if (!SPREADSHEET_ID) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not set');
  }
  
  if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
    throw new Error('GOOGLE_SHEETS_CLIENT_EMAIL is not set');
  }
  
  if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
    throw new Error('GOOGLE_SHEETS_PRIVATE_KEY is not set');
  }
  
  // Validate private key format
  let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY || '';
  privateKey = privateKey.trim();
  
  // Remove outer quotes
  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
      (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  
  // Replace escaped newlines
  privateKey = privateKey.replace(/\\\\n/g, '\n');
  privateKey = privateKey.replace(/\\n/g, '\n');
  
  if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
    throw new Error('GOOGLE_SHEETS_PRIVATE_KEY format is invalid. It should start with "-----BEGIN PRIVATE KEY-----" and end with "-----END PRIVATE KEY-----". Make sure to copy the entire private key from the Service Account JSON file.');
  }
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Failed to initialize Google Sheets client. Please check your credentials. Common issues: 1) Private key format is wrong (check newlines), 2) Service Account email is incorrect, 3) Google Sheets API is not enabled.');
  }
  
  try {
    // Check if sheets exist and create if needed
    const spreadsheet = await sheetsClient.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const existingSheets = spreadsheet.data.sheets?.map((s: any) => s.properties?.title) || [];
    
    const sheetsToCreate = Object.values(SHEETS).filter((name: string) => !existingSheets.includes(name));
    
    // Create missing sheets
    if (sheetsToCreate.length > 0) {
      console.log('Creating sheets:', sheetsToCreate);
      await sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: sheetsToCreate.map((name: string) => ({
            addSheet: {
              properties: { title: name },
            },
          })),
        },
      });
      
      // Wait a bit for sheets to be created
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Always add/update headers for all sheets (in case headers are missing)
    console.log('Adding headers to all sheets...');
    const headerUpdates = await Promise.allSettled([
      sheetsClient.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.MEMBERS}!A1:D1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['ID', 'Name', 'Phone', 'Email']],
        },
      }),
      sheetsClient.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.COURTS}!A1:F1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['ID', 'Name', 'Address', 'GoogleMapLink', 'PricePerHour', 'Active']],
        },
      }),
        sheetsClient.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEETS.SCHEDULES}!A1:K1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['ID', 'CourtID', 'Date', 'StartTime', 'Hours', 'NumberOfCourts', 'CourtPrice', 'RacketPrice', 'WaterPrice', 'Participants', 'Status']],
          },
        }),
      sheetsClient.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.PAYMENTS}!A1:F1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['ID', 'ScheduleID', 'MemberID', 'CourtShare', 'RacketShare', 'WaterShare']],
        },
      }),
      sheetsClient.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.FUNDS}!A1:C1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['ID', 'MemberID', 'Amount']],
        },
      }),
    ]);
    
    // Log any failures
    headerUpdates.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to add headers for sheet ${Object.values(SHEETS)[index]}:`, result.reason);
      }
    });
    
    console.log('Sheets initialization completed');
  } catch (error: any) {
    const errorMessage = error?.message || error?.response?.data?.error?.message || JSON.stringify(error);
    console.error('Error initializing sheets:', errorMessage);
    console.error('Error details:', {
      status: error?.response?.status,
      code: error?.code,
      message: error?.message,
      response: error?.response?.data
    });
    
    // Provide more helpful error messages
    if (error?.response?.status === 403) {
      throw new Error('Permission denied. Please ensure the Service Account has Editor access to the Google Sheet.');
    }
    if (error?.response?.status === 404) {
      throw new Error('Spreadsheet not found. Please check GOOGLE_SHEETS_SPREADSHEET_ID.');
    }
    if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to Google Sheets API. Please check your internet connection.');
    }
    
    // Re-throw với message chi tiết hơn
    throw new Error(`Failed to initialize sheets: ${errorMessage}`);
  }
}

// Members
export async function getMembers() {
  if (isBuildTime) {
    return [];
  }
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    return [];
  }
  
  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.MEMBERS}!A2:D`,
    });
    
    // Handle empty sheet (only headers, no data rows)
    if (!response.data.values || response.data.values.length === 0) {
      return [];
    }
    
    return response.data.values.map((row: any, index: number) => ({
      id: row[0] || `member_${Date.now()}_${index}`,
      name: row[1] || '',
      phone: row[2] || undefined,
      email: row[3] || undefined,
    }));
  } catch (error: any) {
    // If sheet doesn't exist (400 error), try to initialize
    if (error?.response?.status === 400 || error?.code === 400 || error?.message?.includes('Unable to parse range')) {
      console.log('Sheet may not exist, initializing...');
      try {
        await initializeSheets();
        // Wait a bit for sheets to be created
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Try again after initialization
        const response = await sheetsClient.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEETS.MEMBERS}!A2:D`,
        });
        
        // Handle empty sheet
        if (!response.data.values || response.data.values.length === 0) {
          return [];
        }
        
        return response.data.values.map((row: any, index: number) => ({
          id: row[0] || `member_${Date.now()}_${index}`,
          name: row[1] || '',
          phone: row[2] || undefined,
          email: row[3] || undefined,
        }));
      } catch (initError: any) {
        console.error('Error initializing or getting members:', initError?.message || initError);
        // Return empty array instead of throwing
        return [];
      }
    }
    console.error('Error getting members:', error?.message || error);
    // Always return empty array, never throw
    return [];
  }
}

export async function addMember(member: { name: string; phone?: string; email?: string }) {
  if (isBuildTime) {
    throw new Error('Cannot add member during build time');
  }
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    // Try to initialize first
    await initializeSheets();
    const retryClient = getSheets();
    if (!retryClient) {
      throw new Error('Google Sheets not initialized. Please check your environment variables.');
    }
    // Use retryClient
    const id = `member_${Date.now()}`;
    try {
      await retryClient.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.MEMBERS}!A:D`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[id, member.name, member.phone || '', member.email || '']],
        },
      });
      return id;
    } catch (error: any) {
      // If sheet doesn't exist, initialize and retry
      if (error?.response?.status === 400 || error?.code === 400) {
        await initializeSheets();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await retryClient.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEETS.MEMBERS}!A:D`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[id, member.name, member.phone || '', member.email || '']],
          },
        });
        return id;
      }
      throw error;
    }
  }
  
  const id = `member_${Date.now()}`;
  try {
    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.MEMBERS}!A:D`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[id, member.name, member.phone || '', member.email || '']],
      },
    });
    return id;
  } catch (error: any) {
    // If sheet doesn't exist, initialize and retry
    if (error?.response?.status === 400 || error?.code === 400) {
      await initializeSheets();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await sheetsClient.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.MEMBERS}!A:D`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[id, member.name, member.phone || '', member.email || '']],
        },
      });
      return id;
    }
    throw error;
  }
}

export async function updateMember(id: string, member: { name: string; phone?: string; email?: string }) {
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  const members = await getMembers();
  const memberIndex = members.findIndex((m: any) => m.id === id);
  if (memberIndex === -1) throw new Error('Member not found');

  const rowIndex = memberIndex + 2; // +2 because of header and 0-based index
  
  await sheetsClient.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.MEMBERS}!A${rowIndex}:D${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[id, member.name, member.phone || '', member.email || '']],
    },
  });
}

export async function deleteMember(id: string) {
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  const members = await getMembers();
  const memberIndex = members.findIndex((m: any) => m.id === id);
  if (memberIndex === -1) throw new Error('Member not found');

  const rowIndex = memberIndex + 2;
  
  await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: await getSheetId(SHEETS.MEMBERS),
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex,
          },
        },
      }],
    },
  });
}

async function getSheetId(sheetName: string): Promise<number> {
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  const spreadsheet = await sheetsClient.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const sheet = spreadsheet.data.sheets?.find((s: any) => s.properties?.title === sheetName);
  if (!sheet?.properties?.sheetId) throw new Error(`Sheet ${sheetName} not found`);
  return sheet.properties.sheetId;
}

// Courts
export async function getCourts() {
  if (isBuildTime) {
    return [];
  }
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    return [];
  }
  
  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.COURTS}!A2:F`,
    });
    return (response.data.values || []).map((row: any, index: number) => ({
      id: row[0] || `court_${Date.now()}_${index}`,
      name: row[1] || '',
      address: row[2] || '',
      googleMapLink: row[3] || '',
      pricePerHour: parseFloat(row[4] || '0'),
      active: row[5] === 'TRUE' || row[5] === 'true',
    }));
  } catch (error: any) {
    if (error?.response?.status === 400 || error?.code === 400) {
      try {
        await initializeSheets();
        const response = await sheetsClient.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEETS.COURTS}!A2:F`,
        });
        return (response.data.values || []).map((row: any, index: number) => ({
          id: row[0] || `court_${Date.now()}_${index}`,
          name: row[1] || '',
          address: row[2] || '',
          googleMapLink: row[3] || '',
          pricePerHour: parseFloat(row[4] || '0'),
          active: row[5] === 'TRUE' || row[5] === 'true',
        }));
      } catch (initError) {
        console.error('Error initializing or getting courts:', initError);
        return [];
      }
    }
    console.error('Error getting courts:', error);
    return [];
  }
}

export async function addCourt(court: {
  name: string;
  address: string;
  googleMapLink: string;
  pricePerHour: number;
}) {
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  const id = `court_${Date.now()}`;
  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.COURTS}!A:F`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[id, court.name, court.address, court.googleMapLink, court.pricePerHour, 'TRUE']],
    },
  });
  return id;
}

export async function updateCourt(id: string, court: {
  name: string;
  address: string;
  googleMapLink: string;
  pricePerHour: number;
  active?: boolean;
}) {
  const courts = await getCourts();
  const courtIndex = courts.findIndex((c: any) => c.id === id);
  if (courtIndex === -1) throw new Error('Court not found');

  const rowIndex = courtIndex + 2;
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  await sheetsClient.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.COURTS}!A${rowIndex}:F${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[id, court.name, court.address, court.googleMapLink, court.pricePerHour, court.active !== false ? 'TRUE' : 'FALSE']],
    },
  });
}

export async function deleteCourt(id: string) {
  const courts = await getCourts();
  const courtIndex = courts.findIndex((c: any) => c.id === id);
  if (courtIndex === -1) throw new Error('Court not found');

  const rowIndex = courtIndex + 2;
  const sheetId = await getSheetId(SHEETS.COURTS);
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex,
          },
        },
      }],
    },
  });
}

// Schedules
export async function getSchedules() {
  if (isBuildTime) {
    return [];
  }
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    return [];
  }
  
  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.SCHEDULES}!A2:K`,
    });
    
    console.log('getSchedules - Raw response:', {
      hasValues: !!response.data.values,
      valuesLength: response.data.values?.length || 0,
      firstRow: response.data.values?.[0],
    });
    
    const schedules = (response.data.values || []).map((row: any, index: number) => {
      // Handle both old format (without numberOfCourts) and new format (with numberOfCourts)
      // Old format: ID, CourtID, Date, StartTime, Hours, CourtPrice, RacketPrice, WaterPrice, Participants, Status (10 columns)
      // New format: ID, CourtID, Date, StartTime, Hours, NumberOfCourts, CourtPrice, RacketPrice, WaterPrice, Participants, Status (11 columns)
      
      let schedule;
      if (row.length >= 11) {
        // New format with numberOfCourts
        schedule = {
          id: row[0] || `schedule_${Date.now()}_${index}`,
          courtID: row[1] || '',
          date: row[2] || '',
          startTime: row[3] || '',
          hours: parseFloat(row[4] || '1'),
          numberOfCourts: parseFloat(row[5] || '1'),
          courtPrice: parseFloat(row[6] || '0'),
          racketPrice: parseFloat(row[7] || '0'),
          waterPrice: parseFloat(row[8] || '0'),
          participants: row[9] ? row[9].split(',').filter(Boolean) : [],
          status: row[10] || 'pending',
        };
      } else if (row.length >= 10) {
        // Old format without numberOfCourts
        schedule = {
          id: row[0] || `schedule_${Date.now()}_${index}`,
          courtID: row[1] || '',
          date: row[2] || '',
          startTime: row[3] || '',
          hours: parseFloat(row[4] || '1'),
          numberOfCourts: 1, // Default to 1 for old data
          courtPrice: parseFloat(row[5] || '0'),
          racketPrice: parseFloat(row[6] || '0'),
          waterPrice: parseFloat(row[7] || '0'),
          participants: row[8] ? row[8].split(',').filter(Boolean) : [],
          status: row[9] || 'pending',
        };
      } else {
        // Invalid row, skip
        console.warn(`getSchedules - Row ${index} has invalid length: ${row.length}`, row);
        return null;
      }
      
      console.log(`getSchedules - Parsed schedule ${index}:`, schedule);
      return schedule;
    }).filter(Boolean); // Remove null entries
    
    console.log('getSchedules - Returning schedules count:', schedules.length);
    return schedules;
  } catch (error: any) {
    if (error?.response?.status === 400 || error?.code === 400) {
      try {
        await initializeSheets();
        const response = await sheetsClient.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEETS.SCHEDULES}!A2:K`,
        });
        
        const schedules = (response.data.values || []).map((row: any, index: number) => {
          // Handle both old format (without numberOfCourts) and new format (with numberOfCourts)
          let schedule;
          if (row.length >= 11) {
            // New format with numberOfCourts
            schedule = {
              id: row[0] || `schedule_${Date.now()}_${index}`,
              courtID: row[1] || '',
              date: row[2] || '',
              startTime: row[3] || '',
              hours: parseFloat(row[4] || '1'),
              numberOfCourts: parseFloat(row[5] || '1'),
              courtPrice: parseFloat(row[6] || '0'),
              racketPrice: parseFloat(row[7] || '0'),
              waterPrice: parseFloat(row[8] || '0'),
              participants: row[9] ? row[9].split(',').filter(Boolean) : [],
              status: row[10] || 'pending',
            };
          } else if (row.length >= 10) {
            // Old format without numberOfCourts
            schedule = {
              id: row[0] || `schedule_${Date.now()}_${index}`,
              courtID: row[1] || '',
              date: row[2] || '',
              startTime: row[3] || '',
              hours: parseFloat(row[4] || '1'),
              numberOfCourts: 1, // Default to 1 for old data
              courtPrice: parseFloat(row[5] || '0'),
              racketPrice: parseFloat(row[6] || '0'),
              waterPrice: parseFloat(row[7] || '0'),
              participants: row[8] ? row[8].split(',').filter(Boolean) : [],
              status: row[9] || 'pending',
            };
          } else {
            console.warn(`getSchedules (retry) - Row ${index} has invalid length: ${row.length}`, row);
            return null;
          }
          return schedule;
        }).filter(Boolean);
        
        console.log('getSchedules (retry) - Returning schedules count:', schedules.length);
        return schedules;
      } catch (initError) {
        console.error('Error initializing or getting schedules:', initError);
        return [];
      }
    }
    console.error('Error getting schedules:', error);
    return [];
  }
}

export async function addSchedule(schedule: {
  courtID: string;
  date: string;
  startTime: string;
  hours: number;
  numberOfCourts: number;
  courtPrice: number;
  racketPrice: number;
  waterPrice: number;
  participants: string[];
}) {
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  const id = `schedule_${Date.now()}`;
  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.SCHEDULES}!A:K`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        id,
        schedule.courtID,
        schedule.date,
        schedule.startTime,
        schedule.hours,
        schedule.numberOfCourts || 1,
        schedule.courtPrice,
        schedule.racketPrice,
        schedule.waterPrice,
        schedule.participants.join(','),
        'pending',
      ]],
    },
  });
  return id;
}

export async function updateSchedule(id: string, updates: Partial<{
  courtID?: string;
  date?: string;
  startTime?: string;
  hours?: number;
  numberOfCourts?: number;
  courtPrice?: number;
  racketPrice?: number;
  waterPrice?: number;
  participants?: string[];
  status?: string;
}>) {
  const schedules = await getSchedules();
  const scheduleIndex = schedules.findIndex((s: any) => s.id === id);
  if (scheduleIndex === -1) throw new Error('Schedule not found');

  const schedule = schedules[scheduleIndex];
  const updated = { ...schedule, ...updates };
  
  const rowIndex = scheduleIndex + 2; // +2 because of header and 0-based index
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  await sheetsClient.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.SCHEDULES}!A${rowIndex}:K${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        updated.id,
        updated.courtID,
        updated.date,
        updated.startTime,
        updated.hours,
        updated.numberOfCourts || 1,
        updated.courtPrice,
        updated.racketPrice,
        updated.waterPrice,
        updated.participants.join(','),
        updated.status,
      ]],
    },
  });
}

export async function deleteSchedule(id: string) {
  const schedules = await getSchedules();
  const scheduleIndex = schedules.findIndex((s: any) => s.id === id);
  if (scheduleIndex === -1) throw new Error('Schedule not found');

  const rowIndex = scheduleIndex + 2;
  const sheetId = await getSheetId(SHEETS.SCHEDULES);
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex,
          },
        },
      }],
    },
  });
}

// Payments
export async function getPayments() {
  if (isBuildTime) {
    return [];
  }
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    return [];
  }
  
  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.PAYMENTS}!A2:F`,
    });
    return (response.data.values || []).map((row: any) => ({
      id: row[0] || '',
      scheduleID: row[1] || '',
      memberID: row[2] || '',
      courtShare: parseFloat(row[3] || '0'),
      racketShare: parseFloat(row[4] || '0'),
      waterShare: parseFloat(row[5] || '0'),
    }));
  } catch (error: any) {
    if (error?.response?.status === 400 || error?.code === 400) {
      try {
        await initializeSheets();
        const response = await sheetsClient.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEETS.PAYMENTS}!A2:F`,
        });
        return (response.data.values || []).map((row: any) => ({
          id: row[0] || '',
          scheduleID: row[1] || '',
          memberID: row[2] || '',
          courtShare: parseFloat(row[3] || '0'),
          racketShare: parseFloat(row[4] || '0'),
          waterShare: parseFloat(row[5] || '0'),
        }));
      } catch (initError) {
        console.error('Error initializing or getting payments:', initError);
        return [];
      }
    }
    console.error('Error getting payments:', error);
    return [];
  }
}

export async function addPayments(payments: Array<{
  scheduleID: string;
  memberID: string;
  courtShare: number;
  racketShare: number;
  waterShare: number;
}>) {
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  const values = payments.map(p => [
    `payment_${Date.now()}_${Math.random()}`,
    p.scheduleID,
    p.memberID,
    p.courtShare,
    p.racketShare,
    p.waterShare,
  ]);

  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.PAYMENTS}!A:F`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

// Funds
export async function getFunds() {
  if (isBuildTime) {
    return [];
  }
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    return [];
  }
  
  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.FUNDS}!A2:C`,
    });
    
    if (!response.data.values || response.data.values.length === 0) {
      return [];
    }
    
    return response.data.values.map((row: any) => ({
      id: row[0] || '',
      memberID: row[1] || '',
      amount: parseFloat(row[2] || '0'),
    }));
  } catch (error: any) {
    if (error?.response?.status === 400 || error?.code === 400) {
      try {
        await initializeSheets();
        const response = await sheetsClient.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEETS.FUNDS}!A2:C`,
        });
        return (response.data.values || []).map((row: any) => ({
          id: row[0] || '',
          memberID: row[1] || '',
          amount: parseFloat(row[2] || '0'),
        }));
      } catch (initError) {
        console.error('Error initializing or getting funds:', initError);
        return [];
      }
    }
    console.error('Error getting funds:', error);
    return [];
  }
}

export async function addFund(fund: { memberID: string; amount: number }) {
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  const id = `fund_${Date.now()}`;
  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.FUNDS}!A:C`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[id, fund.memberID, fund.amount]],
    },
  });
  return id;
}

export async function getMemberBalance(memberID: string) {
  const [funds, payments] = await Promise.all([getFunds(), getPayments()]);
  
  const totalFunds = funds
    .filter((f: any) => f.memberID === memberID)
    .reduce((sum: number, f: any) => sum + f.amount, 0);
  
  const totalPayments = payments
    .filter((p: any) => p.memberID === memberID)
    .reduce((sum: number, p: any) => sum + p.courtShare + p.racketShare + p.waterShare, 0);
  
  return totalFunds - totalPayments;
}

