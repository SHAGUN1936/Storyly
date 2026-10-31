import { infoPageRoute } from "@/components/site/info-page";
import { tutorialsPage } from "@/content/tutorials";

const route = infoPageRoute(tutorialsPage);

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
