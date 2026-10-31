import { infoPageRoute } from "@/components/site/info-page";
import { helpPage } from "@/content/help";

const route = infoPageRoute(helpPage);

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
