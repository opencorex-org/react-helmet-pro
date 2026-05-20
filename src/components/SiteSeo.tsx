"use client";

import type { OrganizationSchemaInput, WebSiteSchemaInput } from "../utils/schemaBuilder";
import { buildOrganizationSchema, buildWebSiteSchema } from "../utils/schemaBuilder";
import type { SeoProps } from "./Seo";
import { Seo } from "./Seo";

type PartialOrganizationSchemaInput = Omit<OrganizationSchemaInput, "name"> & {
  name?: string;
};

type PartialWebSiteSchemaInput = Omit<WebSiteSchemaInput, "name" | "url"> & {
  name?: string;
  url?: string;
};

export interface SiteSeoProps extends Omit<SeoProps, "jsonLd"> {
  alternateSiteName?: string | string[];
  jsonLd?: object | object[];
  organization?: PartialOrganizationSchemaInput;
  webSite?: PartialWebSiteSchemaInput;
}

const asArray = <T,>(value?: T | T[]) => {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

export const SiteSeo = ({
  alternateSiteName,
  canonical,
  description,
  jsonLd,
  locale,
  organization,
  siteName,
  title,
  webSite,
  ...props
}: SiteSeoProps) => {
  const structuredData: object[] = [];

  const webSiteName = webSite?.name ?? siteName;
  const webSiteUrl = webSite?.url ?? canonical;

  if (webSiteName && webSiteUrl) {
    structuredData.push(
      buildWebSiteSchema({
        alternateName: webSite?.alternateName ?? alternateSiteName,
        description: webSite?.description ?? description,
        inLanguage: webSite?.inLanguage ?? locale,
        name: webSiteName,
        url: webSiteUrl,
      }),
    );
  }

  const organizationName = organization?.name ?? siteName;

  if (organizationName) {
    structuredData.push(
      buildOrganizationSchema({
        ...organization,
        description: organization?.description ?? description,
        name: organizationName,
        url: organization?.url ?? canonical,
      }),
    );
  }

  return (
    <Seo
      {...props}
      canonical={canonical}
      description={description}
      jsonLd={[...structuredData, ...asArray(jsonLd)]}
      locale={locale}
      siteName={siteName}
      title={title}
    />
  );
};
