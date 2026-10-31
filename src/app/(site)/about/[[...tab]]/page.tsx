import { infoPageRoute } from "@/components/site/info-page";
import { aboutPage } from "@/content/about";

const route = infoPageRoute(aboutPage);

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
