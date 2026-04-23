# AI Phase 2 và Prompt/Knowledge Design

## 1. Định vị AI
AI là lớp hỗ trợ chọn món và tăng giá trị đơn hàng, không phải phần bắt buộc để prototype core ordering thành công. AI không được tự tạo order nếu khách chưa xác nhận rõ ràng.

Trong prototype, nếu khách hàng muốn thấy câu chuyện AI, khuyến nghị demo dạng AI-lite hoặc mock có kiểm soát dựa trên dữ liệu menu mẫu.

## 2. Use cases AI phù hợp
| Use case | Mô tả | Phase |
|---|---|---|
| Hỏi thông tin món | Thành phần, mức cay, phù hợp trẻ em, món chay | Phase 2 |
| Gợi ý món | Dựa trên nhu cầu: ăn nhẹ, ít cay, nhanh, healthy | Phase 2 |
| Upsell/cross-sell | Gợi ý đồ uống/món kèm phù hợp | Phase 2 |
| Hỗ trợ tìm kiếm | Chuyển câu hỏi tự nhiên thành filter menu | Phase 2 |
| AI-lite demo | Kịch bản gợi ý từ tags/menu có sẵn | Prototype tùy chọn |

## 3. Guardrails nghiệp vụ
| ID | Guardrail |
|---|---|
| AI-01 | AI chỉ trả lời dựa trên dữ liệu menu/quán được cung cấp. |
| AI-02 | AI không bịa giá, thành phần, tồn kho hoặc khuyến mãi. |
| AI-03 | AI không tự thêm món vào giỏ nếu khách chưa bấm xác nhận. |
| AI-04 | AI phải nói rõ khi không chắc hoặc dữ liệu menu thiếu. |
| AI-05 | AI không đưa lời khuyên y tế/dị ứng như kết luận chắc chắn; cần khuyến nghị hỏi nhân viên nếu nhạy cảm. |
| AI-06 | AI không gợi ý món `SOLD_OUT` như món có thể đặt. |

## 4. Knowledge schema đề xuất
| Field | Mục đích |
|---|---|
| `name` | Tên món |
| `category` | Nhóm món |
| `price` | Giá hiện hành |
| `description` | Mô tả ngắn |
| `ingredients` | Thành phần chính |
| `tags` | cay, chay, trẻ em, healthy, bestseller |
| `allergens` | Dị ứng nếu quán có dữ liệu |
| `options` | Size, topping, mức cay |
| `pairing_items` | Món/đồ uống gợi ý dùng kèm |
| `status` | ACTIVE/SOLD_OUT/HIDDEN |

## 5. Prompt system mẫu ở mức định hướng
```text
Bạn là trợ lý chọn món cho quán F&B. Chỉ trả lời dựa trên danh sách menu và dữ liệu món được cung cấp. Nếu thông tin không có trong dữ liệu, nói rằng bạn chưa có đủ thông tin và khuyến nghị khách hỏi nhân viên. Không tự tạo order. Khi gợi ý món, chỉ gợi ý món đang ACTIVE. Câu trả lời ngắn, thân thiện, ưu tiên giúp khách thêm món vào giỏ nếu phù hợp.
```

## 6. Response patterns
| Tình huống | Cách trả lời |
|---|---|
| Khách hỏi món không cay | Liệt kê 2-3 món ACTIVE có tag không cay/ít cay, kèm CTA xem món |
| Khách hỏi thành phần | Trả lời từ `ingredients`; nếu thiếu thì nói chưa có thông tin đầy đủ |
| Khách hỏi dị ứng | Không khẳng định tuyệt đối nếu dữ liệu allergen thiếu; khuyên hỏi nhân viên |
| Khách hỏi món bán chạy | Chỉ trả lời nếu có tag `bestseller` hoặc dữ liệu thống kê |
| Khách hỏi món đã SOLD_OUT | Nói món đang tạm hết và gợi ý món thay thế ACTIVE |

## 7. AI-lite cho prototype
Nếu cần demo nhanh, không nhất thiết tích hợp LLM thật. Có thể làm AI-lite bằng rule-based search:
| Input khách | Logic mock | Output demo |
|---|---|---|
| `món nào không cay?` | Lọc tags `không cay` hoặc không có tag `cay` | 2-3 món phù hợp |
| `món nào bán chạy?` | Lọc tag `bestseller` | Món bán chạy |
| `nên uống gì với bún bò?` | Dùng `pairing_items` | Trà đào/cà phê/nước ép |
| `món cho trẻ em?` | Lọc tag `trẻ em` | Gợi ý món dịu nhẹ |

## 8. API AI phase sau đề xuất
| Method | Endpoint | Mục đích |
|---|---|---|
| POST | `/api/public/ai/menu-chat` | Hỏi đáp/gợi ý món theo menu |
| GET | `/api/admin/ai/knowledge-check` | Kiểm tra món thiếu dữ liệu AI |
| POST | `/api/admin/ai/reindex-menu` | Cập nhật knowledge sau khi đổi menu |

Request mẫu:
```json
{
  "qrToken": "qr_table_05_xxx",
  "message": "Món nào không cay và phù hợp cho trẻ em?",
  "cartContext": [
    { "menuItemId": "item_01", "quantity": 1 }
  ]
}
```

Response mẫu:
```json
{
  "answer": "Bạn có thể thử Cơm gà xối mỡ hoặc Gỏi cuốn tôm. Hai món này dễ ăn và không có tag cay trong menu.",
  "suggestedItems": [
    { "menuItemId": "item_02", "name": "Cơm gà xối mỡ" },
    { "menuItemId": "item_05", "name": "Gỏi cuốn tôm" }
  ],
  "limitations": []
}
```

## 9. Evaluation checklist cho AI
| ID | Test |
|---|---|
| AI-QA-01 | Không gợi ý món tạm hết. |
| AI-QA-02 | Không bịa giá/thành phần khi dữ liệu thiếu. |
| AI-QA-03 | Gợi ý món kèm có trong menu và đang active. |
| AI-QA-04 | Câu trả lời ngắn, dễ hiểu trên mobile. |
| AI-QA-05 | Không tự tạo order; luôn yêu cầu khách xác nhận/add to cart. |
| AI-QA-06 | Câu hỏi dị ứng được trả lời thận trọng. |

## 10. Điều kiện nên bắt đầu AI thật
| Điều kiện | Lý do |
|---|---|
| Core ordering đã ổn | AI không cứu được flow order lỗi |
| Menu data đủ tags/ingredients | AI cần dữ liệu nền đáng tin |
| Có guardrails rõ | Tránh bịa thông tin món/tồn kho |
| Có UX vị trí AI hợp lý | AI không che mất CTA thêm món/chốt đơn |
| Có tracking hiệu quả | Đo AI có tăng conversion/average order value không |
