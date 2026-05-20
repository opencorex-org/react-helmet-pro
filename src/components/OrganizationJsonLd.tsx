import type { OrganizationSchemaInput } from "../utils/schemaBuilder";
import { buildOrganizationSchema } from "../utils/schemaBuilder";
import { StructuredData } from "./StructuredData";

export interface OrganizationJsonLdProps extends OrganizationSchemaInput {
  id?: string;
}

export const OrganizationJsonLd = ({ id, ...data }: OrganizationJsonLdProps) => (
  <StructuredData id={id} json={buildOrganizationSchema(data)} />
);
