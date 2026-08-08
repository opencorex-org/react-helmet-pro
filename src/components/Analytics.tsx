"use client";

import React from "react";
import { Helmet } from "./Helmet";

/** A Google tag ID supported by gtag.js. */
export type GoogleTagId =
  | `G-${string}`
  | `GT-${string}`
  | `AW-${string}`
  | `DC-${string}`;

export interface AnalyticsProps {
  type: "gtag";
  /**
   * A Google tag ID with a G-, GT-, AW-, or DC- prefix and an uppercase
   * alphanumeric suffix. The value is validated at runtime before use.
   */
  id: GoogleTagId;
  /** CSP nonce applied to both the remote and inline script elements. */
  nonce?: string;
}

const GOOGLE_TAG_ID_PATTERN = /^(?:G|GT|AW|DC)-[A-Z0-9]+$/;
const GTAG_ORIGIN = "https://www.googletagmanager.com";

// Keep executable code static. The validated ID is passed as inert element data.
const GTAG_BOOTSTRAP =
  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}" +
  "gtag('js',new Date());gtag('config',document.currentScript.dataset.gtagId);";

export const isGoogleTagId = (value: string): value is GoogleTagId =>
  GOOGLE_TAG_ID_PATTERN.test(value);

export const createGoogleTagUrl = (id: GoogleTagId): string => {
  const url = new URL("/gtag/js", GTAG_ORIGIN);
  url.searchParams.set("id", id);
  return url.toString();
};

export const Analytics = ({ type, id, nonce }: AnalyticsProps) => {
  if (type !== "gtag" || !isGoogleTagId(id)) {
    return null;
  }

  const src = createGoogleTagUrl(id);

  return (
    <Helmet defer={false}>
      <script async src={src} data-gtag-loader={id} nonce={nonce} />
      <script data-gtag-id={id} nonce={nonce}>
        {GTAG_BOOTSTRAP}
      </script>
    </Helmet>
  );
};
