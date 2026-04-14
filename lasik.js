/**
 * Google Apps Script for LASIK Survey
 * 
 * Target Sheet: https://docs.google.com/spreadsheets/d/1L4V10CDWKZ3nn5RMt39mkNA0P00nSlKUCiKWonRGSoY/edit#gid=0
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions -> Apps Script.
 * 3. Delete any existing code and paste this code.
 * 4. Replace SPREADSHEET_ID if necessary (currently extracted from your link).
 * 5. Deploy -> New Deployment -> Select 'Web App'.
 * 6. Set 'Execute As' to 'Me' and 'Who has access' to 'Anyone'.
 * 7. Copy the Web App URL and use it in your React app.
 */

const SPREADSHEET_ID = '1L4V10CDWKZ3nn5RMt39mkNA0P00nSlKUCiKWonRGSoY';
const SHEET_NAME = 'Sheet1'; 

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        'Timestamp', 
        'Name', 
        'Date', 
        'Phone No', 
        'Age', 
        '18-40 years old?', 
        'Wear Glasses/Contact Lens?', 
        'Is Power Stable?', 
        'Affecting Day to Day Activity?'
      ]);
    }

    sheet.appendRow([
      new Date(),
      data.name,
      data.date,
      data.phone,
      data.age,
      data.q1,
      data.q2,
      data.q3,
      data.q4
    ]);

    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      message: 'Data saved successfully' 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const jsonData = rows.map((row, index) => {
      let obj = { id: index + 1 };
      headers.forEach((header, i) => {
        // Normalize header names for JS
        const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
        obj[key] = row[i];
      });
      return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(jsonData)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
