# Sử dụng ảnh Node.js 20-alpine làm base image
FROM node:20-alpine

# Đặt thư mục làm việc mặc định bên trong container.
WORKDIR /app

# Copy các tệp cấu hình package (package.json và package-lock.json)
COPY package*.json ./

# Cài đặt tất cả các dependency của dự án.
RUN npm ci

# Copy toàn bộ mã nguồn của ứng dụng
COPY . .

# Mở cổng mà ứng dụng Node.js của bạn lắng nghe.
EXPOSE 3335

# Lệnh mặc định để chạy ứng dụng khi container khởi động.
# Không còn wait-for-it.sh nữa, ứng dụng chạy trực tiếp.
CMD ["npm", "run", "dev"]