export const getCookie = (name: string) => {
    const matches = document.cookie.match(
        //eslint-disable-next-line
        new RegExp('(?:^|; )' + name.replace(/([$?*|{}\[\]\\\/^])/g, '\\$1') + '=([^;]*)'),
    );
    return matches ? decodeURIComponent(matches[1]) : undefined;
};

export const getUrlForSocket = () => {
    return `${window.location.origin.replace(/^http/, 'ws')}/api/ws`;
};
