# Hướng dẫn Debug Lỗi 500

## Các nguyên nhân phổ biến

### 1. **Thiếu Environment Variables**

Kiểm tra trong Netlify Dashboard → Site settings → Environment variables:

```
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account-email@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
ADMIN_PASSWORD=abc123
```

**Lưu ý**: `GOOGLE_SHEETS_PRIVATE_KEY` phải có dấu ngoặc kép và giữ nguyên `\n`

### 2. **Google Sheets chưa được share với Service Account**

1. Mở Google Sheet của bạn
2. Click **"Share"** (Chia sẻ)
3. Thêm email của Service Account (từ `GOOGLE_SHEETS_CLIENT_EMAIL`)
4. Chọn quyền **"Editor"** (Chỉnh sửa)
5. Click **"Send"**

### 3. **Google Sheets API chưa được enable**

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** → **Library**
4. Tìm "Google Sheets API"
5. Click **"Enable"**

### 4. **Spreadsheet ID sai**

- Spreadsheet ID là phần giữa `/d/` và `/edit` trong URL
- Ví dụ: `https://docs.google.com/spreadsheets/d/1ABC123...XYZ/edit`
- Spreadsheet ID là: `1ABC123...XYZ`

## Cách kiểm tra lỗi

### Trên Netlify

1. Vào Netlify Dashboard → Site → **Functions logs**
2. Xem logs để tìm error message
3. Hoặc vào **Deploys** → Click vào deploy → Xem **Build logs**

### Trên Local

1. Mở terminal và chạy:
```bash
npm run dev
```

2. Mở browser console (F12)
3. Xem Network tab để tìm request bị lỗi 500
4. Click vào request → Xem Response để thấy error message

### Kiểm tra Environment Variables

Trong code, thêm logging tạm thời:

```typescript
// Trong lib/googleSheets.ts
console.log('Client Email:', process.env.GOOGLE_SHEETS_CLIENT_EMAIL ? 'Set' : 'Missing');
console.log('Private Key:', process.env.GOOGLE_SHEETS_PRIVATE_KEY ? 'Set' : 'Missing');
console.log('Spreadsheet ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID || 'Missing');
```

## Các bước khắc phục

### Bước 1: Kiểm tra Environment Variables

```bash
# Trên Netlify
# Vào Site settings → Environment variables
# Đảm bảo tất cả variables đã được set
```

### Bước 2: Test Google Sheets API

1. Truy cập: `https://your-site.netlify.app/api/init`
2. Nếu thành công, sẽ thấy: `{"success":true,"message":"Sheets initialized successfully"}`
3. Nếu lỗi, xem error message

### Bước 3: Kiểm tra Service Account

1. Vào Google Cloud Console
2. **IAM & Admin** → **Service Accounts**
3. Tìm Service Account của bạn
4. Đảm bảo có key đã được tạo
5. Download key mới nếu cần

### Bước 4: Kiểm tra Google Sheet

1. Mở Google Sheet
2. Kiểm tra đã share với Service Account email chưa
3. Đảm bảo quyền là **"Editor"**

## Error Messages thường gặp

### "Invalid JWT Signature"
- **Nguyên nhân**: Private key bị sai format
- **Giải pháp**: 
  - Đảm bảo private key có dấu ngoặc kép trong Netlify
  - Kiểm tra `\n` đã được replace đúng chưa

### "The caller does not have permission"
- **Nguyên nhân**: Service Account chưa được share quyền
- **Giải pháp**: Share Google Sheet với Service Account email

### "Requested entity was not found"
- **Nguyên nhân**: Spreadsheet ID sai
- **Giải pháp**: Kiểm tra lại Spreadsheet ID trong environment variables

### "API has not been used"
- **Nguyên nhân**: Google Sheets API chưa được enable
- **Giải pháp**: Enable Google Sheets API trong Google Cloud Console

## Test nhanh

1. **Test API init**:
```bash
curl https://your-site.netlify.app/api/init
```

2. **Test API members**:
```bash
curl https://your-site.netlify.app/api/members
```

3. **Xem logs trong Netlify Functions** để thấy error chi tiết

## Liên hệ hỗ trợ

Nếu vẫn gặp lỗi, cung cấp:
1. Error message từ Netlify logs
2. Environment variables đã được set (ẩn giá trị thực)
3. Screenshot của Google Sheet sharing settings

