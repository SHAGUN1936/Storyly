// The small slice of a template that cards and lists need (no heavy `structure` JSON).

export type TemplateCardData = {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  previewVideoUrl: string;
  sourceType: "Template" | "BuilderTemplate";
};

export function toTemplateCard(t: {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  previewVideoUrl?: string | null;
  sourceType: "Template" | "BuilderTemplate";
}): TemplateCardData {
  return {
    id: t.id,
    name: t.name,
    category: t.category,
    description: t.description ?? "",
    thumbnailUrl: t.thumbnailUrl ?? "",
    previewVideoUrl: t.previewVideoUrl ?? "",
    sourceType: t.sourceType,
  };
}

/** Link to a template's detail page. Community templates carry ?src=BuilderTemplate. */
export function templateHref(t: Pick<TemplateCardData, "id" | "sourceType">) {
  return t.sourceType === "BuilderTemplate" ? `/template/${t.id}?src=BuilderTemplate` : `/template/${t.id}`;
}
