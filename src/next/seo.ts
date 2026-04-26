import type {
  MaybeArray,
  NextAlternates,
  NextAlternatesInput,
  NextAppLinkTarget,
  NextAppLinkTargetInput,
  NextAppLinks,
  NextAppLinksInput,
  NextAppleWebApp,
  NextAppleWebAppInput,
  NextAppleWebAppStartupImage,
  NextAppleWebAppStartupImageValue,
  NextAuthor,
  NextAuthorInput,
  NextIcon,
  NextIconDescriptor,
  NextIconDescriptorInput,
  NextIconInput,
  NextIcons,
  NextIconsInput,
  NextManifest,
  NextManifestIcon,
  NextManifestIconInput,
  NextManifestInput,
  NextManifestScreenshot,
  NextManifestScreenshotInput,
  NextManifestShortcut,
  NextManifestShortcutInput,
  NextMetadata,
  NextMetadataInput,
  NextOpenGraph,
  NextOpenGraphInput,
  NextOpenGraphMedia,
  NextOpenGraphMediaInput,
  NextOpenGraphMediaValue,
  NextRobotsMeta,
  NextRobotsRoute,
  NextRobotsRouteInput,
  NextRobotsRule,
  NextRobotsRuleInput,
  NextSitemapAlternates,
  NextSitemapAlternatesInput,
  NextSitemapEntry,
  NextSitemapEntryInput,
  NextThemeColorDescriptor,
  NextThemeColorValue,
  NextTitleConfig,
  NextTwitter,
  NextTwitterInput,
  NextVerification,
  NextVerificationInput,
  NextViewport,
  NextViewportInput,
  SerializableValue,
  UrlInput,
} from "./types";

const asArray = <T>(value?: MaybeArray<T>): T[] => {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const compactObject = <T extends Record<string, unknown>>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;

const toUrlString = (value: UrlInput) => value.toString();

const toUrlObject = (value: UrlInput) =>
  value instanceof URL ? value : new URL(value);

const normalizeUrlMap = (value?: Record<string, UrlInput>) => {
  if (!value) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [key, toUrlString(entryValue)]),
  );
};

const normalizeUrlList = (value?: UrlInput[]) =>
  value && value.length ? value.map(toUrlString) : undefined;

const normalizeTitle = ({
  absoluteTitle,
  defaultTitle,
  title,
  titleTemplate,
}: Pick<
  NextMetadataInput,
  "absoluteTitle" | "defaultTitle" | "title" | "titleTemplate"
>): NextMetadata["title"] => {
  if (!absoluteTitle && !defaultTitle && !titleTemplate) {
    return title;
  }

  const nextTitle: NextTitleConfig = compactObject({
    absolute: absoluteTitle,
    default: defaultTitle ?? title,
    template: titleTemplate,
  });

  return Object.keys(nextTitle).length ? nextTitle : undefined;
};

const normalizeAuthors = (
  value?: Array<string | NextAuthorInput>,
): NextAuthor[] | undefined => {
  if (!value?.length) {
    return undefined;
  }

  return value.map((author) =>
    typeof author === "string"
      ? { name: author }
      : compactObject({
          name: author.name,
          url: author.url ? toUrlString(author.url) : undefined,
        }),
  );
};

const normalizeAlternates = (
  value?: NextAlternatesInput,
): NextAlternates | undefined => {
  if (!value) {
    return undefined;
  }

  return compactObject({
    canonical: value.canonical ? toUrlString(value.canonical) : undefined,
    languages: normalizeUrlMap(value.languages),
    media: value.media,
    types: normalizeUrlMap(value.types),
  });
};

const normalizeVerification = (
  value?: NextVerificationInput,
): NextVerification | undefined => {
  if (!value) {
    return undefined;
  }

  return compactObject({
    google: value.google,
    me: value.me ? asArray(value.me) : undefined,
    other: value.other
      ? Object.fromEntries(
          Object.entries(value.other).map(([key, entryValue]) => [key, asArray(entryValue)]),
        )
      : undefined,
    yahoo: value.yahoo,
    yandex: value.yandex,
  });
};

const normalizeRobotsMeta = (value?: NextRobotsMeta): NextRobotsMeta | undefined => {
  if (!value) {
    return undefined;
  }

  return compactObject(value);
};

const normalizeIcon = (value: NextIconInput): NextIcon => {
  if (typeof value === "string" || value instanceof URL) {
    return toUrlString(value);
  }

  return compactObject({
    color: value.color,
    media: value.media,
    rel: value.rel,
    sizes: value.sizes,
    type: value.type,
    url: toUrlString(value.url),
  });
};

const normalizeIconDescriptor = (
  value: NextIconDescriptorInput,
): NextIconDescriptor =>
  compactObject({
    color: value.color,
    media: value.media,
    rel: value.rel,
    sizes: value.sizes,
    type: value.type,
    url: toUrlString(value.url),
  });

const normalizeIcons = (value?: NextIconsInput): NextIcons | undefined => {
  if (!value) {
    return undefined;
  }

  return compactObject({
    apple: value.apple ? asArray(value.apple).map(normalizeIcon) : undefined,
    icon: value.icon ? asArray(value.icon).map(normalizeIcon) : undefined,
    other: value.other ? asArray(value.other).map(normalizeIconDescriptor) : undefined,
    shortcut: value.shortcut ? asArray(value.shortcut).map(normalizeIcon) : undefined,
  });
};

const normalizeOpenGraphMedia = (
  value: NextOpenGraphMediaValue,
): string | NextOpenGraphMedia => {
  if (typeof value === "string" || value instanceof URL) {
    return toUrlString(value);
  }

  return compactObject({
    alt: value.alt,
    height: value.height,
    secureUrl: value.secureUrl ? toUrlString(value.secureUrl) : undefined,
    type: value.type,
    url: toUrlString(value.url),
    width: value.width,
  });
};

const normalizeOpenGraph = (
  value?: NextOpenGraphInput,
): NextOpenGraph | undefined => {
  if (!value) {
    return undefined;
  }

  return compactObject({
    alternateLocale: value.alternateLocale,
    audio: value.audio ? asArray(value.audio).map(normalizeOpenGraphMedia) : undefined,
    description: value.description,
    images: value.images ? asArray(value.images).map(normalizeOpenGraphMedia) : undefined,
    locale: value.locale,
    siteName: value.siteName,
    title: value.title,
    type: value.type,
    url: value.url ? toUrlString(value.url) : undefined,
    videos: value.videos ? asArray(value.videos).map(normalizeOpenGraphMedia) : undefined,
  });
};

const normalizeTwitter = (value?: NextTwitterInput): NextTwitter | undefined => {
  if (!value) {
    return undefined;
  }

  return compactObject({
    card: value.card,
    creator: value.creator,
    creatorId: value.creatorId,
    description: value.description,
    images: value.images ? asArray(value.images).map(normalizeOpenGraphMedia) : undefined,
    site: value.site,
    siteId: value.siteId,
    title: value.title,
  });
};

const normalizeAppleStartupImage = (
  value: NextAppleWebAppStartupImageValue,
): string | NextAppleWebAppStartupImage => {
  if (typeof value === "string" || value instanceof URL) {
    return toUrlString(value);
  }

  return compactObject({
    media: value.media,
    url: toUrlString(value.url),
  });
};

const normalizeAppleWebApp = (
  value?: NextAppleWebAppInput,
): NextAppleWebApp | undefined => {
  if (!value) {
    return undefined;
  }

  return compactObject({
    capable: value.capable,
    startupImage: value.startupImage
      ? asArray(value.startupImage).map(normalizeAppleStartupImage)
      : undefined,
    statusBarStyle: value.statusBarStyle,
    title: value.title,
  });
};

const normalizeAppLinkTarget = (
  value: NextAppLinkTargetInput,
): NextAppLinkTarget =>
  compactObject({
    appName: value.appName,
    package: value.package,
    shouldFallback: value.shouldFallback,
    url: toUrlString(value.url),
  });

const normalizeAppLinks = (value?: NextAppLinksInput): NextAppLinks | undefined => {
  if (!value) {
    return undefined;
  }

  return compactObject({
    android: value.android ? asArray(value.android).map(normalizeAppLinkTarget) : undefined,
    ios: value.ios ? asArray(value.ios).map(normalizeAppLinkTarget) : undefined,
    ipad: value.ipad ? asArray(value.ipad).map(normalizeAppLinkTarget) : undefined,
    iphone: value.iphone ? asArray(value.iphone).map(normalizeAppLinkTarget) : undefined,
    web: value.web ? asArray(value.web).map(normalizeAppLinkTarget) : undefined,
    windows: value.windows ? asArray(value.windows).map(normalizeAppLinkTarget) : undefined,
    windowsPhone: value.windowsPhone
      ? asArray(value.windowsPhone).map(normalizeAppLinkTarget)
      : undefined,
    windowsUniversal: value.windowsUniversal
      ? asArray(value.windowsUniversal).map(normalizeAppLinkTarget)
      : undefined,
  });
};

const normalizeThemeColor = (
  value?: NextThemeColorValue,
): NextViewport["themeColor"] => {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  const entries = (Array.isArray(value) ? value : [value]).map((entry) =>
    compactObject({
      color: entry.color,
      media: entry.media,
    }),
  );

  return entries;
};

const normalizeSitemapAlternates = (
  value?: NextSitemapAlternatesInput,
): NextSitemapAlternates | undefined => {
  if (!value) {
    return undefined;
  }

  return compactObject({
    languages: normalizeUrlMap(value.languages),
  });
};

const normalizeManifestIcon = (value: NextManifestIconInput): NextManifestIcon =>
  compactObject({
    purpose: value.purpose,
    sizes: value.sizes,
    src: toUrlString(value.src),
    type: value.type,
  });

const normalizeManifestScreenshot = (
  value: NextManifestScreenshotInput,
): NextManifestScreenshot =>
  compactObject({
    form_factor: value.form_factor,
    label: value.label,
    platform: value.platform,
    sizes: value.sizes,
    src: toUrlString(value.src),
    type: value.type,
  });

const normalizeManifestShortcut = (
  value: NextManifestShortcutInput,
): NextManifestShortcut =>
  compactObject({
    description: value.description,
    icons: value.icons?.map(normalizeManifestIcon),
    name: value.name,
    short_name: value.short_name,
    url: toUrlString(value.url),
  });

const normalizeRobotsRule = (value: NextRobotsRuleInput): NextRobotsRule =>
  compactObject({
    allow: value.allow
      ? Array.isArray(value.allow)
        ? value.allow
        : value.allow
      : undefined,
    crawlDelay: value.crawlDelay,
    disallow: value.disallow
      ? Array.isArray(value.disallow)
        ? value.disallow
        : value.disallow
      : undefined,
    userAgent: value.userAgent
      ? Array.isArray(value.userAgent)
        ? value.userAgent
        : value.userAgent
      : undefined,
  });

export const buildNextMetadata = (value: NextMetadataInput): NextMetadata =>
  compactObject({
    alternates: normalizeAlternates(value.alternates),
    appLinks: normalizeAppLinks(value.appLinks),
    appleWebApp: normalizeAppleWebApp(value.appleWebApp),
    applicationName: value.applicationName,
    archives: normalizeUrlList(value.archives),
    assets: normalizeUrlList(value.assets),
    authors: normalizeAuthors(value.authors),
    bookmarks: normalizeUrlList(value.bookmarks),
    category: value.category,
    classification: value.classification,
    creator: value.creator,
    description: value.description,
    formatDetection: value.formatDetection,
    icons: normalizeIcons(value.icons),
    keywords: value.keywords?.length ? value.keywords : undefined,
    manifest: value.manifest ? toUrlString(value.manifest) : undefined,
    metadataBase: value.metadataBase ? toUrlObject(value.metadataBase) : undefined,
    openGraph: normalizeOpenGraph(value.openGraph),
    other: value.other,
    publisher: value.publisher,
    referrer: value.referrer,
    robots: normalizeRobotsMeta(value.robots),
    title: normalizeTitle(value),
    twitter: normalizeTwitter(value.twitter),
    verification: normalizeVerification(value.verification),
  });

export const buildNextViewport = (value: NextViewportInput): NextViewport =>
  compactObject({
    colorScheme: value.colorScheme,
    initialScale: value.initialScale,
    interactiveWidget: value.interactiveWidget,
    maximumScale: value.maximumScale,
    minimumScale: value.minimumScale,
    themeColor: normalizeThemeColor(value.themeColor),
    userScalable: value.userScalable,
    viewportFit: value.viewportFit,
    width: value.width,
  });

export const buildNextRobots = (
  value: NextRobotsRouteInput,
): NextRobotsRoute =>
  compactObject({
    host: value.host ? toUrlString(value.host) : undefined,
    rules: Array.isArray(value.rules)
      ? value.rules.map(normalizeRobotsRule)
      : normalizeRobotsRule(value.rules),
    sitemap: Array.isArray(value.sitemap)
      ? value.sitemap.map(toUrlString)
      : value.sitemap
        ? toUrlString(value.sitemap)
        : undefined,
  });

export const buildNextSitemap = (
  entries: NextSitemapEntryInput[],
): NextSitemapEntry[] =>
  entries.map((entry) =>
    compactObject({
      alternates: normalizeSitemapAlternates(entry.alternates),
      changeFrequency: entry.changeFrequency,
      images: normalizeUrlList(entry.images),
      lastModified: entry.lastModified,
      priority: entry.priority,
      url: toUrlString(entry.url),
    }),
  );

export const buildNextManifest = (value: NextManifestInput): NextManifest =>
  compactObject({
    background_color: value.background_color,
    categories: value.categories,
    description: value.description,
    display: value.display,
    icons: value.icons?.map(normalizeManifestIcon),
    id: value.id,
    lang: value.lang,
    name: value.name,
    orientation: value.orientation,
    screenshots: value.screenshots?.map(normalizeManifestScreenshot),
    short_name: value.short_name,
    shortcuts: value.shortcuts?.map(normalizeManifestShortcut),
    start_url: value.start_url ? toUrlString(value.start_url) : undefined,
    theme_color: value.theme_color,
  });
