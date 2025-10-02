import { MenusScreen } from "@/screens/menus/menus-screen";

export default function SlugPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ? [params.slug] : [];
  return <MenusScreen slugSegments={slug} />;
}
