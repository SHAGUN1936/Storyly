import { infoPageRoute } from "@/components/site/info-page";
import { termsPage } from "@/content/terms";

const route = infoPageRoute(termsPage);

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
