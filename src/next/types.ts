export type UrlInput = string | URL;
export type MaybeArray<T> = T | T[];
export type SerializableScalar = string | number | boolean;
export type SerializableValue = SerializableScalar | SerializableScalar[];

export interface NextTitleConfig {
  absolute?: string;
  default?: string;
  template?: string;
}

export interface NextAuthorInput {
  name: string;
  url?: UrlInput;
}

export interface NextAuthor {
  name: string;
  url?: string;
}

export interface NextAlternatesInput {
  canonical?: UrlInput;
  languages?: Record<string, UrlInput>;
  media?: Record<string, string>;
  types?: Record<string, UrlInput>;
}

export interface NextAlternates {
  canonical?: string;
  languages?: Record<string, string>;
  media?: Record<string, string>;
  types?: Record<string, string>;
}

export interface NextRobotsDirectives {
  [key: string]: string | number | boolean | undefined;
}

export interface NextRobotsMeta {
  follow?: boolean;
  googleBot?: NextRobotsDirectives;
  index?: boolean;
  [key:
    string]:
    | string
    | number
    | boolean
    | NextRobotsDirectives
    | undefined;
}

export interface NextIconDescriptorInput {
  color?: string;
  media?: string;
  rel?: string;
  sizes?: string;
  type?: string;
  url: UrlInput;
}

export interface NextIconDescriptor {
  color?: string;
  media?: string;
  rel?: string;
  sizes?: string;
  type?: string;
  url: string;
}

export type NextIconInput = UrlInput | NextIconDescriptorInput;
export type NextIcon = string | NextIconDescriptor;

export interface NextIconsInput {
  apple?: MaybeArray<NextIconInput>;
  icon?: MaybeArray<NextIconInput>;
  other?: MaybeArray<NextIconDescriptorInput>;
  shortcut?: MaybeArray<NextIconInput>;
}

export interface NextIcons {
  apple?: NextIcon[];
  icon?: NextIcon[];
  other?: NextIconDescriptor[];
  shortcut?: NextIcon[];
}

export interface NextOpenGraphMediaInput {
  alt?: string;
  height?: number;
  secureUrl?: UrlInput;
  type?: string;
  url: UrlInput;
  width?: number;
}

export interface NextOpenGraphMedia {
  alt?: string;
  height?: number;
  secureUrl?: string;
  type?: string;
  url: string;
  width?: number;
}

export type NextOpenGraphMediaValue = UrlInput | NextOpenGraphMediaInput;

export interface NextOpenGraphInput {
  audio?: MaybeArray<NextOpenGraphMediaValue>;
  description?: string;
  images?: MaybeArray<NextOpenGraphMediaValue>;
  locale?: string;
  alternateLocale?: string[];
  siteName?: string;
  title?: string;
  type?: string;
  url?: UrlInput;
  videos?: MaybeArray<NextOpenGraphMediaValue>;
}

export interface NextOpenGraph {
  audio?: Array<string | NextOpenGraphMedia>;
  description?: string;
  images?: Array<string | NextOpenGraphMedia>;
  locale?: string;
  alternateLocale?: string[];
  siteName?: string;
  title?: string;
  type?: string;
  url?: string;
  videos?: Array<string | NextOpenGraphMedia>;
}

export interface NextTwitterInput {
  card?: string;
  creator?: string;
  description?: string;
  images?: MaybeArray<NextOpenGraphMediaValue>;
  site?: string;
  siteId?: string;
  creatorId?: string;
  title?: string;
}

export interface NextTwitter {
  card?: string;
  creator?: string;
  creatorId?: string;
  description?: string;
  images?: Array<string | NextOpenGraphMedia>;
  site?: string;
  siteId?: string;
  title?: string;
}

export interface NextVerificationInput {
  google?: string;
  me?: MaybeArray<string>;
  other?: Record<string, MaybeArray<string>>;
  yahoo?: string;
  yandex?: string;
}

export interface NextVerification {
  google?: string;
  me?: string[];
  other?: Record<string, string[]>;
  yahoo?: string;
  yandex?: string;
}

export interface NextAppleWebAppStartupImageInput {
  media?: string;
  url: UrlInput;
}

export interface NextAppleWebAppStartupImage {
  media?: string;
  url: string;
}

export type NextAppleWebAppStartupImageValue =
  | UrlInput
  | NextAppleWebAppStartupImageInput;

export interface NextAppleWebAppInput {
  capable?: boolean;
  startupImage?: MaybeArray<NextAppleWebAppStartupImageValue>;
  statusBarStyle?: "black" | "black-translucent" | "default";
  title?: string;
}

export interface NextAppleWebApp {
  capable?: boolean;
  startupImage?: Array<string | NextAppleWebAppStartupImage>;
  statusBarStyle?: "black" | "black-translucent" | "default";
  title?: string;
}

export interface NextAppLinkTargetInput {
  appName?: string;
  package?: string;
  shouldFallback?: boolean;
  url: UrlInput;
}

export interface NextAppLinkTarget {
  appName?: string;
  package?: string;
  shouldFallback?: boolean;
  url: string;
}

export interface NextAppLinksInput {
  android?: MaybeArray<NextAppLinkTargetInput>;
  ios?: MaybeArray<NextAppLinkTargetInput>;
  ipad?: MaybeArray<NextAppLinkTargetInput>;
  iphone?: MaybeArray<NextAppLinkTargetInput>;
  web?: MaybeArray<NextAppLinkTargetInput>;
  windows?: MaybeArray<NextAppLinkTargetInput>;
  windowsPhone?: MaybeArray<NextAppLinkTargetInput>;
  windowsUniversal?: MaybeArray<NextAppLinkTargetInput>;
}

export interface NextAppLinks {
  android?: NextAppLinkTarget[];
  ios?: NextAppLinkTarget[];
  ipad?: NextAppLinkTarget[];
  iphone?: NextAppLinkTarget[];
  web?: NextAppLinkTarget[];
  windows?: NextAppLinkTarget[];
  windowsPhone?: NextAppLinkTarget[];
  windowsUniversal?: NextAppLinkTarget[];
}

export interface NextFormatDetection {
  address?: boolean;
  date?: boolean;
  email?: boolean;
  telephone?: boolean;
  url?: boolean;
}

export interface NextMetadataInput {
  alternates?: NextAlternatesInput;
  appLinks?: NextAppLinksInput;
  appleWebApp?: NextAppleWebAppInput;
  applicationName?: string;
  archives?: UrlInput[];
  assets?: UrlInput[];
  authors?: Array<string | NextAuthorInput>;
  bookmarks?: UrlInput[];
  category?: string;
  classification?: string;
  creator?: string;
  defaultTitle?: string;
  description?: string;
  formatDetection?: NextFormatDetection;
  icons?: NextIconsInput;
  keywords?: string[];
  manifest?: UrlInput;
  metadataBase?: UrlInput;
  openGraph?: NextOpenGraphInput;
  other?: Record<string, SerializableValue>;
  publisher?: string;
  referrer?: string;
  robots?: NextRobotsMeta;
  title?: string;
  titleTemplate?: string;
  absoluteTitle?: string;
  twitter?: NextTwitterInput;
  verification?: NextVerificationInput;
}

export interface NextMetadata {
  alternates?: NextAlternates;
  appLinks?: NextAppLinks;
  appleWebApp?: NextAppleWebApp;
  applicationName?: string;
  archives?: string[];
  assets?: string[];
  authors?: NextAuthor[];
  bookmarks?: string[];
  category?: string;
  classification?: string;
  creator?: string;
  description?: string;
  formatDetection?: NextFormatDetection;
  icons?: NextIcons;
  keywords?: string[];
  manifest?: string;
  metadataBase?: URL;
  openGraph?: NextOpenGraph;
  other?: Record<string, SerializableValue>;
  publisher?: string;
  referrer?: string;
  robots?: NextRobotsMeta;
  title?: string | NextTitleConfig;
  twitter?: NextTwitter;
  verification?: NextVerification;
}

export interface NextThemeColorDescriptor {
  color: string;
  media?: string;
}

export type NextThemeColorValue =
  | string
  | NextThemeColorDescriptor
  | NextThemeColorDescriptor[];

export interface NextViewportInput {
  colorScheme?: string;
  initialScale?: number;
  interactiveWidget?: "overlays-content" | "resizes-content" | "resizes-visual";
  maximumScale?: number;
  minimumScale?: number;
  themeColor?: NextThemeColorValue;
  userScalable?: boolean;
  viewportFit?: "auto" | "contain" | "cover";
  width?: number | string;
}

export interface NextViewport {
  colorScheme?: string;
  initialScale?: number;
  interactiveWidget?: "overlays-content" | "resizes-content" | "resizes-visual";
  maximumScale?: number;
  minimumScale?: number;
  themeColor?: string | NextThemeColorDescriptor[];
  userScalable?: boolean;
  viewportFit?: "auto" | "contain" | "cover";
  width?: number | string;
}

export interface NextRobotsRuleInput {
  allow?: MaybeArray<string>;
  crawlDelay?: number;
  disallow?: MaybeArray<string>;
  userAgent?: MaybeArray<string>;
}

export interface NextRobotsRule {
  allow?: string | string[];
  crawlDelay?: number;
  disallow?: string | string[];
  userAgent?: string | string[];
}

export interface NextRobotsRouteInput {
  host?: UrlInput;
  rules: NextRobotsRuleInput | NextRobotsRuleInput[];
  sitemap?: UrlInput | UrlInput[];
}

export interface NextRobotsRoute {
  host?: string;
  rules: NextRobotsRule | NextRobotsRule[];
  sitemap?: string | string[];
}

export type NextSitemapChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface NextSitemapAlternatesInput {
  languages?: Record<string, UrlInput>;
}

export interface NextSitemapAlternates {
  languages?: Record<string, string>;
}

export interface NextSitemapEntryInput {
  alternates?: NextSitemapAlternatesInput;
  changeFrequency?: NextSitemapChangeFrequency;
  images?: UrlInput[];
  lastModified?: Date | string;
  priority?: number;
  url: UrlInput;
}

export interface NextSitemapEntry {
  alternates?: NextSitemapAlternates;
  changeFrequency?: NextSitemapChangeFrequency;
  images?: string[];
  lastModified?: Date | string;
  priority?: number;
  url: string;
}

export interface NextManifestIconInput {
  purpose?: string;
  sizes?: string;
  src: UrlInput;
  type?: string;
}

export interface NextManifestIcon {
  purpose?: string;
  sizes?: string;
  src: string;
  type?: string;
}

export interface NextManifestScreenshotInput {
  form_factor?: "narrow" | "wide";
  label?: string;
  platform?: string;
  sizes?: string;
  src: UrlInput;
  type?: string;
}

export interface NextManifestScreenshot {
  form_factor?: "narrow" | "wide";
  label?: string;
  platform?: string;
  sizes?: string;
  src: string;
  type?: string;
}

export interface NextManifestShortcutInput {
  description?: string;
  icons?: NextManifestIconInput[];
  name: string;
  short_name?: string;
  url: UrlInput;
}

export interface NextManifestShortcut {
  description?: string;
  icons?: NextManifestIcon[];
  name: string;
  short_name?: string;
  url: string;
}

export interface NextManifestInput {
  background_color?: string;
  categories?: string[];
  description?: string;
  display?: string;
  icons?: NextManifestIconInput[];
  id?: string;
  lang?: string;
  name: string;
  orientation?: string;
  screenshots?: NextManifestScreenshotInput[];
  short_name?: string;
  shortcuts?: NextManifestShortcutInput[];
  start_url?: UrlInput;
  theme_color?: string;
}

export interface NextManifest {
  background_color?: string;
  categories?: string[];
  description?: string;
  display?: string;
  icons?: NextManifestIcon[];
  id?: string;
  lang?: string;
  name: string;
  orientation?: string;
  screenshots?: NextManifestScreenshot[];
  short_name?: string;
  shortcuts?: NextManifestShortcut[];
  start_url?: string;
  theme_color?: string;
}
