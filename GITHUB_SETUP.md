# Hướng dẫn Push Code lên GitHub

## Bước 1: Tạo Repository trên GitHub

1. Đăng nhập vào [GitHub](https://github.com/)
2. Click nút **"+"** ở góc trên bên phải → **"New repository"**
3. Điền thông tin:
   - **Repository name**: `pickleball-manager` (hoặc tên bạn muốn)
   - **Description**: "Quản lý nhóm chơi pickleball"
   - **Visibility**: Chọn **Public** hoặc **Private**
   - **KHÔNG** tích vào "Initialize this repository with a README" (vì đã có code)
4. Click **"Create repository"**

## Bước 2: Khởi tạo Git trong project (nếu chưa có)

Mở terminal trong thư mục project và chạy:

```bash
# Kiểm tra xem đã có git chưa
git status

# Nếu chưa có, khởi tạo git
git init

# Thêm tất cả files vào staging
git add .

# Commit lần đầu
git commit -m "Initial commit: Pickleball Manager app"
```

## Bước 3: Kết nối với GitHub Repository

```bash
# Thêm remote repository (thay YOUR_USERNAME và REPO_NAME bằng thông tin của bạn)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Hoặc nếu dùng SSH:
# git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git

# Kiểm tra remote đã được thêm chưa
git remote -v
```

## Bước 4: Push code lên GitHub

```bash
# Push code lên branch main
git branch -M main
git push -u origin main
```

Nếu lần đầu push, GitHub sẽ yêu cầu đăng nhập:
- **Username**: Tên GitHub của bạn
- **Password**: Sử dụng Personal Access Token (không phải mật khẩu GitHub)

### Tạo Personal Access Token (nếu cần):

1. Vào GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Đặt tên token (ví dụ: "Pickleball Manager")
4. Chọn quyền: **repo** (đầy đủ quyền)
5. Click **"Generate token"**
6. **Copy token ngay** (chỉ hiện 1 lần)
7. Dùng token này làm password khi push

## Bước 5: Xác nhận

1. Vào repository trên GitHub
2. Kiểm tra code đã được push thành công
3. Tất cả files nên hiển thị trong repository

## Các lệnh Git thường dùng

### Xem trạng thái
```bash
git status
```

### Thêm file vào staging
```bash
# Thêm tất cả files
git add .

# Thêm file cụ thể
git add filename.js
```

### Commit thay đổi
```bash
git commit -m "Mô tả thay đổi"
```

### Push lên GitHub
```bash
git push
```

### Pull code từ GitHub
```bash
git pull
```

### Xem lịch sử commit
```bash
git log
```

### Tạo branch mới
```bash
git checkout -b feature-name
git push -u origin feature-name
```

## Lưu ý quan trọng

### 1. File `.env.local` KHÔNG được push
File `.env.local` đã được thêm vào `.gitignore`, nên sẽ không bị push lên GitHub (an toàn).

### 2. Nếu đã có code trên GitHub và muốn pull về
```bash
git pull origin main
```

### 3. Nếu có conflict khi push
```bash
# Pull code mới nhất trước
git pull origin main

# Giải quyết conflict, sau đó:
git add .
git commit -m "Resolve conflicts"
git push
```

### 4. Xem các files sẽ được push
```bash
git status
```

## Troubleshooting

### Lỗi: "push declined due to repository rule violations"

Lỗi này xảy ra khi repository có branch protection rules. Có 3 cách giải quyết:

#### Cách 1: Tắt Branch Protection (Khuyến nghị cho repository cá nhân)

1. Vào GitHub repository → **Settings** → **Branches**
2. Tìm **"Branch protection rules"**
3. Xóa hoặc disable rule cho branch `main`
4. Thử push lại:
```bash
git push -u origin main
```

#### Cách 2: Push vào branch khác rồi tạo Pull Request

```bash
# Tạo branch mới
git checkout -b initial-setup

# Push vào branch mới
git push -u origin initial-setup
```

Sau đó trên GitHub:
1. Tạo Pull Request từ branch `initial-setup` vào `main`
2. Merge PR

#### Cách 3: Force push (Cẩn thận - chỉ dùng nếu repository trống)

```bash
# Chỉ dùng nếu repository hoàn toàn trống và bạn chắc chắn
git push -u origin main --force
```

⚠️ **Cảnh báo**: `--force` sẽ ghi đè mọi thứ trên remote. Chỉ dùng nếu repository trống hoặc bạn chắc chắn muốn ghi đè.

### Lỗi: "remote origin already exists"
```bash
# Xóa remote cũ
git remote remove origin

# Thêm lại
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

### Lỗi: "failed to push some refs"
```bash
# Pull code mới nhất trước
git pull origin main --rebase

# Sau đó push lại
git push
```

### Lỗi: "Permission denied"
- Kiểm tra lại Personal Access Token
- Hoặc dùng SSH key thay vì HTTPS

### Reset về commit trước
```bash
# Xem lịch sử
git log

# Reset về commit cụ thể (thay COMMIT_HASH)
git reset --hard COMMIT_HASH
```

## Sau khi push thành công

1. Code đã có trên GitHub
2. Có thể deploy lên Netlify bằng cách:
   - Vào Netlify Dashboard
   - Import project từ GitHub
   - Chọn repository vừa push
   - Deploy!

## Tài liệu tham khảo

- [GitHub Docs](https://docs.github.com/)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

