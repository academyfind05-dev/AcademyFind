import type { Editor } from "@tiptap/react";
import type {
  BlogBrand,
  BlogCategory,
  BlogFAQ,
  BlogPost,
  BlogTag,
} from "@/app/generated/prisma/client";

export type EditorProps = {
  content: string;
  onChange: (html: string) => void;

  editable?: boolean;
  placeholder?: string;
  autofocus?: boolean;
};

export type EditorToolbarProps = {
  editor: Editor | null;
};

export type EditorContentProps = {
  editor: Editor | null;
};

export type EditorBubbleMenuProps = {
  editor: Editor | null;
};

export type EditorFloatingMenuProps = {
  editor: Editor | null;
};

export type ImageUploaderProps = {
  editor: Editor | null;
  onUpload?: (file: File) => Promise<string>;
};

export type LinkPopoverProps = {
  editor: Editor | null;
};

export type SlashCommandsProps = {
  editor: Editor | null;
};

export type EditorWordCountProps = {
  editor: Editor | null;
};

export type EditorState = {
  wordCount: number;
  characterCount: number;
  readingTime: number;
};

export type SlashCommandItem = {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: Editor) => void;
};

export type ToolbarAction = {
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
  onClick: () => void;
};

export type BlogEditorInitialData = Pick<
  BlogPost,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "contentHtml"
  | "coverImage"
  | "categoryId"
  | "brandId"
  | "metaTitle"
  | "metaDescription"
  | "focusKeyword"
  | "status"
  | "visibility"
  | "canonicalUrl"
  | "robotsIndex"
  | "robotsFollow"
  | "isFeatured"
  | "featuredOrder"
  | "isPinned"
  | "allowComments"
  | "scheduledAt"
  | "rejectionReason"
  | "relatedInstituteId"
  | "authorProfileId"
> & {
  tags: { tag: Pick<BlogTag, "id" | "name" | "slug"> }[];
  faqs: Pick<BlogFAQ, "id" | "question" | "answer" | "order">[];
};

export type BlogEditorProps = {
  mode: "create" | "edit";
  initialData?: BlogEditorInitialData;
  management?: "author" | "admin" | "manager";
  relatedInstituteId?: string;
};

export type BlogEditorOptions = {
  categories: Pick<BlogCategory, "id" | "name" | "slug" | "icon">[];
  brands: Pick<BlogBrand, "id" | "name" | "slug" | "avatarUrl">[];
  tags: Pick<BlogTag, "id" | "name" | "slug">[];
  authors?: { id: string; user: { name: string | null; email: string | null } }[];
};

export type BlogEditorSaveInput = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  coverImage: string;
  categoryId: string;
  brandId: string;
  authorProfileId?: string;
  tagNames: string[];
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  faqs: { question: string; answer: string }[];
  intent: "draft" | "publish";
  relatedInstituteId?: string;
  admin?: {
    status:
      | "DRAFT"
      | "PENDING_REVIEW"
      | "SCHEDULED"
      | "PUBLISHED"
      | "REJECTED"
      | "ARCHIVED";
    visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
    canonicalUrl: string;
    robotsIndex: boolean;
    robotsFollow: boolean;
    isFeatured: boolean;
    featuredOrder: number;
    isPinned: boolean;
    allowComments: boolean;
    scheduledAt: string;
    rejectionReason: string;
  };
};
