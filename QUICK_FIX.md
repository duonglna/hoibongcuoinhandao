# Sửa lỗi Push GitHub - Hướng dẫn nhanh

## Lỗi hiện tại
```
! [remote rejected] main -> main (push declined due to repository rule violations)
```

## Cách 1: Tắt Branch Protection (2 phút)

### Bước 1: Vào GitHub
1. Mở: https://github.com/duonglna/hoibongcuoinhandao/settings/branches
2. Hoặc: Repository → Settings → Branches

### Bước 2: Xóa Branch Protection Rule
1. Tìm phần **"Branch protection rules"**
2. Nếu thấy rule cho `main`, click vào rule đó
3. Scroll xuống cuối trang
4. Click nút **"Delete"** (màu đỏ)
5. Xác nhận xóa

### Bước 3: Push lại
```bash
git push -u origin main
```

## Cách 2: Push vào branch khác (Nếu không muốn tắt protection)

```bash
# Tạo branch mới
git checkout -b setup

# Push vào branch mới
git push -u origin setup
```

Sau đó trên GitHub:
- Sẽ có thông báo "Compare & pull request"
- Click vào → Tạo PR → Merge

## Cách 3: Tạo repository mới (Nếu repository hiện tại có vấn đề)

1. Tạo repository mới trên GitHub (không tích "Initialize with README")
2. Chạy:
```bash
git remote remove origin
git remote add origin https://github.com/duonglna/TEN_REPO_MOI.git
git push -u origin main
```

## Kiểm tra nhanh

Sau khi push thành công, vào:
https://github.com/duonglna/hoibongcuoinhandao

Bạn sẽ thấy tất cả files của project.

