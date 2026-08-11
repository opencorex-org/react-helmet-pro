import type { ReactElement, ReactNode } from "react";
import type { HelmetSeoDefaults } from "./defaults";
import type { AuditHelmetStateOptions } from "./diagnostics";
import type {
  CrossOriginPolicy,
  ReferrerPolicy,
  SubresourceIntegrity,
} from "./subresourceIntegrity";
import type {
  JsonLdContent,
  NoscriptHtml,
  ScriptContent,
  StyleContent,
} from "../core/inlineContent";

export type HelmetAttributeValue = string | number | boolean | null | undefined;
export type HelmetAttributes = Record<string, HelmetAttributeValue>;

export interface MetaTag extends HelmetAttributes {
  charSet?: string;
  content?: string;
  httpEquiv?: string;
  itemProp?: string;
  key?: string;
  name?: string;
  property?: string;
}

export interface LinkTag extends HelmetAttributes {
  as?: string;
  crossOrigin?: CrossOriginPolicy;
  fetchPriority?: string;
  href?: string;
  imageSizes?: string;
  imageSrcSet?: string;
  integrity?: SubresourceIntegrity;
  key?: string;
  media?: string;
  nonce?: string;
  rel?: string;
  referrerPolicy?: ReferrerPolicy;
  sizes?: string;
  type?: string;
}

export interface ScriptTag extends HelmetAttributes {
  async?: boolean;
  crossOrigin?: CrossOriginPolicy;
  defer?: boolean;
  fetchPriority?: string;
  /** @deprecated Use scriptContent for JavaScript or jsonLd for structured data. */
  innerHTML?: string;
  /** Breakout-safe JSON produced by createJsonLdContent(). */
  jsonLd?: JsonLdContent;
  integrity?: SubresourceIntegrity;
  key?: string;
  nonce?: string;
  referrerPolicy?: ReferrerPolicy;
  /** Trusted executable source produced by createScriptContent(). */
  scriptContent?: ScriptContent;
  src?: string;
  tagPosition?: "head" | "bodyOpen" | "bodyClose";
  type?: string;
}

export interface StyleTag extends HelmetAttributes {
  /** @deprecated Use styleContent instead. */
  cssText?: string;
  key?: string;
  media?: string;
  nonce?: string;
  /** CSS source produced by createStyleContent(). */
  styleContent?: StyleContent;
  type?: string;
}

export interface NoscriptTag extends HelmetAttributes {
  /** Trusted HTML produced by createNoscriptHtml(). */
  htmlContent?: NoscriptHtml;
  /** @deprecated Use htmlContent instead. */
  innerHTML?: string;
  key?: string;
  tagPosition?: "head" | "bodyOpen" | "bodyClose";
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
  bodyCloseScripts?: ScriptTag[];
  bodyOpenScripts?: ScriptTag[];
  defaultTitle?: string;
  defer: boolean;
  encodeSpecialCharacters: boolean;
  htmlAttributes: HelmetAttributes;
  nonce?: string;
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
  bodyCloseScripts: HelmetServerTagAccessor<ScriptTag>;
  bodyOpenScripts: HelmetServerTagAccessor<ScriptTag>;
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
  /** @deprecated Unsafe opt-out is ignored by server serialization and will be removed in the next major version. */
  encodeSpecialCharacters?: boolean;
  helmetData?: HelmetDataContainer;
  htmlAttributes?: HelmetAttributes;
  link?: LinkTag[];
  meta?: MetaTag[];
  nonce?: string;
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
  auditOptions?: AuditHelmetStateOptions;
  children: ReactNode;
  context?: HelmetServerContext;
  defaults?: HelmetSeoDefaults;
  enableDevDiagnostics?: boolean;
  helmetData?: HelmetDataContainer;
  nonce?: string;
  onError?: (error: Error, info: { phase: "commit" | "callback" | "listener"; state?: HelmetState }) => void;
}

export interface HelmetContextValue extends HelmetState {
  defaults?: HelmetSeoDefaults;
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
