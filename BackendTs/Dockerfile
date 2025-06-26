# Sử dụng ảnh Node.js 20-alpine làm base image
FROM node:20-alpine

# Cài đặt bash vào container
# Alpine Linux sử dụng apk làm trình quản lý gói
RUN apk add --no-cache bash

# Đặt thư mục làm việc mặc định bên trong container.
WORKDIR /app

# Copy các tệp cấu hình package (package.json và package-lock.json)
COPY package*.json ./

# Cài đặt tất cả các dependency của dự án.
RUN npm ci

# Copy toàn bộ mã nguồn của ứng dụng
COPY . .

# Copy script wait-for-it.sh vào một vị trí trong PATH của container.
COPY wait-for-it.sh /usr/local/bin/wait-for-it.sh

# Cấp quyền thực thi cho script.
RUN chmod +x /usr/local/bin/wait-for-it.sh

# Mở cổng mà ứng dụng Node.js của bạn lắng nghe.
EXPOSE 3335

# Lệnh mặc định để chạy ứng dụng khi container khởi động.
# wait-for-it.sh giờ đây có thể chạy với bash một cách bình thường.
CMD ["/usr/local/bin/wait-for-it.sh", "mysql:3306", "--", \
     "/usr/local/bin/wait-for-it.sh", "emqx:1883", "--", \
     "npm", "run", "dev"]