# Sửa lỗi "Invalid JWT Signature"

## Nguyên nhân

Lỗi "Invalid JWT Signature" xảy ra khi private key của Service Account không đúng format.

## Cách sửa

### Bước 1: Kiểm tra Private Key trong Netlify

1. Vào Netlify Dashboard → Site settings → Environment variables
2. Tìm `GOOGLE_SHEETS_PRIVATE_KEY`
3. Đảm bảo private key có format đúng:

**ĐÚNG:**
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
(many lines of base64)
...
-----END PRIVATE KEY-----
```

**SAI:**
- Private key không có `-----BEGIN PRIVATE KEY-----` và `-----END PRIVATE KEY-----`
- Newlines bị escape thành `\n` literal thay vì actual newlines
- Private key bị thiếu một phần

### Bước 2: Format Private Key đúng cách

Khi paste private key vào Netlify Environment Variables:

1. **Copy toàn bộ private key** từ file JSON của Service Account
2. **Bao gồm cả** `-----BEGIN PRIVATE KEY-----` và `-----END PRIVATE KEY-----`
3. **Đặt trong dấu ngoặc kép** `"..."` trong Netlify
4. **Giữ nguyên các ký tự `\n`** - Netlify sẽ tự động xử lý

Ví dụ trong Netlify:
```
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### Bước 3: Lấy Private Key từ Service Account JSON

1. Mở file JSON của Service Account (đã download từ Google Cloud Console)
2. Tìm field `"private_key"`
3. Copy toàn bộ giá trị (bao gồm cả `-----BEGIN PRIVATE KEY-----` và `-----END PRIVATE KEY-----`)
4. Paste vào Netlify, đặt trong dấu ngoặc kép

### Bước 4: Kiểm tra lại

Sau khi cập nhật environment variable:

1. **Trigger một deploy mới** (hoặc đợi auto-deploy)
2. Gọi lại `/api/init`
3. Nếu vẫn lỗi, kiểm tra Netlify Functions logs để xem error chi tiết

## Các lỗi thường gặp

### Lỗi 1: Private key thiếu BEGIN/END markers
**Giải pháp**: Đảm bảo copy toàn bộ private key, bao gồm cả markers

### Lỗi 2: Newlines bị sai
**Giải pháp**: Code đã tự động xử lý `\n`, nhưng đảm bảo trong Netlify bạn paste đúng format

### Lỗi 3: Private key bị cắt
**Giải pháp**: Copy lại toàn bộ private key từ file JSON gốc

## Test nhanh

Sau khi sửa, test bằng cách:
1. Gọi `/api/init`
2. Nếu thành công, sẽ thấy: `{"success":true,"message":"Sheets initialized successfully"}`
3. Kiểm tra Google Sheet - sẽ thấy các sheet mới được tạo

## Nếu vẫn lỗi

1. Kiểm tra Netlify Functions logs để xem error chi tiết
2. Đảm bảo Service Account đã được share quyền Editor cho Google Sheet
3. Đảm bảo Google Sheets API đã được enable trong Google Cloud Console
4. Thử tạo Service Account mới và download key mới

