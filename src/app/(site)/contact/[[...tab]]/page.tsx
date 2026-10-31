import { infoPageRoute } from "@/components/site/info-page";
import { contactPage } from "@/content/contact";

const route = infoPageRoute(contactPage);

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
