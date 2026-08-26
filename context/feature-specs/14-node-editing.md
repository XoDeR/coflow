Add resizing and inline label editing to canvas nodes.

## Implementation

1. Add resizing.
    - selected nodes should show resize handles
    - prevent nodes from being resized below a minimum size
    - keep resize handles subtle and consistent with the dark canvas UI

2. Add inline label editing.
    - keep the node label centered inside the node
    - double-click the center/labe area of a node to edit it's label
    - show placeholder text in the same centered position when the label is empty
    - keep editing smooth without causing layout shifts
    - show a textarea directly over the label while editing
    - update the label as users type
    - close editing on blur or `Escape`
    - prevent text editing interactions from dragging or panning the canvas

3. Keep all node updates connected to the existing collaborative canvas state.

## Scope limits

- don't change shape rendering from the previous unit
- don't change the shape panel or drag preview
- don't change how dropped nodea are created
- keep this focused on resize and label editing only

## Check When Done

- Selected nodes show resize handlers
- Node label can be edited