import type { WebSiteSchemaInput } from "../utils/schemaBuilder";
import { buildWebSiteSchema } from "../utils/schemaBuilder";
import { StructuredData } from "./StructuredData";

export interface WebSiteJsonLdProps extends WebSiteSchemaInput {
  id?: string;
}

export const WebSiteJsonLd = ({ id, ...data }: WebSiteJsonLdProps) => (
  <StructuredData id={id} json={buildWebSiteSchema(data)} />
);
