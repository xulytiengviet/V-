# V++ Classroom Web IDE

Giao diện học lập trình V++ trên trình duyệt, phong cách Pascal / Norton Commander / MS-DOS, dành cho học sinh và giáo viên THCS–THPT.

## Tách bạch hai môi trường

- **Native V++** tại thư mục `src/` của repository: C++17, compiler, IR, bytecode VM, module, class, thư viện chuẩn. Tài liệu gốc tại `docs/language-reference.md`.
- **V++ Classroom VM** tại `web/vpp-core.mjs`: bộ thông dịch độc lập, giới hạn tài nguyên cho các bài học cơ bản. Không phải bytecode VM gốc và không bảo đảm tương thích đầy đủ. Hỗ trợ biến, số/chữ/logic, điều kiện if và chọn/ca, vòng lặp for, break/continue, hàm, tham số mặc định, đệ quy, danh sách, từ điển, phép toán, thử/bắt lỗi, ném ngoại lệ và một số hàm tích hợp.

## CVNSS4.0 audit-safe

Tài liệu được đóng gói từ hai tệp converter và audit manifest phiên bản 5.0.0-audit-safe do nhóm dự án cung cấp. Tệp nguồn nguyên bản đặt tại `web/vendor/`.

- Chạy `selfTest()` khi khởi tạo; yêu cầu 56 nhóm nhập nhằng, 5 va chạm quan trọng và 0 ghi đè bản đồ đảo âm thầm.
- Mặc định giữ **cú pháp tiếng Việt Unicode**. Chế độ CVNSS4.0 chỉ đổi từ khóa độc lập sang dạng có tiền tố `@` (ví dụ `@ham`), để không va chạm tên biến, không sửa chuỗi, chú thích hoặc định danh. Từ `chính` là tên hàm/identifier nên không chuyển tự động.
- CVNSS không có tính song ánh tổng quát: phải dùng quy tắc lựa chọn công khai, không tuyên bố vòng chuyển đổi mọi văn bản luôn không mất dữ liệu.

## Sử dụng

Mở `index.html` qua web server tĩnh ở thư mục gốc repository, ví dụ `python3 -m http.server 8000` rồi truy cập `http://localhost:8000/`. Không cần máy chủ ứng dụng và không gửi mã học sinh lên dịch vụ bên ngoài. Để chạy các phép thử: `node web/tests.mjs` (Node 20+).

## Giới hạn

Không thực thi mã nguồn người dùng qua JavaScript `eval` / `Function`. Trình chạy giới hạn bước lệnh, độ sâu lời gọi và dung lượng đầu ra, nhưng vẫn chạy trên luồng UI, nên không được xem đây là sandbox bảo mật tuyệt đối cho mã không tin cậy. Không hỗ trợ class, module import, filesystem, network, C FFI, package manager và bytecode. Các tính năng này thuộc compiler/runtime C++ gốc.

## Triển khai GitHub Pages

Giao diện đặt tại `index.html`, phù hợp với GitHub Pages cấu hình **Deploy from a branch** → `developer` → `/ (root)`. Nếu Pages chưa được bật, quản trị repo cần bật trong Settings → Pages. Một số cấu hình kho ưu tiên `GitHub Actions` thì cần workflow Pages riêng; việc chỉ thêm file không tự bật Pages.
