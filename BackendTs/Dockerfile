FROM node:20-alpine

# Đặt thư mục làm việc bên trong container.
# Docker sẽ tự động tạo thư mục /app này trong container nếu chưa có.
WORKDIR /app

# Copy package.json và package-lock.json vào /app bên trong container
COPY package*.json ./

# Chạy npm ci trong /app của container
RUN npm ci

# Copy toàn bộ mã nguồn từ thư mục BackendTS (trên host)
# vào thư mục /app bên trong container
COPY . .

EXPOSE 3335

CMD ["npm", "run", "dev"]