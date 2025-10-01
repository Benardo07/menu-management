"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import folderIcon from "../../../public/folder.svg";
import submenuIcon from "../../../public/submenu.svg";

export type TreeNode = {
  id: string;
  label: string;
  depth: number;
  children?: TreeNode[];
  canAdd?: boolean;
  canDelete?: boolean;
  data?: Record<string, unknown>;
};

type Props = {
  nodes: TreeNode[];
  allExpanded?: boolean;
  onToggleAll?: (expanded: boolean) => void;
  onAdd?: (node: TreeNode) => void;
  onDelete?: (node: TreeNode) => void;
  onSelect?: (node: TreeNode) => void;
  selectedId?: string | null;
};

export function TreeView({
  nodes,
  allExpanded = true,
  onToggleAll,
  onAdd,
  onDelete,
  onSelect,
  selectedId,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    const walk = (tree: TreeNode[]) => {
      tree.forEach((node) => {
        next[node.id] = allExpanded;
        if (node.children) {
          walk(node.children);
        }
      });
    };
    walk(nodes);
    setExpanded(next);
  }, [nodes, allExpanded]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      onToggleAll?.(Object.values(next).every(Boolean));
      return next;
    });
  };

  return (
    <div className="text-sm text-slate-800">
      <ul className="space-y-1">
        {nodes.map((node) => (
          <Node
            key={node.id}
            node={node}
            expanded={!!expanded[node.id]}
            onToggle={toggle}
            expandedMap={expanded}
            onAdd={onAdd}
            onDelete={onDelete}
            onSelect={onSelect}
            selectedId={selectedId}
          />
        ))}
      </ul>
    </div>
  );
}

type NodeProps = {
  node: TreeNode;
  expanded: boolean;
  onToggle: (id: string) => void;
  expandedMap: Record<string, boolean>;
  depth?: number;
  onAdd?: (node: TreeNode) => void;
  onDelete?: (node: TreeNode) => void;
  onSelect?: (node: TreeNode) => void;
  selectedId?: string | null;
};

function Node({
  node,
  expanded,
  onToggle,
  expandedMap,
  depth = 0,
  onAdd,
  onDelete,
  onSelect,
  selectedId,
}: NodeProps) {
  const hasChildren = !!node.children?.length;
  const isSelected = selectedId === node.id;
  const depthLevel = node.depth ?? depth;
  const hierarchicalIcon = depthLevel >= 2 ? (depthLevel === 2 ? folderIcon : submenuIcon) : null;

  const handleSelect = () => {
    onSelect?.(node);
  };

  return (
    <li className="relative">
      {depth > 0 && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-[22px] h-px w-5 -translate-y-1/2 bg-slate-200"
        />
      )}

      <div
        className={cn(
          "relative flex items-center gap-2 rounded-lg py-1 pr-2 transition",
          depth > 0 ? "pl-8" : "pl-1",
          isSelected ? "bg-slate-100 text-slate-900 ring-1 ring-slate-200" : "hover:bg-slate-50",
        )}
        onClick={handleSelect}
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
        data-selected={isSelected}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggle(node.id);
            }}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span aria-hidden className="inline-flex h-6 w-6 items-center justify-center" />
        )}

        {hierarchicalIcon && (
          <Image src={hierarchicalIcon} alt="" width={14} height={14} />
        )}

        <span className="flex-1 truncate text-left text-slate-700">{node.label}</span>

        {onAdd && node.canAdd !== false && isSelected && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAdd(node);
            }}
            className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-600/90"
            aria-label={`Add under ${node.label}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}

        {onDelete && node.canDelete !== false && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(node);
            }}
            className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500"
            aria-label={`Delete ${node.label}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <ul className="ml-[22px] space-y-1 border-l border-slate-200 pl-4">
          {node.children!.map((child) => (
            <Node
              key={child.id}
              node={child}
              expanded={!!expandedMap[child.id]}
              onToggle={onToggle}
              expandedMap={expandedMap}
              depth={depth + 1}
              onAdd={onAdd}
              onDelete={onDelete}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}







