const cache: { [key: string]: any } = {};

// Hàm lưu vào cache
export const setCache = (key: string, value: any, ttl = 3600) => {
    cache[key] = {
        value,
        expiry: Date.now() + ttl * 1000, // Tính thời gian hết hạn
    };
};

// Hàm lấy dữ liệu từ cache
export const getCache = (key: string) => {
    const data = cache[key];
    if (!data) return null; // Không có dữ liệu
    if (Date.now() > data.expiry) {
        delete cache[key]; // Hết hạn thì xóa
        return null;
    }
    return data.value;
};

// Hàm xóa cache
export const delCache = (key: string) => {
    delete cache[key];
};