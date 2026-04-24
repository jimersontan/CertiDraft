import { DesignBuilder } from "@/components/certificates/design-builder";

type BuilderPageProps = {
  searchParams?: Promise<{
    template?: string;
  }>;
};

export default async function BuilderPage({
  searchParams,
}: BuilderPageProps) {
  const resolvedSearchParams = await searchParams;

  return <DesignBuilder templateId={resolvedSearchParams?.template} />;
}
