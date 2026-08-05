import { redirect } from "next/navigation";

export default function ArticlePageRedirect({ searchParams }: { searchParams: any }) {
  const tab = searchParams?.tab;
  redirect(tab ? `/articles?tab=${tab}` : "/articles");
}
