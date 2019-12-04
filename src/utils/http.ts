export const isHttps = (url: string): boolean => {
    const u = new URL(url);
    if (u.protocol === 'https:') {
        return true;
    }
    if (u.protocol === 'http:') {
        return false;
    }
    throw new Error(`Unexpected protocol for URL: ${u.protocol}`);
};

export const isSuccessfulStatus = (httpStatus: number): boolean => httpStatus >= 200 && httpStatus < 300;
