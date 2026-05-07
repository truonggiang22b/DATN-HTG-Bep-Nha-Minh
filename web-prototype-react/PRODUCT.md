# Product

## Register

brand

## Users

Khách hàng chính: người dùng phổ thông từ 18–45 tuổi tại Việt Nam, truy cập qua điện thoại di động (mobile-first).
Hành vi điển hình: xem menu, chọn món, đặt hàng tại bàn hoặc online — thường trong bối cảnh đói bụng, vội vàng, hoặc đang ngồi tại nhà hàng.
Job to be done: nhanh chóng tìm thấy món ngon → thêm vào giỏ → thanh toán mà không bị cản trở.
Cảm xúc mục tiêu: tin tưởng ngay từ cái nhìn đầu tiên, thèm ăn khi nhìn menu, thoải mái khi đặt hàng.

## Product Purpose

Bếp Nhà Mình là hệ thống đặt món nhà hàng online tích hợp quản lý bếp (KDS).
Mục tiêu cốt lõi của phần customer-facing: biến landing page thành điểm hút traffic mạnh nhất — một trang đủ đẹp và đủ tin để khách hàng đặt món ngay lần đầu tiên nhìn vào, không cần được thuyết phục thêm.
Thành công = khách hàng hoàn thành đơn hàng đầu tiên trong vòng dưới 2 phút từ lúc vào trang.

## Brand Personality

Ấm áp — Nhanh nhẹn — Đáng tin

- **Ấm áp**: cảm giác như bữa ăn nhà, không sterile như fast food chain, không lạnh như SaaS dashboard.
- **Nhanh nhẹn**: giao diện phản hồi tức thì, micro-animation mượt mà, luồng đặt món không gián đoạn.
- **Đáng tin**: phân cấp thông tin rõ ràng, giá hiển thị minh bạch, không trick, không dark pattern.

Voice & Tone: thân thiện nhưng không bồng bột. Ngôn ngữ đơn giản, trực tiếp. Tiếng Việt gần gũi, không dịch máy.

## Anti-references

Không có anti-reference cụ thể từ người dùng.
Tránh nội tại các pattern AI-slop: purple gradient, cardocalypse, hero-metric template, glassmorphism trang trí vô nghĩa.
Tránh aesthetic của fast-food chain công nghiệp (đỏ-vàng chói, quá nhiều promo banner).
Tránh aesthetic SaaS dashboard lạnh lùng cho phần customer-facing.

## Design Principles

1. **Thèm ăn trước, mua sau** — Hình ảnh và màu sắc phải kích thích cảm giác muốn ăn ngay tức thì. Landing hero phải làm khách cảm thấy đói.
2. **Mỗi click là một bước nhỏ** — Luồng đặt món không bao giờ yêu cầu khách nghĩ nhiều hơn một việc tại một thời điểm. Progressive disclosure, không dump form.
3. **Ấm nhưng không rẻ** — Design dùng màu đất ấm (Rice, Paper, Soy, Chili) theo cách có kiểm soát, không neon, không quá nhiều màu cùng lúc. Cảm giác handcrafted, premium nhỏ.
4. **Landing page = salesperson số 1** — Mọi pixel trên landing đều phục vụ một mục tiêu: đưa khách vào menu và bấm "Đặt ngay" nhanh nhất có thể.
5. **Mobile-first không phải mobile-only** — Design từ 375px lên. Desktop là enhancement, không phải primary canvas.

## Accessibility & Inclusion

- Target: WCAG 2.1 AA minimum cho color contrast (đặc biệt text trên nền ấm).
- Font size tối thiểu 16px trên mobile.
- Touch target tối thiểu 44×44px cho tất cả interactive elements.
- Reduced motion: animation có thể tắt qua `prefers-reduced-motion`.
