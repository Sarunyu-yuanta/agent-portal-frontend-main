import { redirect } from "next/navigation";
import { hasLocale, DEFAULT_LOCALE } from "@/i18n/config";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(`/${hasLocale(lang) ? lang : DEFAULT_LOCALE}/command-center`);
}
