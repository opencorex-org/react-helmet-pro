# Inline content safety

React Helmet Pro uses one context-aware serializer for server strings, React components,
Astro output, hydration, and client DOM updates. Inline source is never passed through the
ordinary HTML text/attribute encoder because script and style elements are raw-text contexts.

## Content-safety matrix

| Content | Typed field | SSR and adapters | React component | Client DOM | Special handling |
| --- | --- | --- | --- | --- | --- |
| Executable JavaScript | `scriptContent: createScriptContent(source)` | Raw source with ASCII-case-insensitive `</script` neutralized | The same normalized source via `dangerouslySetInnerHTML` | The same normalized source via `textContent` | Comments, entities, and Unicode separators are preserved. Source must be trusted; the helper is not a JavaScript sanitizer. |
| JSON-LD | `jsonLd: createJsonLdContent(value)` | JSON serialization with `<`, `&`, U+2028, and U+2029 escaped | The identical serialized JSON | The identical serialized JSON via `textContent` | Remains valid JSON and cannot contain an HTML script end tag; `>` is preserved because a closing tag cannot begin without `<`. |
| CSS | `styleContent: createStyleContent(source)` | Raw CSS with ASCII-case-insensitive `</style` neutralized | The same normalized CSS via `dangerouslySetInnerHTML` | The same normalized CSS via `textContent` | Comments, entities, and Unicode separators are preserved. Source must be trusted. |
| Noscript HTML | `htmlContent: createNoscriptHtml(markup)` | Trusted markup with `</noscript` neutralized | The same normalized markup via `dangerouslySetInnerHTML` | The same normalized markup via `innerHTML` | Elements and entities remain markup. Source must be trusted; the helper is not an HTML sanitizer. |

Attribute values and titles always use HTML escaping. The deprecated
`encodeSpecialCharacters={false}` value remains readable in state for compatibility, but no
longer disables safe server serialization.

## Migration plan

1. In 2.x, `innerHTML`, `cssText`, and `encodeSpecialCharacters` remain accepted. Legacy inline
   fields use the same contextual serializer as the typed fields.
2. Applications should move JavaScript to `scriptContent`, structured data to `jsonLd`, CSS to
   `styleContent`, and noscript markup to `htmlContent`. Prefer structured JSON-LD helpers over
   constructing JSON strings.
3. In the next major release, remove the legacy inline fields and the global encoding opt-out
   after a deprecation cycle. No automatic sanitization of trusted script, CSS, or HTML is planned.
