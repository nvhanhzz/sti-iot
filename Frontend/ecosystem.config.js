module.exports = {
    apps: [
        {
            name: 'vite-app',
            script: 'serve',
            args: '-s dist',  // Thêm tham số để chỉ định thư mục build
            env: {
                PM2_SERVE_PATH: './dist',  // Đảm bảo đường dẫn chính xác tới thư mục dist
                PM2_SERVE_PORT: 4041,      // Cổng mà ứng dụng sẽ chạy
                PM2_SERVE_SPA: 'true',     // Đảm bảo là SPA (Single Page Application)
                NODE_ENV: 'production',    // Thiết lập môi trường là production
            },
        },
    ],
};
