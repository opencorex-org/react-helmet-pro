export const updateTag = (type: string, props: any): HTMLElement => {
    const tag = document.createElement(type);
    Object.keys(props).forEach((key) => {
        if (key === 'children') tag.textContent = props[key];
        else tag.setAttribute(key, props[key]);
    });
    document.head.appendChild(tag);
    return tag;
};