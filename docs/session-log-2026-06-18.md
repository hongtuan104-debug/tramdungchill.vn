# Nhật ký phiên làm việc — 17–18/06/2026

> Tối ưu SEO/AEO + CRO website tramdungchill.vn. Người thực hiện: Claude (em) cho sếp Tuấn.
> Nhánh này CHỈ lưu nhật ký, KHÔNG deploy lên web (web deploy từ nhánh `main`).

## Tóm tắt 1 dòng
Đóng nốt 3 hạng mục "còn soát" Phase 3 (toạ độ, số TikTok, số review) + bắt đầu tối ưu chuyển đổi (CRO) form đặt bàn. Tất cả đã LIVE trên `main`.

## Các commit đã LIVE trên `main`
| Commit | Nội dung |
|---|---|
| `ad13574` | Sửa toạ độ geo schema sai ~4.2km → pin Google Maps thật `11.9542,108.4946` (xác minh qua Brave + khớp SĐT/FB) |
| `8aa10f4` | Cập nhật số TikTok đã xác minh: hơn 13 triệu views · 80K+ followers · 1,5M likes (scrape Apify: video viral thật 13.2M, 81.4K fans, 1.5M like) |
| `131e384` | Cập nhật số đánh giá Google 5.949 → **6.500+** (xác minh GBP hiện 6.509), đồng bộ schema + 4 trang dip + song ngữ |
| `811b68f` | **CRO:** thêm nút "Đặt nhanh qua Zalo" + 1 review thật (Quyên Quyên) tại form đặt bàn; tiêu đề review "Gần 6.000"→"Hơn 6.500" |

## Việc owner tự làm (off-site, em đã đưa nội dung sẵn)
- **Google Maps – Mô tả:** dán bản viết lại (731/750 ký tự) — đã thêm tên "Xóm Lèo", sửa "P.11"→"Phường Xuân Trường", thêm "săn tàu", "hơn 70 món", "13 triệu view". Không SĐT/link, không "không cần cọc".
- Đồng bộ NAP: sửa bio TikTok "P11" → "Phường Xuân Trường".
- In QR review để bàn; trả lời các đánh giá Google.
- Citation: PasGo/Foody/TripAdvisor.

## Đo lường tự động
Routine cloud `trig_01YKnun4XM18VJnCzbwmSrQM` — chạy ngày 14 hằng tháng (lần đầu 14/7/2026): tự kiểm tra ChatGPT/Google có giới thiệu đúng quán không.

## Ghi chú kỹ thuật quan trọng (cho phiên sau)
- **CSS:** `scripts/bundle-js.js` chỉ minify `css/style.css` (monolithic ~4335 dòng) → `dist/style.min.css`. Các file `css/booking.css`, `hero.css`... là LEGACY, KHÔNG được build dùng. **Sửa CSS = sửa `css/style.css`** rồi `node scripts/bundle-js.js`.
- `dist/` ĐƯỢC track (không gitignore) → phải commit `dist/style.min.css` sau khi build.
- `data/translations.js` nạp trực tiếp (không bundle) — sửa là có hiệu lực luôn.
- Quy trình deploy: sửa → `node scripts/bundle-js.js` → `git add` file cụ thể → commit → push `main` → GitHub Pages tự deploy (~1-2 phút).

## Việc còn lại (backlog CRO — owner mới chọn 1/3)
- [ ] Nút chọn ngày nhanh "Tối nay / Mai / Cuối tuần" cho ô "Ngày đến" (đang để trống).
- [ ] Gộp ô "Dịp" + "Ghi chú" thành "Thêm yêu cầu (tuỳ chọn)" cho form gọn lại.
- [ ] (Tuỳ chọn) Đổi "gần 6.000 đánh giá" trong 13 bài trụ blog (`data/blog-seo.js`) → "hơn 6.500".

---
*Chi tiết đầy đủ lưu ở memory máy: `C:\Users\Lenovo\.claude\projects\d--Projects\memory\sessions\2026-06-16-tramdungchill-seo-aeo-phase1.md`*
