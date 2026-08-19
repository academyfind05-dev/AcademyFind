import { getWriteBlogData } from "@/lib/User/user/blog/getwriteblogdata";
import { getAdminBlogEditorOptions } from "@/lib/User/admin/admin-blog-data";

import BlogEditorForm from "./BlogEditorForm";
import type { BlogEditorProps } from "./types";

export type { BlogEditorInitialData, BlogEditorProps } from "./types";

export default async function BlogEditor(props: BlogEditorProps) {
  const options =
    props.management === "admin"
      ? await getAdminBlogEditorOptions()
      : await getWriteBlogData();
  const { categories, tags, brands } = options;
  const authors = "authors" in options ? options.authors : undefined;

  return (
    <BlogEditorForm
      {...props}
      options={{ categories, tags, brands, authors }}
    />
  );
}
