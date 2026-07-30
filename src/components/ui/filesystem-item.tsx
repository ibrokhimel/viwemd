"use client";

import { useState, type ReactElement } from "react";
import { ChevronRight, File, Folder } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export type FilesystemNode = {
  name: string;
  nodes?: FilesystemNode[];
  path?: string;
  kind?: "directory" | "file";
  expanded?: boolean;
};

interface FilesystemItemProps {
  node: FilesystemNode;
  animated?: boolean;
  onToggle?(node: FilesystemNode): void | Promise<void>;
  onOpenFile?(node: FilesystemNode): void;
}

function nodeKey(node: FilesystemNode, parent: FilesystemNode): string {
  return node.path ?? `${parent.path ?? parent.name}/${node.name}`;
}

export function FilesystemItem({
  node,
  animated = false,
  onToggle,
  onOpenFile,
}: FilesystemItemProps): ReactElement {
  const [localOpen, setLocalOpen] = useState(false);
  const isDirectory = node.kind === "directory" || node.nodes !== undefined;
  const isControlled = typeof node.expanded === "boolean";
  const isOpen = isControlled ? (node.expanded ?? false) : localOpen;

  const toggleDirectory = (): void => {
    if (!isControlled) {
      setLocalOpen((current) => !current);
    }
    void onToggle?.(node);
  };

  const children = node.nodes?.map((child) => (
    <FilesystemItem
      node={child}
      key={nodeKey(child, node)}
      animated={animated}
      onToggle={onToggle}
      onOpenFile={onOpenFile}
    />
  ));

  const childrenList = animated ? (
    <AnimatePresence initial={false}>
      {isOpen ? (
        <motion.ul
          role="group"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="filesystem-children ml-3.5 flex flex-col overflow-hidden border-l pl-1.5"
        >
          {children}
        </motion.ul>
      ) : null}
    </AnimatePresence>
  ) : isOpen ? (
    <ul role="group" className="filesystem-children ml-3.5 border-l pl-1.5">
      {children}
    </ul>
  ) : null;

  return (
    <li
      className="filesystem-item min-w-0 list-none"
      role="treeitem"
      aria-expanded={isDirectory ? isOpen : undefined}
    >
      {isDirectory ? (
        <button
          type="button"
          className="filesystem-row flex w-full min-w-0 items-center gap-1.5 rounded-md text-left"
          aria-label={`${isOpen ? "Collapse" : "Expand"} ${node.name}`}
          title={node.path ?? node.name}
          onClick={toggleDirectory}
        >
          {animated ? (
            <motion.span
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="flex shrink-0"
              aria-hidden="true"
            >
              <ChevronRight className="size-4 text-[color:var(--subtle)]" />
            </motion.span>
          ) : (
            <ChevronRight
              className={`size-4 shrink-0 text-[color:var(--subtle)] transition-transform ${isOpen ? "rotate-90" : ""}`}
              aria-hidden="true"
            />
          )}
          <Folder
            className="filesystem-folder-icon size-5 shrink-0 fill-sky-500 text-sky-500"
            aria-hidden="true"
          />
          <span className="filesystem-name truncate">{node.name}</span>
        </button>
      ) : (
        <button
          type="button"
          className="filesystem-row flex w-full min-w-0 items-center gap-1.5 rounded-md text-left"
          aria-label={`Open ${node.name}`}
          title={node.path ?? node.name}
          onClick={() => onOpenFile?.(node)}
        >
          <File
            className="filesystem-file-icon ml-[22px] size-5 shrink-0 text-[color:var(--muted)]"
            aria-hidden="true"
          />
          <span className="filesystem-name truncate">{node.name}</span>
        </button>
      )}

      {childrenList}
    </li>
  );
}
