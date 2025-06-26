# Hướng Dẫn Chạy Project

## Yêu Cầu Công Cụ

Để chạy project này, bạn cần cài đặt:

- **Docker:** Môi trường container hóa. (Xem hướng dẫn cài đặt tại https://docs.docker.com/get-docker/)
- **Docker Compose:** Công cụ quản lý ứng dụng Docker đa container. (Thường đi kèm với Docker Desktop hoặc cài đặt riêng tại https://docs.docker.com/compose/install/)

## Cách Chạy Ứng Dụng

### Bước 1: Chuẩn bị
1. **Mở Terminal / Command Prompt** và điều hướng đến thư mục gốc của project.
2. **Cấu hình địa chỉ Backend:** Truy cập vào thư mục `Frontend` và chỉnh sửa file `.env` để cập nhật IP của Backend cho phù hợp với môi trường của bạn.

### Bước 2: Chạy ứng dụng

#### Trên Linux/macOS:
1. **Cấp quyền thực thi** cho tập lệnh khởi động:
   ```bash
   chmod +x start_services.sh
   ```

2. **Chạy tập lệnh**:
   ```bash
   ./start_services.sh
   ```

#### Trên Windows:
Thực hiện các lệnh sau theo thứ tự:

1. **Khởi động Backend:**
   ```cmd
   cd BackendTs
   docker-compose up --build -d
   cd ..
   ```

2. **Khởi động Frontend:**
   ```cmd
   cd Frontend
   docker-compose build fe_prod
   docker-compose up fe_prod
   ```

### Lưu ý
- Tập lệnh/lệnh sẽ tự động xây dựng và khởi động các dịch vụ backend và frontend bằng Docker Compose
- Quá trình này có thể mất một ít thời gian cho lần chạy đầu tiên
- Sau khi hoàn tất, các dịch vụ sẽ hoạt động và sẵn sàng để sử dụng