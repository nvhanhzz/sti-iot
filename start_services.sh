#!/bin/bash

echo "Bắt đầu triển khai Backend..."
# Chuyển đến thư mục BackendTs
cd BackendTs

# Chạy Docker Compose cho Backend ở chế độ background
docker-compose up --build -d

# Kiểm tra mã thoát của lệnh trước
if [ $? -ne 0 ]; then
    echo "Lỗi khi khởi động Backend. Vui lòng kiểm tra Docker Compose logs."
    exit 1
fi

echo "Backend đã khởi động thành công. Chuyển sang Frontend..."

# Quay lại thư mục gốc của project
cd ..

# Chuyển đến thư mục Frontend
cd Frontend

echo "Bắt đầu xây dựng và khởi động Frontend..."

# Xây dựng image frontend cho môi trường sản xuất
docker-compose build fe_prod

# Kiểm tra mã thoát của lệnh trước
if [ $? -ne 0 ]; then
    echo "Lỗi khi xây dựng image Frontend. Vui lòng kiểm tra Docker Compose logs."
    exit 1
fi

# Khởi động dịch vụ frontend
docker-compose up fe_prod

# Kiểm tra mã thoát của lệnh trước
if [ $? -ne 0 ]; then
    echo "Lỗi khi khởi động Frontend. Vui lòng kiểm tra Docker Compose logs."
    exit 1
fi

echo "Frontend đã khởi động thành công."
echo "Tất cả các dịch vụ đã được triển khai."