# Xóa Secrets khỏi Git History

## Vấn đề

File `luminous-girder-249922-e06214a068f3.json` (chứa Google Cloud credentials) đã bị commit vào Git. GitHub đã phát hiện và chặn push.

## Đã xử lý

1. ✅ Đã xóa file khỏi working directory
2. ✅ Đã thêm vào `.gitignore`
3. ✅ Đã commit thay đổi

## Bước tiếp theo

### Option 1: Tạo commit mới và push (Đơn giản)

File credentials vẫn còn trong lịch sử commit cũ, nhưng đã được xóa khỏi commit mới. Bạn có thể:

1. **Tắt Push Protection tạm thời** trên GitHub:
   - Vào: https://github.com/duonglna/hoibongcuoinhandao/settings/security_analysis
   - Tắt "Push protection" tạm thời
   - Push code
   - Sau đó **bật lại** Push Protection

2. Hoặc **Allow secret** trên GitHub:
   - Vào link GitHub cung cấp trong lỗi
   - Allow secret này một lần
   - Push lại

### Option 2: Rewrite Git History (An toàn hơn - Khuyến nghị)

Xóa hoàn toàn file khỏi lịch sử Git:

```bash
# Cài đặt git-filter-repo (nếu chưa có)
# macOS: brew install git-filter-repo
# Hoặc dùng git filter-branch

# Xóa file khỏi toàn bộ lịch sử
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch luminous-girder-249922-e06214a068f3.json" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (CẨN THẬN!)
git push origin --force --all
```

⚠️ **Cảnh báo**: Force push sẽ ghi đè lịch sử trên remote. Chỉ dùng nếu bạn chắc chắn.

### Option 3: Tạo repository mới (Dễ nhất)

1. Tạo repository mới trên GitHub
2. Push code mới (không có credentials):
```bash
git remote remove origin
git remote add origin https://github.com/duonglna/TEN_REPO_MOI.git
git push -u origin main
```

## Quan trọng: Rotate Credentials

Vì credentials đã bị lộ (dù chỉ trong commit local), bạn nên:

1. **Xóa Service Account cũ** trong Google Cloud Console
2. **Tạo Service Account mới**
3. **Download key mới**
4. **Cập nhật `.env.local`** với credentials mới
5. **Share Google Sheet** với email Service Account mới

## Phòng ngừa

✅ File `.gitignore` đã được cập nhật để ignore:
- `*.json` (trừ các file config cần thiết)
- `luminous-*.json`
- `*service-account*.json`
- `*credentials*.json`

✅ Luôn kiểm tra trước khi commit:
```bash
git status
git diff
```

