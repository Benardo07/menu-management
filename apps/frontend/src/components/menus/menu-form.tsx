"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { MenuPayload, MenuTreeNode } from "@/lib/redux/slices/menu-slice";

export type MenuFormValues = {
  title: string;
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
    });
  }, [item]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValues({ title: event.target.value });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!item) return;

    onSubmit?.({
      title: values.title.trim(),
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
          onChange={handleChange}
          placeholder="Item name"
          required
        />
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
        <Button
          type="submit"
          disabled={!item || saving}
          className="rounded-full bg-blue-600 px-8 py-6 text-base font-semibold text-white hover:bg-blue-600/90 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!item || isRoot || saving}
          onClick={onDelete}
          className="rounded-full px-6 py-6 text-base"
        >
          Delete
        </Button>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  subtle?: boolean;
  required?: boolean;
};

function Field({ label, value, placeholder, onChange, readOnly, subtle, required }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-600">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        readOnly={readOnly}
        required={required}
        className={cnFieldClasses({ readOnly, subtle })}
        aria-readonly={readOnly}
      />
    </div>
  );
}

function cnFieldClasses({ readOnly, subtle }: { readOnly?: boolean; subtle?: boolean }) {
  if (readOnly) {
    return cnBaseInput(
      subtle ? "bg-slate-100" : "bg-slate-50",
      "cursor-not-allowed text-slate-700",
    );
  }
  return cnBaseInput("bg-white text-slate-800", "focus:border-slate-300 focus-visible:outline-none");
}

function cnBaseInput(...classes: string[]) {
  return [
    "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition",
    ...classes,
  ].join(" ");
}
