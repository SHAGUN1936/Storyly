import { infoPageRoute } from "@/components/site/info-page";
import { storiesPage } from "@/content/stories";

const route = infoPageRoute(storiesPage);

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
