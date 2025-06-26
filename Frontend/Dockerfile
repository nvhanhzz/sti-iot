# --- Giai đoạn Build (Xây dựng ứng dụng React) ---
# Sử dụng image Node.js 20 Alpine để cài đặt dependencies và build ứng dụng
FROM node:20-alpine as builder

# Đặt thư mục làm việc bên trong container
WORKDIR /app

# Sao chép package.json và package-lock.json để tận dụng bộ nhớ cache của Docker
# Cài đặt các dependencies trước
COPY package.json package-lock.json ./
RUN npm install

# Đảm bảo các binary của npm (như tsc) có quyền thực thi
# Điều này giúp khắc phục lỗi "sh: tsc: Permission denied"
RUN chmod +x ./node_modules/.bin/tsc

# Sao chép toàn bộ mã nguồn còn lại của ứng dụng vào container
COPY . .

# Build ứng dụng React cho môi trường production
# Lệnh này sẽ chạy script 'build' trong package.json của bạn
RUN npm run build

# --- Giai đoạn Production (Phục vụ ứng dụng đã build bằng Nginx) ---
# Sử dụng image Nginx Alpine siêu nhỏ gọn để phục vụ các file tĩnh
FROM nginx:alpine

# Xóa file cấu hình Nginx mặc định để thay thế bằng cấu hình tùy chỉnh của chúng ta
RUN rm /etc/nginx/conf.d/default.conf

# Sao chép file cấu hình Nginx tùy chỉnh của bạn vào một vị trí tạm thời
# Chúng ta sẽ sử dụng envsubst để thay thế các biến môi trường sau
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Sao chép ứng dụng React đã được build (thư mục 'dist') từ giai đoạn 'builder'
# vào thư mục public của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Mở cổng 80 (cổng HTTP mặc định của Nginx)
EXPOSE 80

# Lệnh để chạy container:
# 1. Sử dụng envsubst để thay thế các biến môi trường trong file template Nginx
#    và ghi kết quả vào file cấu hình Nginx thực tế.
# 2. Sau đó, khởi động Nginx ở chế độ foreground.
CMD ["/bin/sh", "-c", "envsubst '${VITE_API_BASE_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]