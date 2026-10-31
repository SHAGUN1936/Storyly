import { infoPageRoute } from "@/components/site/info-page";
import { privacyPage } from "@/content/privacy";

const route = infoPageRoute(privacyPage);

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
