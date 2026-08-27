Replace the default canvas edges with custom edges that feel easier to follow, easier to click, and support inline labels.

## Implementation

1. Add connection handles to every node
    - place handles on the top, right, bottom and left sides
    - users should be able to connect from any handle to any other handle
    - keep the handles subtle: small white dots with a dark border
    - hide them by default and fade them in when hovering the node

2. Add a default style for the edges.
    - use a light stroke with rounded edges.
    - add an arrowhead at the end of each edge
    -  make new connections use the custom canvas edge renderer

3. Create the custom edge renderer.
    - use clean right-angle routing
    - keep edges slightly dimmed at rest
    - brighten edges when hovered or selected
    -  make edges easier to hover and click without increasing the visible line thickness

4. Add inline edge label editing.
    - double-click and edge to edit its label
    - use React Flow's `EdgeLabelRenderer` and the path     midpoint coordinates from `getSmoothStepPath` to position the label -- do not calculate the label position manually
    - use an input that grows with the label text