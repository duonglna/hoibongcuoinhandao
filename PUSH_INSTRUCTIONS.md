# Hướng dẫn Push Code - Tình huống hiện tại

## Vấn đề đã phát hiện

GitHub đã phát hiện file credentials (`luminous-girder-249922-e06214a068f3.json`) trong commit cũ và chặn push.

## Đã xử lý

✅ Đã xóa file credentials khỏi working directory
✅ Đã cập nhật `.gitignore` để ignore các file credentials
✅ Đã commit thay đổi

## Các bước tiếp theo

### Bước 1: Allow Secret trên GitHub (Khuyến nghị)

1. Vào link này (từ thông báo lỗi):
   ```
   https://github.com/duonglna/hoibongcuoinhandao/security/secret-scanning/unblock-secret/37b7waTxwKg2DjyLfJgVRFjz7Bq
   ```
   
2. Hoặc vào: Repository → **Security** → **Secret scanning** → Tìm secret bị chặn → **Allow**

3. Sau đó push lại:
   ```bash
   git push -u origin main
   ```

### Bước 2: Tắt Push Protection tạm thời

1. Vào: https://github.com/duonglna/hoibongcuoinhandao/settings/security_analysis
2. Tìm **"Push protection"**
3. Tắt tạm thời
4. Push code:
   ```bash
   git push -u origin main
   ```
5. **Bật lại** Push Protection sau khi push xong

### Bước 3: Xóa hoàn toàn khỏi Git History (Nếu muốn)

Nếu muốn xóa hoàn toàn file credentials khỏi lịch sử Git:

```bash
# Cài đặt git-filter-repo (nếu chưa có)
# macOS: brew install git-filter-repo

# Xóa file khỏi toàn bộ lịch sử
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch luminous-girder-249922-e06214a068f3.json" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push origin --force --all
```

⚠️ **Cảnh báo**: Force push sẽ ghi đè lịch sử. Chỉ dùng nếu bạn chắc chắn.

## ⚠️ QUAN TRỌNG: Rotate Credentials

Vì credentials đã có thể bị lộ, bạn **PHẢI**:

1. **Xóa Service Account cũ** trong Google Cloud Console
2. **Tạo Service Account mới**
3. **Download key mới**
4. **Cập nhật `.env.local`** với credentials mới
5. **Share Google Sheet** với email Service Account mới

## Kiểm tra trước khi push

```bash
# Xem các file sẽ được push
git status

# Xem diff
git diff

# Đảm bảo không có file credentials
git ls-files | grep -i json | grep -v package | grep -v tsconfig
```

## Sau khi push thành công

1. Code sẽ có trên GitHub
2. Có thể deploy lên Netlify
3. **NHỚ** rotate credentials như hướng dẫn trên!

