# Hướng dẫn Deploy lên Netlify

## Bước 1: Chuẩn bị

1. Đảm bảo code đã được push lên GitHub/GitLab/Bitbucket
2. Có tài khoản Netlify (đăng ký miễn phí tại https://www.netlify.com/)

## Bước 2: Deploy từ Git

### Cách 1: Deploy qua Netlify Dashboard

1. Đăng nhập vào [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Chọn Git provider (GitHub/GitLab/Bitbucket) và authorize
4. Chọn repository của bạn
5. Cấu hình build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Base directory**: (để trống)

### Cách 2: Deploy qua Netlify CLI

```bash
# Cài đặt Netlify CLI
npm install -g netlify-cli

# Đăng nhập
netlify login

# Deploy
netlify deploy --prod
```

## Bước 3: Cấu hình Environment Variables

Trong Netlify Dashboard:
1. Vào **Site settings** → **Environment variables**
2. Thêm các biến môi trường sau:

```
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account-email@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
ADMIN_PASSWORD=abc123
```

**Lưu ý quan trọng:**
- `GOOGLE_SHEETS_PRIVATE_KEY` phải được đặt trong dấu ngoặc kép và giữ nguyên các ký tự `\n`
- Sau khi thêm environment variables, cần **trigger một deploy mới** để áp dụng

## Bước 4: Khởi tạo Google Sheets (Tự động)

Google Sheets sẽ được tự động khởi tạo khi bạn sử dụng ứng dụng lần đầu tiên. Các sheet sẽ được tạo tự động khi:
- Bạn thêm thành viên đầu tiên
- Bạn thêm sân đầu tiên
- Bạn xem lịch chơi

**Không cần gọi API thủ công!** Hệ thống sẽ tự động tạo các sheet cần thiết.

Nếu muốn khởi tạo thủ công, bạn có thể truy cập:
```
https://your-site.netlify.app/api/init
```

## Bước 5: Kiểm tra

1. Truy cập URL của site (sẽ có dạng: `https://your-site-name.netlify.app`)
2. Test các chức năng:
   - Đăng nhập admin (mật khẩu: `abc123`)
   - Thêm thành viên, sân, lịch chơi
   - Xem trang member

## Troubleshooting

### Lỗi build
- Kiểm tra Node version (cần Node 18+)
- Kiểm tra build logs trong Netlify Dashboard

### Lỗi Google Sheets API
- Kiểm tra environment variables đã được set đúng chưa
- Đảm bảo Service Account đã được share quyền Editor cho Google Sheet
- Kiểm tra Google Sheets API đã được enable

### Lỗi 404 trên các route
- Đảm bảo đã cài đặt plugin `@netlify/plugin-nextjs`
- Kiểm tra file `netlify.toml` đã có đúng cấu hình

## Tùy chọn: Custom Domain

1. Vào **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Thêm domain của bạn và làm theo hướng dẫn

## Tài liệu tham khảo

- [Netlify Next.js Docs](https://docs.netlify.com/integrations/frameworks/nextjs/)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)

