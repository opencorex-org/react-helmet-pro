export interface MetaTag {
    name?: string;
    content: string;
    property?: string;
}

export interface LinkTag {
    rel: string;
    href: string;
}

export interface ScriptTag {
    src: string;
    async?: boolean;
    defer?: boolean;
}

export interface HtmlAttributes {
    [key: string]: string;
}

export interface HelmetData {
    title?: string;
    meta?: MetaTag[];
    link?: LinkTag[];
    script?: ScriptTag[];
    htmlAttributes?: HtmlAttributes;
}

export interface HelmetContextType extends HelmetData {
    setHead: (data: HelmetData) => void;
}