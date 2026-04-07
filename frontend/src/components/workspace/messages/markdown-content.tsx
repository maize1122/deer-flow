"use client";

import {
  Children,
  isValidElement,
  useMemo,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import type { AnchorHTMLAttributes } from "react";

import {
  MessageResponse,
  type MessageResponseProps,
} from "@/components/ai-elements/message";
import { streamdownPlugins } from "@/core/streamdown";
import { cn } from "@/lib/utils";

import { CitationLink } from "../citations/citation-link";

function isExternalUrl(href: string | undefined): boolean {
  return !!href && /^https?:\/\//.test(href);
}

const BLOCK_TAGS = new Set([
  "div",
  "pre",
  "table",
  "ul",
  "ol",
  "blockquote",
  "figure",
  "section",
  "details",
  "dl",
  "dt",
  "dd",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
]);

function hasBlockChild(children: ReactNode): boolean {
  let found = false;
  Children.forEach(children, (child) => {
    if (found) return;
    if (isValidElement(child)) {
      const type = child.type;
      if (typeof type === "string" && BLOCK_TAGS.has(type)) {
        found = true;
        return;
      }
      const dn: string | undefined = (child.props as Record<string, unknown>)?.[
        "data-streamdown"
      ] as string | undefined;
      if (dn === "code-block" || dn === "table-wrapper" || dn === "mermaid-block") {
        found = true;
        return;
      }
      if (
        isValidElement(child) &&
        (child.props as Record<string, unknown>)?.children
      ) {
        if (
          hasBlockChild(
            (child.props as Record<string, unknown>).children as ReactNode,
          )
        ) {
          found = true;
        }
      }
    }
  });
  return found;
}

function SafeParagraph({
  children,
  node: _node,
  ...props
}: HTMLAttributes<HTMLElement> & { node?: unknown }) {
  if (hasBlockChild(children as ReactNode)) {
    return <div {...props}>{children}</div>;
  }
  return <p {...props}>{children}</p>;
}

export type MarkdownContentProps = {
  content: string;
  isLoading: boolean;
  rehypePlugins: MessageResponseProps["rehypePlugins"];
  className?: string;
  remarkPlugins?: MessageResponseProps["remarkPlugins"];
  components?: MessageResponseProps["components"];
};

/** Renders markdown content. */
export function MarkdownContent({
  content,
  rehypePlugins,
  className,
  remarkPlugins = streamdownPlugins.remarkPlugins,
  components: componentsFromProps,
}: MarkdownContentProps) {
  const components = useMemo(() => {
    return {
      p: SafeParagraph,
      a: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => {
        if (typeof props.children === "string") {
          const match = /^citation:(.+)$/.exec(props.children);
          if (match) {
            const [, text] = match;
            return <CitationLink {...props}>{text}</CitationLink>;
          }
        }
        const { className, target, rel, ...rest } = props;
        const external = isExternalUrl(props.href);
        return (
          <a
            {...rest}
            className={cn(
              "text-primary decoration-primary/30 hover:decoration-primary/60 underline underline-offset-2 transition-colors",
              className,
            )}
            target={target ?? (external ? "_blank" : undefined)}
            rel={rel ?? (external ? "noopener noreferrer" : undefined)}
          />
        );
      },
      ...componentsFromProps,
    };
  }, [componentsFromProps]);

  if (!content) return null;

  return (
    <MessageResponse
      className={className}
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={components}
    >
      {content}
    </MessageResponse>
  );
}
