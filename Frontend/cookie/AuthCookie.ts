import Cookies from "js-cookie";

// Lưu JWT vào Cookie
export const setAuthToken = (token: string): void => {
    Cookies.set("authToken", token, {
        path: "/",
        secure: false,
        sameSite: "strict",
        expires: 1
    });
};

export const clearAuthToken = (): void => {
    Cookies.remove("authToken", { path: "/" });
};
export const getAuthToken = (): string | undefined => {
    return Cookies.get("authToken");
};

export const setAuthCookie = (name: string, token: string): void => {
    Cookies.set(name, token, {
        path: "/",
        secure: false,
        sameSite: "strict",
        expires: 1
    });
};

export const getAuthCookie = (name: string): string | undefined => {
    return Cookies.get(name);
};
export const clearAuthCookie = (name: string): void => {
    Cookies.remove(name, { path: "/" });
};