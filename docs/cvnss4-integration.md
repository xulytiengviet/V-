# Đặc tả tích hợp V++ và CVNSS4.0

## Mục tiêu

V++ là ngôn ngữ nguồn tiếng Việt Unicode. CVNSS4.0 là **lớp gõ/biểu diễn từ khóa tùy chọn**, không thay thế ngữ pháp ngôn ngữ, không thay đổi tên chương trình hoặc hằng chuỗi của học sinh. Dự án hiện có compiler/VM C++ độc lập. Web IDE là bản học tập với ngữ pháp giới hạn và không thay thế compiler gốc.

## Nguyên tắc chuẩn hóa

1. Unicode source là nguồn chân lý; chuẩn hóa NFC tại ranh giới đầu vào.
2. Converter gốc v5 audit-safe không được đổi các chính sách ưu tiên: 758 base rows, 336 patch entries, 56 ambiguity groups, 5 critical collisions, 0 silent overwrites.
3. Chế độ CVNSS không dịch mã theo toàn văn bản: chỉ thay các token thuộc danh sách alias cố định bằng cú pháp đánh dấu `@` + mã CVNSS4.0, ví dụ `@ham`; đánh dấu là ranh giới cú pháp nhằm tránh các tên biến trùng mã, bỏ qua literal, comment và tên định danh. Trường hợp khác nhau giữa parser V++ và bộ gõ cần bổ sung test trước khi mở rộng.
4. Với trường hợp nhập nhằng, việc đảo CVNSS thành tiếng Việt toàn văn bản không bảo đảm hoàn nguyên 100%. Mã biên dịch không được dựa trên diễn giải đảo tự do. Dùng dictionary hạn chế theo **vai trò từ khóa**, không theo mọi âm tiết.
5. Native compiler phải có một lớp lexer/token adapter dùng chung bảng alias đã kiểm toán trước khi hỗ trợ trực tiếp mode CVNSS ở CLI. Web mode hiện chỉ là thử nghiệm của lớp học.

## Ví dụ

```vi
hàm chính() {
  in "Xin chào V++!";
  lặp(i = 1; i <= 3; i++) {
    in i;
  };
};
```

Bật chế độ CVNSS4.0 trên Web IDE sẽ thay các **từ khóa** `hàm`, `lặp`, v.v., theo converter kèm tiền tố `@`, giữ `chính` và toàn bộ nội dung chuỗi như cũ. Khi chạy, từ khóa được chuyển về biểu diễn chuẩn trước khi phân tích cú pháp.

## Lộ trình xác minh giáo dục

- Mốc 1: kiểm thử bảng từ khóa và mọi nhóm nhập nhằng converter; kiểm tra hồi quy sau mỗi cập nhật.
- Mốc 2: chuẩn hóa một đặc tả ngữ pháp được compiler C++ và Web IDE chia sẻ; xây dựng golden tests.
- Mốc 3: gợi ý lỗi bằng tiếng Việt, mô phỏng từng bước vòng lặp, bảng biến, công cụ ra đề và chấm bài.
- Mốc 4: thử nghiệm có đồng thuận với giáo viên THCS/THPT và khảo sát tính dễ học so với Python/C++ trên bài tương đương.

Mọi tuyên bố về hiệu quả học tập cần đo bằng thực nghiệm. Không thu thập mã riêng tư, tên học sinh hay bài kiểm tra vào hệ thống phân tích mà không có sự cho phép phù hợp.
