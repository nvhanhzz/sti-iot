# Hướng Dẫn Chạy Project

## Yêu Cầu Công Cụ

Để chạy project này, bạn cần cài đặt:

- **Docker:** Môi trường container hóa. (Xem hướng dẫn cài đặt tại https://docs.docker.com/get-docker/)
- **Docker Compose:** Công cụ quản lý ứng dụng Docker đa container. (Thường đi kèm với Docker Desktop hoặc cài đặt riêng tại https://docs.docker.com/compose/install/)

## Cách Chạy Ứng Dụng

1. **Mở Terminal / Command Prompt** và điều hướng đến thư mục gốc của project.

2. **Cấu hình địa chỉ Backend:** Truy cập vào thư mục `Frontend` và chỉnh sửa file `.env` để cập nhật IP của Backend cho phù hợp với môi trường của bạn.

3. **Cấp quyền thực thi** cho tập lệnh khởi động (nếu chưa):

   ```bash
   chmod +x start_services.sh
   ```

4. **Chạy tập lệnh** để khởi động Backend và Frontend:

   ```bash
   ./start_services.sh
   ```

Tập lệnh sẽ tự động xây dựng và khởi động các dịch vụ backend và frontend bằng Docker Compose. Quá trình này có thể mất một ít thời gian cho lần chạy đầu tiên.

Sau khi tập lệnh hoàn tất, các dịch vụ của bạn sẽ hoạt động và sẵn sàng để sử dụng.