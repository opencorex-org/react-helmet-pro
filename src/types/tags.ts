import type { ReactElement, ReactNode } from "react";

export type HelmetAttributeValue = string | number | boolean | null | undefined;
export type HelmetAttributes = Record<string, HelmetAttributeValue>;

export interface MetaTag extends HelmetAttributes {
  charSet?: string;
  content?: string;
  httpEquiv?: string;
  itemProp?: string;
  name?: string;
  property?: string;
}

export interface LinkTag extends HelmetAttributes {
  href?: string;
  rel?: string;
}

export interface ScriptTag extends HelmetAttributes {
  async?: boolean;
  defer?: boolean;
  innerHTML?: string;
  src?: string;
  type?: string;
}

export interface StyleTag extends HelmetAttributes {
  cssText?: string;
  media?: string;
  type?: string;
}

export interface NoscriptTag extends HelmetAttributes {
  innerHTML?: string;
}

export interface BaseTag extends HelmetAttributes {
  href?: string;
  target?: string;
}

export interface HelmetTagCollection {
  base: BaseTag[];
  link: LinkTag[];
  meta: MetaTag[];
  noscript: NoscriptTag[];
  script: ScriptTag[];
  style: StyleTag[];
}

export interface HelmetState extends HelmetTagCollection {
  bodyAttributes: HelmetAttributes;
  defaultTitle?: string;
  defer: boolean;
  encodeSpecialCharacters: boolean;
  htmlAttributes: HelmetAttributes;
  prioritizeSeoTags: boolean;
  title?: string;
  titleAttributes: HelmetAttributes;
  titleTemplate?: string;
}

export type HelmetChangeHandler = (
  newState: HelmetState,
  addedTags: HelmetTagCollection,
  removedTags: HelmetTagCollection,
) => void;

export interface HelmetServerTagAccessor<T> {
  toComponent(): ReactElement | ReactElement[] | null;
  toString(): string;
}

export interface HelmetServerAttributeAccessor {
  toComponent(): HelmetAttributes;
  toString(): string;
}

export interface HelmetServerState {
  base: HelmetServerTagAccessor<BaseTag>;
  bodyAttributes: HelmetServerAttributeAccessor;
  htmlAttributes: HelmetServerAttributeAccessor;
  link: HelmetServerTagAccessor<LinkTag>;
  meta: HelmetServerTagAccessor<MetaTag>;
  noscript: HelmetServerTagAccessor<NoscriptTag>;
  priority: HelmetServerTagAccessor<MetaTag | LinkTag | ScriptTag>;
  script: HelmetServerTagAccessor<ScriptTag>;
  style: HelmetServerTagAccessor<StyleTag>;
  title: HelmetServerTagAccessor<{ title: string; attributes?: HelmetAttributes }>;
}

export interface HelmetServerContext {
  helmet?: HelmetServerState;
}

export interface HelmetDataContainer {
  context: HelmetServerContext;
  dispatcher: unknown;
}

export interface HelmetProps {
  base?: BaseTag;
  bodyAttributes?: HelmetAttributes;
  children?: ReactNode;
  defaultTitle?: string;
  defer?: boolean;
  encodeSpecialCharacters?: boolean;
  helmetData?: HelmetDataContainer;
  htmlAttributes?: HelmetAttributes;
  link?: LinkTag[];
  meta?: MetaTag[];
  noscript?: NoscriptTag[];
  onChangeClientState?: HelmetChangeHandler;
  prioritizeSeoTags?: boolean;
  script?: ScriptTag[];
  style?: StyleTag[];
  title?: string;
  titleAttributes?: HelmetAttributes;
  titleTemplate?: string;
}

export interface HelmetProviderProps {
  children: ReactNode;
  context?: HelmetServerContext;
}

export interface HelmetContextValue extends HelmetState {
  dispatcher: unknown;
  setHead: (data: Partial<HelmetProps>) => void;
}

export interface HelmetDescriptor extends HelmetState {
  onChangeClientState?: HelmetChangeHandler;
}

export interface HelmetInstance {
  data: HelmetDescriptor;
  order: number;
}
