# Pickleball Manager

Ứng dụng web quản lý nhóm chơi pickleball với tích hợp Google Sheets làm database.

## Quick Start

1. **Setup**: Xem file `SETUP.md` (nếu có) hoặc `README.md` phần cài đặt
2. **Deploy lên GitHub**: Xem file `GITHUB_SETUP.md`
3. **Deploy lên Netlify**: Xem file `DEPLOY.md`

## Tính năng

### Admin
- Quản lý thành viên (thêm, xem danh sách)
- Quản lý sân (thêm sân, địa chỉ, link Google Maps, giá mỗi giờ)
- Quản lý lịch chơi (thêm lịch, chọn thành viên tham gia, tính tiền)
- Quản lý quỹ (nhập tiền quỹ đóng của thành viên)
- Tính toán chia tiền: sân, vợt, nước cho từng thành viên
- Login bằng mật khẩu: `abc123`

### Thành viên
- Xem lịch chơi tuần này
- Xem địa chỉ sân và link Google Maps
- Xem giá tiền
- Xem số tiền đang nợ hoặc còn trong quỹ

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env.local` với nội dung:
```
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account-email@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY=your-private-key
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
ADMIN_PASSWORD=abc123
```

3. Tạo Google Service Account:
   - Vào [Google Cloud Console](https://console.cloud.google.com/)
   - Tạo project mới hoặc chọn project hiện có
   - Enable Google Sheets API
   - Tạo Service Account và download JSON key
   - Copy `client_email` và `private_key` vào `.env.local`
   - Share Google Sheet với email của Service Account (quyền Editor)

4. Tạo Google Sheet:
   - Tạo một Google Sheet mới
   - Copy Spreadsheet ID từ URL (phần giữa `/d/` và `/edit`)
   - Paste vào `GOOGLE_SHEETS_SPREADSHEET_ID` trong `.env.local`

5. Chạy ứng dụng:
```bash
npm run dev
```

6. Mở trình duyệt: http://localhost:3000

## Cấu trúc Database (Google Sheets)

Ứng dụng sẽ tự động tạo các sheet sau:
- **Members**: ID, Name, Phone, Email
- **Courts**: ID, Name, Address, GoogleMapLink, PricePerHour, Active
- **Schedules**: ID, CourtID, Date, StartTime, Hours, CourtPrice, RacketPrice, WaterPrice, Participants, Status
- **Payments**: ID, ScheduleID, MemberID, CourtShare, RacketShare, WaterShare
- **Funds**: ID, MemberID, Amount

## Sử dụng

1. **Đăng nhập Admin**: Nhập mật khẩu `abc123` để vào trang quản lý
2. **Thêm thành viên**: Tab "Thành viên" → "Thêm thành viên"
3. **Thêm sân**: Tab "Sân" → "Thêm sân"
4. **Tạo lịch chơi**: Tab "Lịch chơi" → "Thêm lịch chơi" → Chọn sân, ngày, giờ, số giờ, giá vợt/nước, chọn thành viên
5. **Tính tiền**: Sau khi chơi xong, click "Tính tiền" → Chọn thành viên thuê vợt/mua nước → "Tính tiền"
6. **Thêm quỹ**: Tab "Quỹ" → "Thêm quỹ" → Chọn thành viên và số tiền
7. **Xem với tư cách thành viên**: Từ trang chủ, click "Xem với tư cách thành viên" → Chọn tên mình để xem lịch và số dư

