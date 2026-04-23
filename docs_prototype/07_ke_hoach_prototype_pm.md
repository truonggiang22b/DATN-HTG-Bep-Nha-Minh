# Kế hoạch prototype cho PM

## 1. Mục tiêu delivery
Trong giai đoạn prototype, đội dự án cần tạo ra một bản chạy được để khách hàng trải nghiệm luồng nghiệp vụ mới, đưa feedback và thống nhất scope MVP tiếp theo.

Prototype không nhằm thay thế production POS/payment mà nhằm chứng minh core ordering tại bàn hoạt động trơn tru.

## 2. Kịch bản demo chính
| Bước | Người demo | Nội dung |
|---:|---|---|
| 1 | PO/BA | Giới thiệu vấn đề hiện tại và flow mới |
| 2 | Khách giả lập | Quét QR bàn 05 bằng điện thoại |
| 3 | Khách giả lập | Xem menu, mở chi tiết món, thêm 2 món vào giỏ |
| 4 | Khách giả lập | Thêm ghi chú `Không hành`, chốt đơn |
| 5 | Bếp giả lập | KDS nhận order mới, thấy bàn 05 và ghi chú |
| 6 | Bếp giả lập | Đổi trạng thái `Đang chuẩn bị`, rồi `Sẵn sàng` |
| 7 | Khách giả lập | Màn tracking cập nhật trạng thái |
| 8 | Khách giả lập | Gọi thêm 1 món, tạo order bổ sung |
| 9 | Admin giả lập | Đánh dấu một món tạm hết |
| 10 | Khách giả lập | Thấy món tạm hết không đặt được |
| 11 | Quản lý ca | Reset bàn khi kết thúc phiên |

## 3. Timeline đề xuất 2 tuần
| Ngày | Milestone | Deliverable |
|---|---|---|
| D1 | Kickoff và chốt scope | Scope prototype, dữ liệu menu mẫu, flow cuối |
| D2-D3 | Data model/API nền | DB schema, seed data, QR resolve, menu API |
| D4-D5 | Customer menu/cart | QR landing, menu, detail, cart UI |
| D6 | Submit order | Order API, validation, idempotency |
| D7-D8 | KDS | Order queue, status update, refresh/realtime |
| D9 | Tracking khách | Order success/tracking, gọi thêm món |
| D10 | Admin cơ bản | Menu status, bàn/QR, reset session |
| D11 | Integration hardening | Fix end-to-end, seed data, auth admin/KDS |
| D12 | Internal UAT | Test checklist, bug triage |
| D13 | Demo polish | UI polish, content, demo script |
| D14 | Customer demo | Demo, feedback, quyết định phase tiếp theo |

## 4. Timeline đề xuất 3 tuần nếu có AI-lite
| Tuần | Nội dung |
|---|---|
| Tuần 1 | Core QR/menu/cart/order/API |
| Tuần 2 | KDS/tracking/admin/reset/UAT |
| Tuần 3 | AI-lite mock/gợi ý món, polish, customer workshop |

## 5. RACI delivery
| Workstream | PO | PM | BA | CTO/Tech Lead | FE | BE | QA | UX/UI |
|---|---|---|---|---|---|---|---|---|
| Chốt scope | A | R | R | C | I | I | I | C |
| Quy trình nghiệp vụ | C | R | A/R | C | I | I | C | C |
| PRD/backlog | A/R | C | R | C | I | I | C | C |
| Kiến trúc/API | C | I | C | A/R | C | R | C | I |
| Customer UI | A | C | C | C | R | C | C | R |
| KDS/Admin | A | C | C | C | R | R | C | C |
| QA/UAT | C | A/R | R | C | C | C | R | I |
| Demo khách hàng | A/R | R | R | C | C | C | C | C |

## 6. Work breakdown structure
| ID | Hạng mục | Output |
|---|---|---|
| WBS-01 | Setup project và môi trường | Repo/app chạy được, env mẫu |
| WBS-02 | Schema và seed data | Migration + menu/bàn demo |
| WBS-03 | Customer app | QR landing, menu, cart, submit, tracking |
| WBS-04 | KDS | Order board, status transition |
| WBS-05 | Admin | Menu status, table QR, reset session |
| WBS-06 | Auth nội bộ | Bảo vệ KDS/Admin |
| WBS-07 | QA/UAT | Checklist pass/fail, bug list |
| WBS-08 | Demo package | Script demo, data reset, known limitations |

## 7. UAT scenarios
| ID | Scenario | Expected result |
|---|---|---|
| UAT-01 | Quét QR bàn hợp lệ | Vào đúng bàn và thấy menu |
| UAT-02 | Đặt order có ghi chú | KDS thấy ghi chú rõ ràng |
| UAT-03 | Đổi trạng thái trên KDS | Khách thấy trạng thái cập nhật |
| UAT-04 | Gọi thêm món | KDS có order bổ sung cùng bàn |
| UAT-05 | Món tạm hết | Khách không thể đặt món đó |
| UAT-06 | Chốt đơn khi mất mạng/timeout giả lập | Không tạo đơn trùng khi retry |
| UAT-07 | Reset bàn | Session cũ đóng, lượt mới không lẫn order cũ |
| UAT-08 | QR sai | Màn lỗi thân thiện, không lộ dữ liệu |

## 8. Definition of success cho demo
| Nhóm | Điều kiện đạt |
|---|---|
| Business | Khách hàng đồng ý flow To-Be hợp lý và đáng prototype tiếp |
| Product | 80%+ UAT scenario chính pass |
| Technical | Không có lỗi blocker trong demo core flow |
| Operation | Vai trò bếp/quản lý hiểu việc cần làm trên hệ thống |
| Scope | Khách hàng xác nhận các out-of-scope cho MVP |

## 9. Risk register
| ID | Rủi ro | Mức | Owner | Mitigation |
|---|---|---|---|---|
| R-01 | Scope creep sang payment/POS | Cao | PO/PM | Dùng scope table, yêu cầu change request |
| R-02 | Dữ liệu menu chưa sẵn sàng | Cao | BA/PO | Tạo menu demo chuẩn, xin khách xác nhận sau |
| R-03 | Realtime không ổn định | Trung bình | CTO | Dùng polling fallback |
| R-04 | KDS khó dùng trong bếp | Cao | UX/BA | Test với màn tablet/laptop, chữ lớn |
| R-05 | Quên reset bàn gây lẫn phiên | Cao | BA/PM | Đưa reset vào SOP và demo rõ |
| R-06 | AI bị kỳ vọng quá cao | Trung bình | PO | Nêu AI phase 2; nếu demo thì chỉ AI-lite có guardrail |

## 10. Change control nhẹ cho prototype
| Loại thay đổi | Cách xử lý |
|---|---|
| Thay text/UI nhỏ | PO quyết trong ngày nếu không ảnh hưởng data/API |
| Thay business rule | BA cập nhật `02_quy_trinh_nghiep_vu_thong_nhat.md`, PO/PM xác nhận |
| Thêm feature mới | PM đánh giá impact timeline; PO quyết trade-off |
| Thay kiến trúc/API | CTO/Tech Lead quyết và cập nhật tài liệu kỹ thuật |

## 11. Meeting cadence
| Cuộc họp | Tần suất | Mục tiêu |
|---|---|---|
| Daily sync | 15 phút/ngày | Blocker, tiến độ, quyết định nhanh |
| BA/PO review | 2-3 lần/tuần | Chốt flow, text, acceptance criteria |
| Tech review | 2 lần/tuần | API/data/realtime/auth |
| Internal demo | Cuối mỗi tuần | Xem end-to-end, giảm rủi ro demo khách |
| Customer demo | Cuối prototype | Thu feedback và chốt bước tiếp theo |

## 12. Checklist trước ngày demo khách hàng
| Nhóm | Checklist |
|---|---|
| Dữ liệu | Bàn 01-05 có QR; 15-20 món; 2 món sold out; ảnh/placeholder ổn |
| Thiết bị | 1 điện thoại khách, 1 laptop/tablet KDS, 1 laptop admin |
| Flow | Đã chạy thử từ QR đến reset bàn ít nhất 3 lần |
| Tài khoản | Admin/KDS login sẵn hoặc thông tin login chuẩn bị sẵn |
| Fallback | Nếu realtime lỗi, có nút refresh; nếu ảnh lỗi, placeholder |
| Script | Người demo biết rõ thứ tự thao tác và câu chuyện kể |

## 13. Output sau demo
| Output | Owner |
|---|---|
| Biên bản feedback | PM/BA |
| Danh sách thay đổi scope | PO/PM |
| Bug list và mức độ ưu tiên | QA/PM |
| Quyết định tiến lên MVP/phase tiếp theo | PO/Stakeholder |
| Update tài liệu nghiệp vụ nếu có thay đổi | BA |
