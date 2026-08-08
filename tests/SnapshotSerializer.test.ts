import { describe, expect, it } from "vitest";
import { helmetSnapshotSerializer } from "../src/testing/serializer";
import type { HelmetState } from "../src/types/tags";

// Add serializer for the tests in this file
expect.addSnapshotSerializer(helmetSnapshotSerializer);

describe("Stable Snapshot Serializer", () => {
  it("serializes dynamic HelmetState sorted alphabetically by tag name and dedupe keys", () => {
    const state: Partial<HelmetState> = {
      title: "Deterministic Page Title",
      titleAttributes: { class: "my-title" },
      meta: [
        { name: "description", content: "A premium helmet library" },
        { name: "viewport", content: "width=device-width" },
      ],
      link: [
        { rel: "canonical", href: "https://example.com/canonical" },
        { rel: "alternate", hrefLang: "fr", href: "https://example.com/fr" },
      ],
      script: [
        { type: "application/ld+json", innerHTML: '{"@type": "Product", "name": "Premium Pack"}' },
      ],
    };

    // The output matches the serializer format
    expect(state).toMatchInlineSnapshot(`
      <title class="my-title">Deterministic Page Title</title>
      <meta content="A premium helmet library" name="description" />
      <meta content="width=device-width" name="viewport" />
      <link href="https://example.com/canonical" rel="canonical" />
      <link href="https://example.com/fr" hreflang="fr" rel="alternate" />
      <script type="application/ld+json">{
        "@type": "Product",
        "name": "Premium Pack"
      }</script>
    `);
  });

  it("serializes scrambled HTML strings into a stable output representation", () => {
    const rawHeadHtml = `
      <link rel="canonical" href="https://example.com" />
      <meta name="description" content="Stable snapshot example" />
      <title>Deterministic Snapshot</title>
    `;

    expect(rawHeadHtml).toMatchInlineSnapshot(`
      <title>Deterministic Snapshot</title>
      <meta content="Stable snapshot example" name="description" />
      <link href="https://example.com" rel="canonical" />
    `);
  });

  it("resolves ties by total sort keys for duplicate tags or identical primary keys", () => {
    // Scrambled input with duplicate names/rel/types but different other properties
    const scrambledHtml = `
      <meta name="robots" content="noindex" />
      <meta name="robots" content="follow" />
      <link rel="alternate" hreflang="es" href="https://example.com/es" />
      <link rel="alternate" hreflang="en" href="https://example.com/en" />
      <script type="application/ld+json">{"name": "Z"}</script>
      <script type="application/ld+json">{"name": "A"}</script>
    `;

    // Should sort Spanish alternate after English, and robots "follow" before "noindex" (F comes before N)
    // And JSON-LD scripts by content alphabetically ("A" before "Z")
    expect(scrambledHtml).toMatchInlineSnapshot(`
      <meta content="follow" name="robots" />
      <meta content="noindex" name="robots" />
      <link href="https://example.com/en" hreflang="en" rel="alternate" />
      <link href="https://example.com/es" hreflang="es" rel="alternate" />
      <script type="application/ld+json">{
        "name": "A"
      }</script>
      <script type="application/ld+json">{
        "name": "Z"
      }</script>
    `);
  });
});

