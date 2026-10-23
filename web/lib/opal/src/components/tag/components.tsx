"use client";

import "@opal/components/tag/styles.css";
import type {
  IconFunctionComponent,
  RichStr,
  WithoutStyles,
} from "@opal/types";
import type { TextColor } from "@onyx-ai/shared/contracts";
import { Button, Tooltip } from "@opal/components";
import { resolveTriggerInteraction } from "@opal/components/buttons/trigger-interaction";
import { Disabled, Interactive } from "@opal/core";
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

  /**
   * Look of the tag. A clickable or editable tag reads `"count"` as no
   * background, and the others as the gray fill. Default: `"default"`.
   */
  variant?: TagVariant;

  /** Icon color, when it differs from the tag's (a gray pill with an orange icon). */
  iconColor?: TagColor;

  /** Size variant. Default: `"sm"`. */
  size?: TagSize;

  /**
   * Overrides the title colour only; the tag's colour still picks the
   * background, the icon and the value.
   */
  titleColor?: Exclude<TextColor, "inherit">;

  /** Secondary text rendered after the title in `text-03`. */
  value?: string | RichStr;

  /**
   * Cap the title width with an ellipsis (120px `sm`, 160px `md`); a cut
   * title shows in full on hover. Editable tags are always capped.
   */
  truncate?: boolean;

  /** Hover tooltip; on a disabled tag it explains why. */
  tooltip?: string;

  /** Warning indicator after the title. */
  error?: boolean;
};

/** Passive tag: a coloured label, the root is a `div`. */
type TagPassiveProps = TagBaseProps & {
  ref?: React.Ref<HTMLDivElement>;
  /** Color variant. Only a passive tag has one. Default: `"gray"`. */
  color?: TagColor;
  /** Dims the whole tag. */
  disabled?: boolean;
  onClick?: never;
  onRemove?: never;
  removeInTabOrder?: never;
};

/**
 * Editable tag (Figma Tag `Type=Editable`): a gray `Interactive` chip with a
 * remove button, and the dark focus-within treatment chip fields use as the
 * keyboard-selection state before deleting a tag.
 */
type TagEditableProps = TagBaseProps & {
  ref?: React.Ref<HTMLDivElement>;
  /** Always gray: an editable tag has no colour. */
  color?: never;
  /** Unset, the tag is a passive gray one. */
  onRemove?: () => void;
  /**
   * Whether the remove button is a Tab stop. A chip field walks its chips
   * with the arrows and keeps Tab for leaving the field.
   * @default true
   */
  removeInTabOrder?: boolean;
  /** Dims the whole tag and hides the remove button. */
  disabled?: boolean;
  onClick?: never;
};

/**
 * Clickable tag: a gray `Interactive` button. As a popover or dropdown
 * trigger it shows the hover look while open, as `Button` does.
 */
type TagButtonProps = TagBaseProps & {
  ref?: React.Ref<HTMLButtonElement>;
  /** Always gray: a clickable tag has no colour. */
  color?: never;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  /** A trigger stays operable. */
  disabled?: never;
  onRemove?: never;
  removeInTabOrder?: never;
};

type TagProps = TagPassiveProps | TagEditableProps | TagButtonProps;

function isClickableTag(props: TagProps): props is TagButtonProps {
  return props.onClick !== undefined;
}

// ---------------------------------------------------------------------------
// Tag
// ---------------------------------------------------------------------------

// Attribute on the editable tag's remove button. Exported so composites
// (chip fields) can target it for keyboard flows without a fragile string
// copy.
const TAG_REMOVE_ATTR = "data-opal-tag-remove";

function Tag(props: TagProps) {
  const {
    ref: _ref,
    icon,
    title,
    color: _color,
    variant = "default",
    iconColor,
    size = "sm",
    titleColor,
    onRemove,
    removeInTabOrder: _removeInTabOrder,
    disabled = false,
    value,
    truncate = false,
    tooltip,
    error = false,
    onClick: _onClick,
    ...rest
  } = props;
  const strings = useOpalStrings();
  const editable = onRemove !== undefined;
  const clickable = isClickableTag(props);
  const interactive = editable || clickable;
  const color: TagColor =
    !interactive && props.color !== undefined ? props.color : "gray";
  const config = TAG_COLORS[color];

  const className = interactive
    ? "opal-auxiliary-tag"
    : cn(
        "opal-auxiliary-tag",
        variant !== "count" && config.bg,
        variant === "default" ? config.text : "text-text-04"
      );
  const dataAttrs = {
    "data-size": size,
    "data-type": editable ? "editable" : undefined,
    "data-variant": variant,
    // Only a passive tag colours itself; Interactive colours the others.
    "data-color": interactive ? undefined : color,
    "data-capped": editable || truncate || undefined,
    "data-fixed-color": iconColor !== undefined || undefined,
  };
  // SAFETY: CSSProperties has no index for custom properties; the object
  // holds only the one custom property the stylesheet reads.
  const iconColorStyle =
    !interactive || iconColor !== undefined
      ? ({
          "--opal-tag-icon-color": TAG_COLORS[iconColor ?? color].fg,
        } as React.CSSProperties)
      : undefined;

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
      {editable && !disabled && (
        <Button
          // The literal of TAG_REMOVE_ATTR: JSX takes no computed names.
          data-opal-tag-remove=""
          icon={SvgX}
          prominence="internal"
          size="2xs"
          tabIndex={props.removeInTabOrder === false ? -1 : undefined}
          aria-label={
            typeof title === "string"
              ? strings.removeItem(title)
              : strings.remove
          }
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        />
      )}
    </>
  );

  let tag: React.ReactNode;
  if (clickable) {
    // A popup trigger takes the hover look while open, as Button does.
    const popup = rest["aria-haspopup"];
    const isPopupTrigger =
      popup !== undefined && popup !== false && popup !== "false";
    const interaction = isPopupTrigger
      ? resolveTriggerInteraction(undefined, rest)
      : "rest";
    const pressed = rest["aria-pressed"];
    const button = (
      <button
        ref={props.ref}
        type="button"
        {...rest}
        className={className}
        style={iconColorStyle}
        {...dataAttrs}
      >
        {content}
      </button>
    );
    // A toggle (aria-pressed) is a filter chip: it shows its pressed state.
    tag =
      pressed !== undefined ? (
        <Interactive.Stateful
          variant="select-filter"
          state={pressed === true || pressed === "true" ? "selected" : "empty"}
          interaction={interaction}
          type="button"
          onClick={props.onClick}
        >
          {button}
        </Interactive.Stateful>
      ) : (
        <Interactive.Stateless
          variant="default"
          prominence={variant === "count" ? "tertiary" : "secondary"}
          interaction={interaction}
          type="button"
          onClick={props.onClick}
        >
          {button}
        </Interactive.Stateless>
      );
  } else {
    const root = (
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
    tag = editable ? (
      <Interactive.Stateless
        variant="default"
        prominence={variant === "count" ? "tertiary" : "secondary"}
      >
        {root}
      </Interactive.Stateless>
    ) : (
      root
    );
  }

  // A disabled tag dims as a whole; its tooltip says why.
  if (disabled) {
    return (
      <Disabled disabled tooltip={tooltip} tooltipSide="top">
        {tag}
      </Disabled>
    );
  }
  return (
    <Tooltip tooltip={tooltip} side="top">
      {tag}
    </Tooltip>
  );
}

export { Tag, TAG_REMOVE_ATTR, type TagProps, type TagSize, type TagVariant };
export { TAG_COLORS, type TagColor } from "@opal/components/tag/colors";
