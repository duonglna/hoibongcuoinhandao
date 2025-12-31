import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    // Get environment variables
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const privateKeyRaw = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Check if variables are set
    const missing = [];
    if (!clientEmail) missing.push('GOOGLE_SHEETS_CLIENT_EMAIL');
    if (!privateKeyRaw) missing.push('GOOGLE_SHEETS_PRIVATE_KEY');
    if (!spreadsheetId) missing.push('GOOGLE_SHEETS_SPREADSHEET_ID');

    if (missing.length > 0) {
      return NextResponse.json({
        error: 'Missing environment variables',
        missing,
      }, { status: 400 });
    }

    // Process private key
    let privateKey = (privateKeyRaw || '').trim();
    
    // Remove outer quotes
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // Replace escaped newlines
    privateKey = privateKey.replace(/\\\\n/g, '\n');
    privateKey = privateKey.replace(/\\n/g, '\n');

    // Validate format
    const hasBegin = privateKey.includes('BEGIN PRIVATE KEY');
    const hasEnd = privateKey.includes('END PRIVATE KEY');
    const keyLength = privateKey.length;
    const hasNewlines = privateKey.includes('\n');

    // Try to create auth
    let authError = null;
    let detailedError = null;
    try {
      // Try with JWT directly first
      const jwt = require('jsonwebtoken');
      const { JWT } = require('google-auth-library');
      
      try {
        const jwtClient = new JWT({
          email: (clientEmail || '').trim(),
          key: privateKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        
        // Try to authorize
        await jwtClient.authorize();
        
        // If successful, try to access spreadsheet
        const sheets = google.sheets({ version: 'v4', auth: jwtClient });
        await sheets.spreadsheets.get({
          spreadsheetId: spreadsheetId,
        });
        
        return NextResponse.json({
          success: true,
          message: 'Authentication successful using JWT!',
          method: 'JWT',
          details: {
            clientEmail: (clientEmail || '').substring(0, 20) + '...',
            keyLength,
            hasBegin,
            hasEnd,
            hasNewlines,
          }
        });
      } catch (jwtError: any) {
        detailedError = jwtError?.message || JSON.stringify(jwtError);
      }
      
      // Fallback to GoogleAuth
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: (clientEmail || '').trim(),
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      // Try to get access token (this will validate the key)
      const client = await auth.getClient();
      const token = await client.getAccessToken();
      
      if (token.token) {
        // Try to access the spreadsheet
        const sheets = google.sheets({ version: 'v4', auth });
        try {
          await sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId,
          });
          
          return NextResponse.json({
            success: true,
            message: 'Authentication successful!',
            details: {
              clientEmail: (clientEmail || '').substring(0, 20) + '...',
              keyLength,
              hasBegin,
              hasEnd,
              hasNewlines,
            }
          });
        } catch (sheetError: any) {
          return NextResponse.json({
            success: false,
            error: 'Authentication works but cannot access spreadsheet',
            authSuccess: true,
            sheetError: sheetError?.message || sheetError,
            details: {
              clientEmail: (clientEmail || '').substring(0, 20) + '...',
              keyLength,
              hasBegin,
              hasEnd,
              hasNewlines,
            }
          }, { status: 500 });
        }
      }
    } catch (error: any) {
      authError = error?.message || JSON.stringify(error);
      if (!detailedError) {
        detailedError = authError;
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Authentication failed',
      authError: detailedError || authError,
      possibleCauses: [
        'Private key does not match the Service Account email',
        'Service Account key has been revoked or deleted',
        'Private key was copied incorrectly (missing characters)',
        'Service Account does not have Google Sheets API enabled',
        'Wrong Service Account is being used',
      ],
      keyInfo: {
        length: keyLength,
        hasBegin,
        hasEnd,
        hasNewlines,
        firstChars: privateKey.substring(0, 50),
        lastChars: privateKey.substring(Math.max(0, privateKey.length - 50)),
      },
      suggestions: [
        !hasBegin && 'Private key is missing BEGIN PRIVATE KEY marker',
        !hasEnd && 'Private key is missing END PRIVATE KEY marker',
        !hasNewlines && 'Private key should have newlines (\\n) between lines',
        keyLength < 1000 && 'Private key seems too short (should be ~1600-1700 chars)',
        keyLength > 2000 && 'Private key seems too long (should be ~1600-1700 chars)',
      ].filter(Boolean),
    }, { status: 500 });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      message: error?.message || error,
    }, { status: 500 });
  }
}

