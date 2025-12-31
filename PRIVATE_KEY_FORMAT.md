# Hướng dẫn Format Private Key cho Netlify

## Cách 1: Paste trực tiếp (Khuyến nghị)

1. Mở file JSON của Service Account
2. Tìm field `"private_key"`
3. Copy **toàn bộ** giá trị, bao gồm:
   - `-----BEGIN PRIVATE KEY-----`
   - Tất cả các dòng base64 ở giữa
   - `-----END PRIVATE KEY-----`
4. Paste vào Netlify Environment Variable `GOOGLE_SHEETS_PRIVATE_KEY`
5. **KHÔNG** cần thêm dấu ngoặc kép

Ví dụ trong Netlify:
```
GOOGLE_SHEETS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDQlucz2+A4u6pN
hMfrdi4dgbWK/74tqNWZP37HuBPx+jiiRZml/Qwbkl1pHhEEi7V1L9OBeSZx2XBm
...
(many lines)
...
-----END PRIVATE KEY-----
```

## Cách 2: Với dấu ngoặc kép (Nếu Netlify yêu cầu)

Nếu Netlify yêu cầu dấu ngoặc kép, dùng format này:

```
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDQlucz2+A4u6pN\nhMfrdi4dgbWK/74tqNWZP37HuBPx+jiiRZml/Qwbkl1pHhEEi7V1L9OBeSZx2XBm\n...\n-----END PRIVATE KEY-----\n"
```

**Lưu ý**: Giữ nguyên `\n` trong dấu ngoặc kép - code sẽ tự động convert thành newlines.

## Cách 3: Từ file JSON

Nếu bạn có file JSON của Service Account:

1. Mở file JSON
2. Tìm dòng có `"private_key":`
3. Copy toàn bộ giá trị sau dấu `:`
4. Remove dấu ngoặc kép ở đầu và cuối (nếu có)
5. Paste vào Netlify

## Kiểm tra Format

Private key phải có:
- ✅ `-----BEGIN PRIVATE KEY-----` ở đầu
- ✅ `-----END PRIVATE KEY-----` ở cuối
- ✅ Nhiều dòng base64 ở giữa
- ✅ Tổng cộng khoảng 1600-1700 ký tự

## Lỗi thường gặp

### ❌ Thiếu BEGIN/END markers
```
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDQlucz2+A4u6pN...
```
→ Cần thêm `-----BEGIN PRIVATE KEY-----` và `-----END PRIVATE KEY-----`

### ❌ Chỉ có một dòng
```
-----BEGIN PRIVATE KEY-----MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDQlucz2+A4u6pNhMfrdi4dgbWK/74tqNWZP37HuBPx+jiiRZml/Qwbkl1pHhEEi7V1L9OBeSZx2XBm...-----END PRIVATE KEY-----
```
→ Cần có newlines giữa các phần

### ❌ Bị cắt
```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDQlucz2+A4u6pN
...
```
→ Copy lại toàn bộ private key từ file JSON gốc

## Test sau khi cập nhật

1. Trigger deploy mới trên Netlify
2. Gọi `/api/init`
3. Nếu thành công: `{"success":true,"message":"Sheets initialized successfully"}`
4. Nếu vẫn lỗi: Kiểm tra Netlify Functions logs để xem error chi tiết

