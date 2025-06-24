# Sử dụng ảnh Node.js 20-alpine làm base image
# Alpine là một bản phân phối Linux rất nhỏ, giúp giảm kích thước image cuối cùng.
FROM node:20-alpine

# Đặt thư mục làm việc mặc định bên trong container.
# Tất cả các lệnh tiếp theo sẽ được thực thi trong thư mục này.
WORKDIR /app

# Copy các tệp cấu hình package (package.json và package-lock.json) vào thư mục làm việc.
# Điều này giúp tận dụng Docker cache: nếu các tệp này không thay đổi,
# Docker sẽ không chạy lại 'npm ci', tiết kiệm thời gian build.
COPY package*.json ./

# Cài đặt tất cả các dependency của dự án.
# 'npm ci' được ưu tiên hơn 'npm install' trong môi trường CI/CD hoặc Docker build
# vì nó đảm bảo cài đặt các phiên bản chính xác như trong package-lock.json.
RUN npm ci

# Copy toàn bộ mã nguồn của ứng dụng vào thư mục làm việc trong container.
# Quan trọng: Đảm bảo bạn có tệp .dockerignore loại bỏ node_modules/ và các tệp không cần thiết.
COPY . .

# Nếu bạn đang sử dụng TypeScript, bạn cần biên dịch mã nguồn.
# Giả sử bạn có script 'build' trong package.json để biên dịch TS sang JS.
# Nếu bạn chạy trực tiếp bằng ts-node/nodemon trong môi trường dev, bạn có thể bỏ qua bước này.
# RUN npm run build

# Mở cổng mà ứng dụng Node.js của bạn lắng nghe.
# Thay thế 3335 bằng cổng thực tế mà ứng dụng của bạn sử dụng (ví dụ: 3000, 8080).
EXPOSE 3335

# Lệnh mặc định để chạy ứng dụng khi container khởi động.
# Sử dụng "npm run dev" như bạn đã có để phát triển.
# Nếu bạn đã có bước 'npm run build' và muốn chạy bản đã biên dịch,
# thì CMD có thể là ["node", "dist/main.js"] (hoặc đường dẫn tương tự).
CMD ["npm", "run", "dev"]