# Tag

**Import:** `import { Tag, type TagProps } from "@opal/components";`

A small colored label used to annotate items with status, category, or metadata. Two types, matching the Figma `Tag` component:

- **Passive** (default): metadata label. 1rem tall at `sm`, 1.375rem at `md`. The icon, title, value and warning are a `Content` (`secondary` preset) at both sizes.
- **Editable** (`onRemove` set): a gray `Interactive.Stateless` chip with a remove `Button` (marked `TAG_REMOVE_ATTR` for chip-field keyboard flows), and a dark focus-within treatment chip fields use as the keyboard-selection state before deleting a tag. It takes no `color`.
- **Clickable** (`onClick` set): a gray `Interactive.Stateless` button with the tag metrics. As a popover or dropdown trigger (`aria-haspopup`) it shows the hover look while open, as `Button` does. With `aria-pressed` it is a filter toggle (`Interactive.Stateful`, `select-filter`): inverted while pressed. It takes no `color`; an `iconColor` keeps its colour.

The passive look comes in three variants:

| Variant   | Background        | Icon             | Label            | Use                                     |
| --------- | ----------------- | ---------------- | ---------------- | --------------------------------------- |
| `default` | the color's `-01` | the color's text | the color's text | Category and metadata labels            |
| `status`  | the color's `-01` | the color's text | `text-04`        | Status pills (Indexing, Paused, Failed) |
| `count`   | none              | the color's text | `text-04`        | Warning and failure counts in rows      |


## Props

| Prop               | Type                                   | Default           | Description                                                                                                                                                                                        |
| ------------------ | -------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`            | `string \| RichStr`                    | **(required)**    | Tag label text                                                                                                                                                                                     |
| `color`            | `TagColor`                             | `"gray"`          | Color variant. Passive tags only: `onClick` and `onRemove` tags are always gray |
| `variant`          | `"default" \| "status" \| "count"`     | `"default"`       | Passive look: colored label, `text-04` label on a tint, or `text-04` label with no background. A clickable or editable `count` tag has no background |
| `iconColor`        | `TagColor`                             | `color`           | Icon color when it differs from `color` (a gray pill with an orange warning icon)                                                                                                                  |
| `onClick`          | `MouseEventHandler<HTMLButtonElement>` | —                 | Renders the tag as a gray Interactive button. Not allowed with `onRemove` or `color`. `ref` is then a `Ref<HTMLButtonElement>`; otherwise a `Ref<HTMLDivElement>` |
| `icon`             | `IconFunctionComponent`                | —                 | Optional icon before the title                                                                                                                                                                     |
| `size`             | `"sm" \| "md"`                         | `"sm"`            | Size variant (Figma Small / Regular)                                                                                                                                                               |
| `titleColor`       | `Exclude<TextColor, "inherit">`        | per `color`       | Overrides the title colour only, as `Content`'s `titleColor` does; `color` still picks the background, icon and value. Yields to an open clickable tag, an editable tag's focus and a disabled tag |
| `removeInTabOrder` | `boolean`                              | `true`            | Editable only: whether the remove button is a Tab stop. Chip fields set it off and walk chips with the arrows                                                                                      |
| `onRemove`         | `() => void`                           | —                 | Switches to the gray editable type and renders the remove button. Not allowed with `color` |
| `disabled`         | `boolean`                              | `false`           | Passive and editable: dims the whole tag (`Disabled`) and hides the remove button. The `tooltip` then shows the reason |
| `value`            | `string \| RichStr`                    | —                 | Secondary text after the title, in `text-03`                                                                                                                                                       |
| `truncate`         | `boolean`                              | `false`           | Cap the title at 120px (`sm`) / 160px (`md`) with an ellipsis; a cut title shows in full on hover. Editable tags are always capped                                                                  |
| `tooltip`          | `string`                               | —                 | Hover tooltip                                                                                                                                                                                      |
| `error`            | `boolean`                              | `false`           | Warning indicator after the title (no Figma variant, exists for chip-field validation)                                                                                                             |

### `TagColor`

`"green" | "blue" | "purple" | "amber" | "orange" | "red" | "gray" | "white"`

| Color    | Background           | Text                                       |
| -------- | -------------------- | ------------------------------------------ |
| `green`  | `theme-green-01`     | `theme-green-05`                           |
| `blue`   | `theme-blue-01`      | `theme-blue-05`                            |
| `purple` | `theme-purple-01`    | `theme-purple-05`                          |
| `amber`  | `theme-amber-01`     | `theme-amber-05`                           |
| `orange` | `status-warning-01`  | `status-warning-05`                        |
| `red`    | `status-error-01`    | `status-error-05`                          |
| `gray`   | `background-tint-02` | `text-03` |
| `white`  | `background-tint-00` | `text-04`, for a pill on a tinted row      |

## Usage Examples

```tsx
import { Tag } from "@opal/components";
import SvgStar from "@opal/icons/star";

// Basic
<Tag title="New" color="green" />

// With icon
<Tag icon={SvgStar} title="Featured" color="purple" />

// Editable (chip): remove button, hover, focus states
<Tag title="filter:owner" onRemove={() => removeFilter(id)} />

// Editable with secondary value
<Tag title="env" value="production" size="md" onRemove={() => {}} />

// Status pill: tinted background, colored icon, text-04 label
<Tag icon={SvgPause} title="Paused" color="amber" variant="status" font="secondary-body" />

// Gray pill with an orange icon
<Tag icon={SvgAlertTriangle} title="3 warnings" iconColor="orange" variant="status" />

// Count: no background, colored icon, text-04 number
<Tag icon={SvgAlertTriangle} title="12" color="orange" variant="count" />

// Clickable trigger: inverts while the popover is open
<Popover>
  <Popover.Trigger asChild>
    <Tag icon={SvgAlertCircle} title="Stack Trace" color="red" variant="status" onClick={() => {}} />
  </Popover.Trigger>
  <Popover.Content>…</Popover.Content>
</Popover>

// Truncated passive tag with the default title tooltip
<Tag title="A very long label" truncate />
```

## Usage inside Content

Tag can be rendered as an accessory inside `Content`'s ContentMd via the `tag` prop:

```tsx
import { Content } from "@opal/layouts";
import SvgSearch from "@opal/icons/search";

<Content
  icon={SvgSearch}
  sizePreset="main-ui"
  title="My Item"
  tag={{ title: "New", color: "green" }}
/>;
```
