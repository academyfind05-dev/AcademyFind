"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  useTransition,
} from "react";
import toast from "react-hot-toast";
import slugify from "slugify";
import {
  ArrowLeft,
  Check,
  FileText,
  ImagePlus,
  Loader2,
  Plus,
  Send,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { saveAdminBlogPost, deleteAdminBlogPost } from "@/lib/User/admin/admin-blog";
import { saveBlogPost } from "@/lib/User/user/blog/saveblogpost";
import { deleteBlogPost } from "@/lib/User/user/blog/deleteblogpost";
import { uploadImage } from "./utils/uploadImage";

import Editor from "./Editor";
import type {
  BlogEditorOptions,
  BlogEditorProps,
  BlogEditorSaveInput,
} from "./types";

type BlogEditorFormProps = BlogEditorProps & {
  options: BlogEditorOptions;
};

type FormState = Omit<BlogEditorSaveInput, "id" | "intent" | "faqs">;
type EditableFaq = {
  key: string;
  question: string;
  answer: string;
};
type AdminControls = NonNullable<BlogEditorSaveInput["admin"]>;

const EMPTY_CONTENT = "";
const NONE_VALUE = "__none__";

function createKey() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function SectionCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={`rounded-3xl border border-slate-100 bg-white shadow-xs hover:shadow-md hover:shadow-slate-100/50 transition-all duration-300 ${className}`}
    >
      <CardHeader className="pb-5">
        <CardTitle className="text-lg font-extrabold tracking-tight text-slate-800">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function FieldCounter({
  value,
  maximum,
}: {
  value: string;
  maximum: number;
}) {
  const nearLimit = value.length > maximum * 0.9;

  return (
    <span
      className={
        nearLimit ? "text-xs font-semibold text-amber-700" : "text-xs text-slate-400"
      }
    >
      {value.length}/{maximum}
    </span>
  );
}

export default function BlogEditorForm({
  mode,
  initialData,
  options,
  management = "author",
  relatedInstituteId,
}: BlogEditorFormProps) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [postId, setPostId] = useState(initialData?.id);
  const [saveState, setSaveState] = useState<
    "saved" | "saving" | "unsaved"
  >("saved");
  const [status, setStatus] = useState(initialData?.status ?? "DRAFT");

  // Prevent accidental tab closing if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveState === "unsaved") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveState]);


  const [slugWasEdited, setSlugWasEdited] = useState(mode === "edit");
  const [tagInput, setTagInput] = useState("");
  const [adminControls, setAdminControls] = useState<AdminControls>(() => ({
    status: initialData?.status ?? "DRAFT",
    visibility: initialData?.visibility ?? "PUBLIC",
    canonicalUrl: initialData?.canonicalUrl ?? "",
    robotsIndex: initialData?.robotsIndex ?? true,
    robotsFollow: initialData?.robotsFollow ?? true,
    isFeatured: initialData?.isFeatured ?? false,
    featuredOrder: initialData?.featuredOrder ?? 0,
    isPinned: initialData?.isPinned ?? false,
    allowComments: initialData?.allowComments ?? true,
    scheduledAt: initialData?.scheduledAt
      ? new Date(initialData.scheduledAt).toISOString().slice(0, 16)
      : "",
    rejectionReason: initialData?.rejectionReason ?? "",
  }));
  const [form, setForm] = useState<FormState>(() => ({
    title: initialData?.title ?? "",
    slug: initialData?.slug ?? "",
    excerpt: initialData?.excerpt ?? "",
    contentHtml: initialData?.contentHtml ?? EMPTY_CONTENT,
    coverImage: initialData?.coverImage ?? "",
    categoryId: initialData?.categoryId ?? "",
    brandId: initialData?.brandId ?? "",
    authorProfileId: initialData?.authorProfileId ?? "",
    tagNames: initialData?.tags.map(({ tag }) => tag.name) ?? [],
    metaTitle: initialData?.metaTitle ?? "",
    metaDescription: initialData?.metaDescription ?? "",
    focusKeyword: initialData?.focusKeyword ?? "",
  }));
  const [faqs, setFaqs] = useState<EditableFaq[]>(
    () =>
      initialData?.faqs
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((faq) => ({
          key: faq.id,
          question: faq.question,
          answer: faq.answer,
        })) ?? [],
  );

  const matchingTags = useMemo(() => {
    const query = tagInput.trim().toLocaleLowerCase();
    if (!query) return [];

    return options.tags
      .filter(
        (tag) =>
          tag.name.toLocaleLowerCase().includes(query) &&
          !form.tagNames.some(
            (selected) =>
              selected.toLocaleLowerCase() === tag.name.toLocaleLowerCase(),
          ),
      )
      .slice(0, 5);
  }, [form.tagNames, options.tags, tagInput]);

  const markUnsaved = useCallback(() => setSaveState("unsaved"), []);

  const updateAdminField = useCallback(
    <Key extends keyof AdminControls>(
      key: Key,
      value: AdminControls[Key],
    ) => {
      setAdminControls((current) => ({ ...current, [key]: value }));
      markUnsaved();
    },
    [markUnsaved],
  );

  const updateField = useCallback(
    <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
      setForm((current) => ({ ...current, [key]: value }));
      markUnsaved();
    },
    [markUnsaved],
  );

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const title = event.target.value;
    setForm((current) => ({
      ...current,
      title,
      slug: slugWasEdited
        ? current.slug
        : slugify(title, { lower: true, strict: true, trim: true }),
    }));
    markUnsaved();
  };

  const handleSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSlugWasEdited(true);
    updateField(
      "slug",
      slugify(event.target.value, {
        lower: true,
        strict: true,
        trim: false,
      }),
    );
  };

  const addTag = useCallback(
    (rawName = tagInput) => {
      const name = rawName.trim().replace(/,$/, "");
      if (!name) return;

      if (
        !form.tagNames.some(
          (tag) => tag.toLocaleLowerCase() === name.toLocaleLowerCase(),
        )
      ) {
        updateField("tagNames", [...form.tagNames, name]);
      }
      setTagInput("");
    },
    [form.tagNames, tagInput, updateField],
  );

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    }

    if (
      event.key === "Backspace" &&
      !tagInput &&
      form.tagNames.length > 0
    ) {
      updateField("tagNames", form.tagNames.slice(0, -1));
    }
  };

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("The cover image must be smaller than 10 MB.");
      return;
    }

    setIsUploading(true);
    const result = await uploadImage(file);
    setIsUploading(false);

    if (!result.success || !result.url) {
      toast.error(result.error ?? "Cover image upload failed.");
      return;
    }

    updateField("coverImage", result.url);
    toast.success("Cover image uploaded.");
  };

  const updateFaq = (
    key: string,
    field: "question" | "answer",
    value: string,
  ) => {
    setFaqs((current) =>
      current.map((faq) => (faq.key === key ? { ...faq, [field]: value } : faq)),
    );
    markUnsaved();
  };

  const removeFaq = (key: string) => {
    setFaqs((current) => current.filter((faq) => faq.key !== key));
    markUnsaved();
  };

  const addFaq = () => {
    setFaqs((current) => [
      ...current,
      { key: createKey(), question: "", answer: "" },
    ]);
    markUnsaved();
  };

  const submit = (intent: "draft" | "publish") => {
    if (form.title.trim().length < 3) {
      toast.error("Add a title with at least 3 characters.");
      return;
    }

    if (!form.slug.trim()) {
      toast.error("Add a valid slug.");
      return;
    }

    if (
      !form.contentHtml
        .replace(/<[^>]*>/g, "")
        .replaceAll("&nbsp;", " ")
        .trim()
    ) {
      toast.error("Write some content before saving.");
      return;
    }

    const incompleteFaq = faqs.some(
      (faq) => !faq.question.trim() || !faq.answer.trim(),
    );
    if (incompleteFaq) {
      toast.error("Complete or remove each FAQ before saving.");
      return;
    }

    setSaveState("saving");
    startTransition(async () => {
      const payload: BlogEditorSaveInput = {
        ...form,
        id: postId,
        intent,
        faqs: faqs.map(({ question, answer }) => ({ question, answer })),
        relatedInstituteId,
        ...(management === "admin" ? { admin: adminControls } : {}),
      };
      const result =
        management === "admin"
          ? await saveAdminBlogPost(payload)
          : await saveBlogPost(payload);

      if (!result.success) {
        setSaveState("unsaved");
        toast.error(result.error);
        return;
      }

      setPostId(result.id);
      const nextStatus =
        intent === "publish"
          ? (management === "admin" ? "PUBLISHED" : "PENDING_REVIEW")
          : management === "admin"
            ? adminControls.status
            : "DRAFT";
      setStatus(nextStatus);
      setSaveState("saved");
      toast.success(
        intent === "publish"
          ? (management === "admin" ? "Post published." : "Post submitted for review.")
          : management === "admin"
            ? "Post changes saved."
            : "Draft saved.",
      );

      if (management === "admin" && !postId) {
        router.replace(`/af-ass-manage/blog/edit/${result.id}`);
      } else if (intent === "publish" && management === "author") {
        router.push(`/blog/${result.slug}`);
      } else if (management === "manager" && relatedInstituteId) {
        if (!postId) {
          router.replace(`/manager/${relatedInstituteId}/blogs/edit/${result.id}`);
        } else if (intent === "publish") {
          router.push(`/manager/${relatedInstituteId}/blogs`);
        }
      }
    });
  };

  // Handle Ctrl+S / Cmd+S to save draft
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        submit("draft");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submit]);

  const handleDelete = async () => {
    setSaveState("saving");
    setIsConfirmOpen(false);
    try {
      const res = management === "admin"
        ? await deleteAdminBlogPost(postId!)
        : await deleteBlogPost(postId!);

      if (res.success) {
        toast.success("Post deleted successfully.");
        if (management === "admin") {
          router.push("/af-ass-manage/blog");
        } else if (management === "manager" && relatedInstituteId) {
          router.push(`/manager/${relatedInstituteId}/blogs`);
        } else {
          router.push("/blog/my-posts");
        }
      } else {
        toast.error(res.error || "Failed to delete post.");
        setSaveState("unsaved");
      }
    } catch (err) {
      toast.error("An error occurred while deleting the post.");
      setSaveState("unsaved");
    }
  };

  const actionButtons = (
    <>
      {mode === "edit" && postId && (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={isPending || isUploading}
          onClick={() => setIsConfirmOpen(true)}
          className="text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 font-semibold rounded-2xl transition-all duration-200 cursor-pointer text-sm"
        >
          <Trash2 className="h-4 w-4" />
          Delete Post
        </Button>
      )}
      {management === "admin" ? (
        <Button
          type="button"
          size="lg"
          disabled={isPending || isUploading}
          onClick={() => submit("draft")}
          className={`bg-amber-500 text-white shadow-md hover:bg-amber-600 hover:shadow-lg rounded-2xl font-bold transition-all duration-200 border-0 cursor-pointer text-sm px-6 py-2.5 flex items-center justify-center gap-2 ${mode === "edit" && postId ? "col-span-1" : "col-span-2"}`}
        >
          {isPending && saveState === "saving" ? (
            <Loader2 className="animate-spin size-4" />
          ) : (
            <Check className="size-4" />
          )}
          Save Changes
        </Button>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isPending || isUploading}
            onClick={() => submit("draft")}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-2xl font-bold transition-all duration-200 cursor-pointer text-sm shadow-xs border px-5 py-2.5 flex items-center gap-2"
          >
            {isPending && saveState === "saving" ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <FileText className="size-4 text-slate-400" />
            )}
            Save Draft
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={isPending || isUploading}
            onClick={() => submit("publish")}
            className="bg-amber-500 text-white shadow-md hover:bg-amber-600 hover:shadow-lg rounded-2xl font-bold transition-all duration-200 border-0 cursor-pointer text-sm px-6 py-2.5 flex items-center gap-2"
          >
            {isPending && saveState === "saving" ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <Send className="size-4" />
            )}
            Publish
          </Button>
        </>
      )}
    </>
  );

  return (
    <main className="min-h-screen bg-slate-50/50">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Go back"
              onClick={() => router.back()}
              className="text-slate-500 rounded-xl hover:bg-slate-50"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-extrabold text-slate-800 sm:text-lg">
                  {mode === "create" ? "Create Post" : "Edit Post"}
                </h1>
                <Badge className="bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg px-2 py-0.5 border border-amber-100/50 text-[10px] font-bold uppercase tracking-wider">
                  {status === "DRAFT"
                    ? "Draft"
                    : status
                      .toLocaleLowerCase()
                      .replaceAll("_", " ")}
                </Badge>
              </div>
              <p className="hidden text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:block">
                {saveState === "saving"
                  ? "Saving changes…"
                  : saveState === "unsaved"
                    ? "Unsaved changes"
                    : "All changes saved"}
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">{actionButtons}</div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <section aria-labelledby="content-heading" className="space-y-3 lg:col-span-full">
          <div className="px-1">
            <h2
              id="content-heading"
              className="text-base font-extrabold text-slate-800"
            >
              Main content
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
              Use the toolbar or slash commands to structure your story.
            </p>
          </div>
          <Editor
            value={form.contentHtml}
            onChange={(contentHtml) => updateField("contentHtml", contentHtml)}
            saveState={saveState}
            placeholder="Start writing your post…"
            className="min-h-[700px] rounded-3xl overflow-hidden border border-slate-200 bg-white"
          />
        </section>

        <div className="min-w-0 space-y-6">
          <SectionCard
            title="Basic information"
            description="Give readers a clear reason to open your post."
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="blog-title" className="font-semibold text-slate-700">Title</Label>
                  <FieldCounter value={form.title} maximum={180} />
                </div>
                <Input
                  id="blog-title"
                  value={form.title}
                  maxLength={180}
                  onChange={handleTitleChange}
                  placeholder="A useful, specific post title"
                  className="h-11 rounded-2xl border-slate-200 text-sm transition-all focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blog-slug" className="font-semibold text-slate-700">Slug</Label>
                <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-100">
                  <span className="hidden items-center border-r border-slate-100 bg-slate-50/50 px-4 text-xs font-bold text-slate-400 sm:flex">
                    /blog/
                  </span>
                  <Input
                    id="blog-slug"
                    value={form.slug}
                    maxLength={200}
                    onChange={handleSlugChange}
                    placeholder="your-post-slug"
                    className="h-11 rounded-none border-0 focus-visible:ring-0 focus:ring-0 text-sm"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Generated automatically from the title until you manually edit it.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="blog-excerpt" className="font-semibold text-slate-700">Excerpt</Label>
                  <FieldCounter value={form.excerpt} maximum={500} />
                </div>
                <Textarea
                  id="blog-excerpt"
                  value={form.excerpt}
                  maxLength={500}
                  rows={4}
                  onChange={(event) => updateField("excerpt", event.target.value)}
                  placeholder="A concise summary for cards and search results."
                  className="min-h-28 rounded-2xl border-slate-200 transition-all focus:border-amber-400 focus:ring-4 focus:ring-amber-100 text-sm"
                />
              </div>
            </div>
          </SectionCard>


          <SectionCard
            title="Frequently asked questions"
            description="Add concise answers to common reader questions."
          >
            <div className="space-y-4">
              {faqs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No FAQs added yet
                  </p>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Adding FAQs improves readability and search visibility.
                  </p>
                </div>
              ) : null}

              {faqs.map((faq, index) => (
                <div
                  key={faq.key}
                  className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      FAQ {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove FAQ ${index + 1}`}
                      onClick={() => removeFaq(faq.key)}
                      className="text-slate-400 hover:bg-red-50 hover:text-red-650 rounded-xl"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`faq-question-${faq.key}`} className="text-xs font-semibold text-slate-700">Question</Label>
                      <Input
                        id={`faq-question-${faq.key}`}
                        value={faq.question}
                        maxLength={300}
                        onChange={(event) =>
                          updateFaq(faq.key, "question", event.target.value)
                        }
                        placeholder="What might a reader ask?"
                        className="rounded-xl border-slate-200 bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`faq-answer-${faq.key}`} className="text-xs font-semibold text-slate-700">Answer</Label>
                      <Textarea
                        id={`faq-answer-${faq.key}`}
                        value={faq.answer}
                        maxLength={2000}
                        rows={3}
                        onChange={(event) =>
                          updateFaq(faq.key, "answer", event.target.value)
                        }
                        placeholder="Give a direct, helpful answer."
                        className="rounded-xl border-slate-200 bg-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addFaq}
                className="w-full border-dashed border-amber-300 bg-amber-50/20 text-amber-800 hover:bg-amber-50 rounded-2xl h-11 font-bold cursor-pointer transition-all duration-200"
              >
                <Plus className="size-4 mr-1" />
                Add FAQ
              </Button>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <SectionCard
            title="Featured image"
            description="Recommended ratio: 16:9, up to 10 MB."
          >
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleCoverUpload}
            />
            {form.coverImage ? (
              <div className="space-y-3">
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 shadow-xs">
                  <Image
                    src={form.coverImage}
                    alt={form.title || "Post cover preview"}
                    fill
                    sizes="(min-width: 1024px) 328px, 100vw"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => coverInputRef.current?.click()}
                    className="rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-semibold h-9"
                  >
                    <ImagePlus className="size-3.5 mr-1" />
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => updateField("coverImage", "")}
                    className="text-slate-500 hover:bg-red-50 hover:text-red-650 rounded-xl cursor-pointer text-xs font-semibold h-9"
                  >
                    <Trash2 className="size-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={isUploading}
                onClick={() => coverInputRef.current?.click()}
                className="group/dropzone flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-slate-500 transition-all duration-300 hover:border-amber-400 hover:bg-amber-50/20 hover:text-amber-600 disabled:cursor-wait disabled:opacity-60"
              >
                {isUploading ? (
                  <Loader2 className="mb-3 size-8 animate-spin text-amber-500" />
                ) : (
                  <UploadCloud className="mb-3 size-8 text-slate-400 transition-transform duration-300 group-hover/dropzone:-translate-y-1 group-hover/dropzone:text-amber-500" />
                )}
                <span className="text-sm font-semibold text-slate-700 group-hover/dropzone:text-amber-700">
                  {isUploading ? "Uploading cover image…" : "Upload a cover image"}
                </span>
                <span className="mt-1 text-[11px] text-slate-400">
                  PNG, JPG or WebP (16:9 ratio)
                </span>
              </button>
            )}
          </SectionCard>

          <SectionCard title="Organization">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">Category</Label>
                <Select
                  value={form.categoryId || NONE_VALUE}
                  onValueChange={(value) =>
                    updateField(
                      "categoryId",
                      value === NONE_VALUE ? "" : value,
                    )
                  }
                >
                  <SelectTrigger className="h-10 w-full rounded-2xl border-slate-200">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-lg">
                    <SelectItem value={NONE_VALUE}>No category</SelectItem>
                    {options.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon ? `${category.icon} ` : ""}
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {management === "admin" && (
                <>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">
                      Publish As (Brand)
                    </Label>
                    <Select
                      value={form.brandId || NONE_VALUE}
                      onValueChange={(value) =>
                        updateField("brandId", value === NONE_VALUE ? "" : value)
                      }
                    >
                      <SelectTrigger className="h-10 w-full rounded-2xl border-slate-200">
                        <SelectValue placeholder="Choose a brand" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 shadow-lg">
                        <SelectItem value={NONE_VALUE}>Original Author / No Brand</SelectItem>
                        {options.brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-400">
                      Select a brand if you are writing this post, or leave blank to keep original author.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">
                      Publish As (Author)
                    </Label>
                    <Select
                      value={form.authorProfileId || NONE_VALUE}
                      onValueChange={(value) =>
                        updateField("authorProfileId", value === NONE_VALUE ? "" : value)
                      }
                    >
                      <SelectTrigger className="h-10 w-full rounded-2xl border-slate-200">
                        <SelectValue placeholder="Choose an author" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 shadow-lg">
                        <SelectItem value={NONE_VALUE}>System Default (Admin)</SelectItem>
                        {options.authors?.map((author) => (
                          <SelectItem key={author.id} value={author.id}>
                            {author.user.name || "Unnamed"} ({author.user.email || "No Email"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-400">
                      Select a specific user to publish this post on their behalf.
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="blog-tags" className="font-semibold text-slate-700">Tags</Label>
                <div className="rounded-2xl border border-slate-200 bg-white p-2.5 transition-all focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-100">
                  <div className="flex flex-wrap gap-1.5">
                    {form.tagNames.map((tag) => (
                      <Badge
                        key={tag.toLocaleLowerCase()}
                        className="bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900 rounded-lg px-2.5 py-1 text-xs border border-amber-100/50 shadow-xs flex items-center gap-1.5 max-w-full"
                      >
                        <span className="truncate">{tag}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${tag}`}
                          onClick={() =>
                            updateField(
                              "tagNames",
                              form.tagNames.filter((item) => item !== tag),
                            )
                          }
                          className="rounded-full hover:bg-amber-200/50 p-0.5 hover:text-red-600 transition-colors shrink-0"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      id="blog-tags"
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={() => addTag()}
                      placeholder={
                        form.tagNames.length ? "Add another…" : "Type a tag…"
                      }
                      className="h-7 min-w-28 flex-1 border-0 px-1 text-sm focus-visible:ring-0 shadow-none focus:ring-0 focus-visible:border-0"
                    />
                  </div>
                </div>
                {matchingTags.length ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {matchingTags.map((tag) => (
                      <Button
                        key={tag.id}
                        type="button"
                        variant="ghost"
                        size="xs"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => addTag(tag.name)}
                        className="bg-slate-100 text-slate-600 rounded-lg h-7 px-2 hover:bg-amber-50 hover:text-amber-700"
                      >
                        <Plus className="size-3 mr-0.5" />
                        {tag.name}
                      </Button>
                    ))}
                  </div>
                ) : null}
                <p className="text-[11px] text-slate-400">
                  Press Enter or comma to create a tag.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Search optimization"
            description="Fine-tune how this post appears in search results."
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seo-title" className="font-semibold text-slate-700">SEO title</Label>
                  <FieldCounter value={form.metaTitle} maximum={70} />
                </div>
                <Input
                  id="seo-title"
                  value={form.metaTitle}
                  maxLength={70}
                  onChange={(event) =>
                    updateField("metaTitle", event.target.value)
                  }
                  placeholder={form.title || "Search result title"}
                  className="rounded-2xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seo-description" className="font-semibold text-slate-700">SEO description</Label>
                  <FieldCounter value={form.metaDescription} maximum={180} />
                </div>
                <Textarea
                  id="seo-description"
                  value={form.metaDescription}
                  maxLength={180}
                  rows={4}
                  onChange={(event) =>
                    updateField("metaDescription", event.target.value)
                  }
                  placeholder="A compelling description for search results."
                  className="rounded-2xl border-slate-200 text-sm"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seo-keywords" className="font-semibold text-slate-700">SEO keywords</Label>
                  <FieldCounter value={form.focusKeyword} maximum={200} />
                </div>
                <Input
                  id="seo-keywords"
                  value={form.focusKeyword}
                  maxLength={200}
                  onChange={(event) =>
                    updateField("focusKeyword", event.target.value)
                  }
                  placeholder="primary keyword, supporting keyword"
                  className="rounded-2xl border-slate-200"
                />
              </div>
            </div>
          </SectionCard>

          {management === "admin" ? (
            <SectionCard
              title="Admin controls"
              description="Control workflow, visibility, and promotion."
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Workflow status</Label>
                  <Select
                    value={adminControls.status}
                    onValueChange={(value: AdminControls["status"]) =>
                      updateAdminField("status", value)
                    }
                  >
                    <SelectTrigger className="h-10 w-full rounded-2xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-lg">
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PENDING_REVIEW">
                        Pending review
                      </SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {adminControls.status === "SCHEDULED" ? (
                  <div className="space-y-2">
                    <Label htmlFor="scheduled-at" className="font-semibold text-slate-700">Publish at</Label>
                    <Input
                      id="scheduled-at"
                      type="datetime-local"
                      value={adminControls.scheduledAt}
                      onChange={(event) =>
                        updateAdminField("scheduledAt", event.target.value)
                      }
                      className="h-10 rounded-2xl border-slate-200"
                    />
                  </div>
                ) : null}

                {adminControls.status === "REJECTED" ? (
                  <div className="space-y-2">
                    <Label htmlFor="rejection-reason" className="font-semibold text-slate-700">Rejection reason</Label>
                    <Textarea
                      id="rejection-reason"
                      value={adminControls.rejectionReason}
                      maxLength={1000}
                      onChange={(event) =>
                        updateAdminField(
                          "rejectionReason",
                          event.target.value,
                        )
                      }
                      className="rounded-2xl border-slate-200"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Visibility</Label>
                  <Select
                    value={adminControls.visibility}
                    onValueChange={(value: AdminControls["visibility"]) =>
                      updateAdminField("visibility", value)
                    }
                  >
                    <SelectTrigger className="h-10 w-full rounded-2xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-lg">
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="UNLISTED">Unlisted</SelectItem>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 rounded-2xl bg-slate-50/50 p-4 border border-slate-100">
                  {[
                    ["isFeatured", "Feature this post"],
                    ["isPinned", "Pin this post"],
                    ["allowComments", "Allow comments"],
                    ["robotsIndex", "Allow search indexing"],
                    ["robotsFollow", "Allow link following"],
                  ].map(([key, label]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3"
                    >
                      <Label htmlFor={`admin-${key}`} className="text-xs font-semibold text-slate-600">{label}</Label>
                      <Switch
                        id={`admin-${key}`}
                        checked={Boolean(
                          adminControls[key as keyof AdminControls],
                        )}
                        onCheckedChange={(checked) =>
                          updateAdminField(
                            key as
                            | "isFeatured"
                            | "isPinned"
                            | "allowComments"
                            | "robotsIndex"
                            | "robotsFollow",
                            checked,
                          )
                        }
                      />
                    </div>
                  ))}
                </div>

                {adminControls.isFeatured ? (
                  <div className="space-y-2">
                    <Label htmlFor="featured-order" className="font-semibold text-slate-700">Featured order</Label>
                    <Input
                      id="featured-order"
                      type="number"
                      min={0}
                      max={9999}
                      value={adminControls.featuredOrder}
                      onChange={(event) =>
                        updateAdminField(
                          "featuredOrder",
                          Number(event.target.value),
                        )
                      }
                      className="rounded-2xl border-slate-200"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="canonical-url" className="font-semibold text-slate-700">Canonical URL</Label>
                  <Input
                    id="canonical-url"
                    type="url"
                    value={adminControls.canonicalUrl}
                    onChange={(event) =>
                      updateAdminField("canonicalUrl", event.target.value)
                    }
                    placeholder="https://academyfind.in/blog/..."
                    className="rounded-2xl border-slate-200"
                  />
                </div>
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Publish">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50/50 border border-emerald-100/50 px-4 py-3">
                <span className="text-xs font-semibold text-emerald-800">Status</span>
                <span className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                  <Check className="size-4 text-emerald-600" />
                  {status === "DRAFT" ? "Draft" : "Ready"}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                {management === "admin"
                  ? "Save all the workflow, visibility and content changes made above."
                  : "Save a draft to keep working, or publish when the post is ready for readers."}
              </p>
              <div className="grid grid-cols-2 gap-2">{actionButtons}</div>
            </div>
          </SectionCard>
        </aside>
      </div>

      <div className="sticky bottom-0 z-20 flex gap-2 border-t border-slate-100 bg-white/80 backdrop-blur-md p-4 sm:hidden">
        <div className="grid w-full grid-cols-2 gap-2">{actionButtons}</div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete this article?"
        description="This action cannot be undone."
        destructive={true}
        confirmText="Delete Post"
      />
    </main>
  );
}
