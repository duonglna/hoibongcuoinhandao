# Sửa lỗi "push declined due to repository rule violations"

## Vấn đề

Khi push code lên GitHub, gặp lỗi:
```
! [remote rejected] main -> main (push declined due to repository rule violations)
error: failed to push some refs
```

## Nguyên nhân

Repository có **Branch Protection Rules** ngăn push trực tiếp vào branch `main`.

## Giải pháp

### Giải pháp 1: Tắt Branch Protection (Dễ nhất - Khuyến nghị)

1. Vào repository trên GitHub: `https://github.com/duonglna/hoibongcuoinhandao`
2. Click **Settings** (tab trên cùng)
3. Click **Branches** (menu bên trái)
4. Tìm phần **"Branch protection rules"**
5. Nếu có rule cho branch `main`, click vào rule đó
6. Scroll xuống cuối → Click **"Delete"** hoặc **"Disable"**
7. Xác nhận xóa/disable
8. Quay lại terminal và push lại:
```bash
git push -u origin main
```

### Giải pháp 2: Push vào branch khác (An toàn)

Nếu không muốn tắt branch protection, push vào branch khác:

```bash
# Tạo branch mới
git checkout -b initial-setup

# Push vào branch mới
git push -u origin initial-setup
```

Sau đó trên GitHub:
1. Bạn sẽ thấy thông báo "Compare & pull request"
2. Click vào đó
3. Tạo Pull Request từ `initial-setup` vào `main`
4. Click **"Merge pull request"**
5. Code sẽ được merge vào `main`

### Giải pháp 3: Force push (Chỉ dùng nếu repository trống)

⚠️ **CẢNH BÁO**: Chỉ dùng nếu repository hoàn toàn trống và bạn chắc chắn muốn ghi đè.

```bash
git push -u origin main --force
```

## Kiểm tra sau khi fix

1. Vào repository trên GitHub
2. Kiểm tra code đã được push thành công
3. Tất cả files nên hiển thị trong repository

## Nếu vẫn gặp lỗi

1. Kiểm tra bạn có quyền write vào repository không
2. Thử dùng SSH thay vì HTTPS:
```bash
# Xóa remote HTTPS
git remote remove origin

# Thêm remote SSH (thay YOUR_USERNAME)
git remote add origin git@github.com:YOUR_USERNAME/hoibongcuoinhandao.git

# Push lại
git push -u origin main
```

3. Kiểm tra Personal Access Token có quyền `repo` đầy đủ

