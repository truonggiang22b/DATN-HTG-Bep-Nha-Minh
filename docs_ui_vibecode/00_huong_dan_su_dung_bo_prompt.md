# Hướng dẫn dùng bộ prompt UI Prototype

## 1. Mục đích
Bộ tài liệu này chuyển phần nghiệp vụ trong `docs_prototype` thành ngôn ngữ thiết kế và prompt vibe coding để dùng với Antigravity + Stitch MCP.

Mục tiêu là tạo prototype đủ thuyết phục khách hàng trong một vòng demo: khách quét QR, xem menu, thêm món, gửi order, bếp nhận đơn, bếp đổi trạng thái, khách thấy trạng thái, admin đánh dấu món tạm hết và reset bàn.

## 2. Thứ tự sử dụng khuyến nghị
| Bước | File | Dùng ở đâu | Kết quả mong muốn |
|---:|---|---|---|
| 1 | `01_ui_design_brief.md` | Đọc trước khi design | Chốt visual direction, persona, nguyên tắc UI |
| 2 | `02_stitch_mcp_master_prompt.md` | Dán vào Stitch MCP | Sinh mockup/high-fidelity screens |
| 3 | `03_screen_inventory_va_user_flow.md` | Đối chiếu với output design | Đảm bảo không thiếu màn hình và state |
| 4 | `04_antigravity_vibe_coding_prompt.md` | Dán vào Antigravity | Tạo prototype web app từ design/spec |
| 5 | `05_component_va_design_system_spec.md` | Dùng khi refine UI/code | Chuẩn hóa component, token, responsive |
| 6 | `06_demo_script_va_acceptance_ui.md` | Dùng khi test/demo | Kiểm tra prototype trước khi trình khách |

## 3. Nguyên tắc làm việc với Stitch MCP
| Nguyên tắc | Ghi chú |
|---|---|
| Tạo design trước code | Stitch nên tạo visual language và screen mockup trước khi Antigravity code. |
| Không design chung chung | Prompt đã định hướng phong cách F&B ấm, hiện đại, có bản sắc Việt Nam nhẹ. |
| Ưu tiên mobile customer | Customer app là nơi khách hàng chạm đầu tiên. |
| KDS cần rõ hơn đẹp | Bếp/quầy cần đọc nhanh trên tablet/laptop trong môi trường bận. |
| Admin đủ dùng | Admin prototype không cần quá phức tạp, nhưng phải có trạng thái món và reset bàn. |

## 4. Nguyên tắc làm việc với Antigravity
| Nguyên tắc | Ghi chú |
|---|---|
| Build prototype có data mock | Không cần backend thật trong vòng đầu nếu mục tiêu là demo UX. |
| State phải chạy thật | Order từ customer phải xuất hiện trong KDS, status đổi phải phản ánh ở tracking. |
| Không làm payment/POS | Tránh scope creep. |
| Có route demo nhanh | Chuẩn bị link bàn 05, KDS, Admin. |
| Có seed/reset demo | Cho phép reset dữ liệu trước mỗi lần demo. |

## 5. Prompt workflow nhanh
1. Dán `02_stitch_mcp_master_prompt.md` vào Stitch MCP để tạo thiết kế.
2. Nếu Stitch hỏi thêm, ưu tiên chọn `Mobile customer app + tablet KDS + desktop admin`.
3. Xuất design hoặc mô tả component/screen từ Stitch.
4. Dán `04_antigravity_vibe_coding_prompt.md` vào Antigravity, kèm design output nếu có.
5. Sau khi Antigravity tạo code, dùng `06_demo_script_va_acceptance_ui.md` để test.

## 6. Assumption
Mình chưa gọi trực tiếp Antigravity hoặc Stitch MCP từ workspace này vì hiện không có tool MCP đó trong phiên làm việc. Bộ file này được viết như prompt/handoff copy-paste để bạn dùng ở công cụ tương ứng.
