"use client";

import "@opal/components/tag/styles.css";
import type {
  IconFunctionComponent,
  RichStr,
  WithoutStyles,
} from "@opal/types";
import type { TextColor } from "@onyx-ai/shared/contracts";
import { Tooltip } from "@opal/components";
import { toPlainString } from "@opal/components/text/InlineMarkdown";
import { SvgX } from "@opal/icons";
import { Content } from "@opal/layouts";
import { cn } from "@opal/utils";
import { TAG_COLORS, type TagColor } from "@opal/components/tag/colors";
import { useOpalStrings } from "@opal/strings";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TagSize = "sm" | "md";

/**
 * - `"default"`: tinted background, icon and label in the color's text.
 * - `"status"`: tinted background, icon in the color's text, `text-04` label.
 * - `"count"`: no background, icon in the color's text, `text-04` label.
 */
type TagVariant = "default" | "status" | "count";

type TagBaseProps = Omit<
  WithoutStyles<React.HTMLAttributes<HTMLElement>>,
  "title" | "color" | "children" | "onClick"
> & {
  /** Optional icon component. */
  icon?: IconFunctionComponent;

  /** Tag label text. */
  title: string | RichStr;

  /** Color variant. Default: `"gray"`. */
  color?: TagColor;

  /** Look of the passive tag. Default: `"default"`. */
  variant?: TagVariant;

  /** Icon color, when it differs from `color` (a gray pill with an orange icon). */
  iconColor?: TagColor;

  /** Size variant. Default: `"sm"`. */
  size?: TagSize;

  /**
   * Overrides the title colour only; `color` still picks the background, the
   * icon and the value. Holds at rest and yields to an open clickable tag's
   * inverted colours and an editable tag's focus.
   */
  titleColor?: Exclude<TextColor, "inherit">;

  /**
   * Switches to the editable tag (Figma Tag `Type=Editable`): remove button,
   * gray hover, and the dark focus-within treatment chip fields use as the
   * keyboard-selection state before deleting a tag.
   */
  onRemove?: () => void;

  /**
   * Editable only: whether the remove button is a Tab stop. A chip field
   * walks its chips with the arrows and keeps Tab for leaving the field.
   * @default true
   */
  removeInTabOrder?: boolean;

  /** Editable only: dims the tag and hides the remove button. */
  disabled?: boolean;

  /** Secondary text rendered after the title in `text-03`. */
  value?: string | RichStr;

  /**
   * Cap the title width with an ellipsis (120px `sm`, 160px `md`); a cut
   * title shows in full on hover. Editable tags are always capped.
   */
  truncate?: boolean;

  /** Hover tooltip. */
  tooltip?: string;

  /** Warning indicator after the title. */
  error?: boolean;
};

/** Passive or editable tag: the root is a `div`. */
type TagDivProps = TagBaseProps & {
  ref?: React.Ref<HTMLDivElement>;
  onClick?: never;
};

/**
 * Clickable tag: the root is a `button`. As a popover or dropdown trigger it
 * shows the inverted look while `data-state="open"` or `aria-expanded="true"`.
 * A clickable tag cannot be editable.
 */
type TagButtonProps = Omit<TagBaseProps, "disabled"> & {
  /** Only an editable tag can be disabled; a trigger stays operable. */
  disabled?: never;
  ref?: React.Ref<HTMLButtonElement>;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  onRemove?: never;
};

type TagProps = TagDivProps | TagButtonProps;

function isClickableTag(props: TagProps): props is TagButtonProps {
  return props.onClick !== undefined;
}

// ---------------------------------------------------------------------------
// Tag
// ---------------------------------------------------------------------------

// Class of the editable tag's remove control. Exported so composites (chip
// fields) can target it for keyboard flows without a fragile string copy.
const TAG_REMOVE_CLASS = "opal-auxiliary-tag-remove";

function Tag(props: TagProps) {
  const {
    ref: _ref,
    icon,
    title,
    color = "gray",
    variant = "default",
    iconColor,
    size = "sm",
    titleColor,
    onRemove,
    removeInTabOrder = true,
    disabled = false,
    value,
    truncate = false,
    tooltip,
    error = false,
    onClick: _onClick,
    ...rest
  } = props;
  const strings = useOpalStrings();
  const config = TAG_COLORS[color];
  const editable = onRemove !== undefined;

  const className = cn(
    "opal-auxiliary-tag",
    variant !== "count" && config.bg,
    variant === "default" ? config.text : "text-text-04"
  );
  const dataAttrs = {
    "data-size": size,
    "data-type": editable ? "editable" : undefined,
    "data-variant": variant,
    "data-color": color,
    "data-disabled": (editable && disabled) || undefined,
    "data-capped": editable || truncate || undefined,
    "data-fixed-color": iconColor !== undefined || undefined,
  };
  // SAFETY: CSSProperties has no index for custom properties; the object
  // holds only the one custom property the stylesheet reads.
  const iconColorStyle = {
    "--opal-tag-icon-base": TAG_COLORS[iconColor ?? color].fg,
  } as React.CSSProperties;

  const content = (
    <>
      <Content
        sizePreset="secondary"
        variant="section"
        width="fit"
        color="interactive"
        icon={icon}
        title={title}
        titleMaxLines={1}
        titleColor={titleColor}
        suffix={value === undefined ? undefined : toPlainString(value)}
        auxIcon={error ? "warning" : undefined}
      />
      {editable &&
        !disabled && (
          // raw-ok: the remove control is 16px (md) / 12px (sm), and Button's fixed sizes bottom out at 16px, so the tag owns its remove sizing
          <button
            type="button"
            className={TAG_REMOVE_CLASS}
            tabIndex={removeInTabOrder ? undefined : -1}
            aria-label={
              typeof title === "string"
                ? strings.removeItem(title)
                : strings.remove
            }
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          >
            <SvgX />
          </button>
        )}
    </>
  );

  const tag = isClickableTag(props) ? (
    // raw-ok: a tag-shaped trigger (Stack Trace, failed-entity pills) keeps the tag metrics, which no Button size matches
    <button
      ref={props.ref}
      type="button"
      {...rest}
      className={className}
      style={iconColorStyle}
      {...dataAttrs}
      data-clickable="true"
      onClick={props.onClick}
    >
      {content}
    </button>
  ) : (
    <div
      ref={props.ref}
      {...rest}
      className={className}
      style={iconColorStyle}
      {...dataAttrs}
    >
      {content}
    </div>
  );

  return (
    <Tooltip tooltip={tooltip} side="top">
      {tag}
    </Tooltip>
  );
}

export { Tag, TAG_REMOVE_CLASS, type TagProps, type TagSize, type TagVariant };
export { TAG_COLORS, type TagColor } from "@opal/components/tag/colors";
