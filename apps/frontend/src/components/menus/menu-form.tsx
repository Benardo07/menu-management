"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { MenuPayload, MenuTreeNode } from "@/lib/redux/slices/menu-slice";

export type MenuFormValues = {
  title: string;
  slug?: string | null;
};

type MenuFormProps = {
  menu?: MenuPayload | null;
  item?: MenuTreeNode | null;
  parent?: MenuTreeNode | null;
  saving?: boolean;
  onSubmit?: (values: MenuFormValues) => void;
  onDelete?: () => void;
};

export function MenuForm({ menu, item, parent, saving = false, onSubmit, onDelete }: MenuFormProps) {
  const [values, setValues] = useState<MenuFormValues>({ title: "" });

  useEffect(() => {
    if (!item) {
      setValues({ title: "" });
      return;
    }
    setValues({
      title: item.title,
      slug: item.slug ?? "",
    });
  }, [item]);

  const handleChange = (field: keyof MenuFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!item) return;

    onSubmit?.({
      title: values.title.trim(),
      slug: values.slug && values.slug.trim().length ? values.slug.trim() : null,
    });
  };

  const isRoot = item?.isRoot ?? false;
  const depthLabel = item ? item.depth : "-";

  const parentLabel = useMemo(() => {
    if (!item) return "-";
    if (!parent) return "Root";
    return parent.title;
  }, [item, parent]);

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Menu ID" value={menu?.id ?? "-"} readOnly />
        <Field label="Depth" value={String(depthLabel)} readOnly subtle />
        <Field label="Parent" value={parentLabel} readOnly />
        <Field
          label="Name"
          value={values.title}
          onChange={handleChange("title")}
          placeholder="Item name"
          required
        />
        <Field
          label="Slug"
          value={values.slug ?? ""}
          onChange={handleChange("slug")}
          placeholder="auto-generated when left blank"
        />
      </div>

  ...
