# 🌌 Illustrious Studio Engine


## 🚀 Overview
This repository contains the dynamic, fault-tolerant Google Cloud orchestration matrix for the Illustrious Studio Engine's spatial rendering workers. It completely automates the lifecycle of headless, GPU-accelerated (Nvidia Tesla T4) Spot instances running the Lumina2/Juggernaut-Z diffusion pipeline. 

Instead of burning cash on idle compute, this system implements **Zero-to-One Auto-Scaling**. It tracks hardware availability, dynamically hops across geographic zones to find cheap Spot capacity, seeds persistent model storage on-the-fly, and securely proxies frontend HTTPs traffic down to raw backend worker sockets.


![alt text](<Screenshot 2026-06-14 225931.png>) 
![alt text](<Screenshot 2026-06-14 230112.png>) 
![alt text](<Screenshot 2026-06-14 230126.png>) 
![alt text](<Screenshot 2026-06-14 230132.png>)
![alt text](<Screenshot 2026-06-14 230144.png>)

---


## GOALS

1. There is this map set https://lvlworld.com/review/id:1937 that has both a winter and summer version. So i need to make a list of every difference, like one of those eye-for-detail games where you compare two images. Once i have that list, i will build the studio that does each of those things. Using generative neural networks in a cloud-gpu and web workers for the smaller tasks like code edits and model insertions using an LLM in a background worker and customized LORAs. this process gives me a solid scoped path for what tooling to build
2. Import models dynamically from https://github.com/allenai/objaverse-xl lay them out using a custome spatial LORA that does things like insert a bicyle behind the bench.
3. Convert quake 3 maps to point clouds, and add horror elements and flashing lights automatically. like the old levels are breaking down from not being maintained and its possible to fall from one world into another world and eventually into the depths of quake 3 hell.
4. Add BSP, Play Canvas voxel pipeline, and depth based overdraw culling to this example https://sparkjs.dev/examples/splat-painter/index.html
5. one query to the LLM should completely change a world. need to find a technology for pattern matching and texture generation so ceilings become a texture for use in the vector based (as opposed to gaussian based) world.
6. Target - speaking in to a voice LLM and tell minecraft to build any object in objaverse.


## So Far


### 06/17/26

Got ONNX and wLlama models loaded inside a web worker initiator, even though wLlama comes with multi-threaded worker support out of the box. Both of them are loading multiple em-pthreads as workers from inside the initial worker, that reports back to the front-end UI.

I am starting to formulate training data to apply a lora and grammar combination to a gguf that can extract specific elements from language that have specifically to do with orientation related to a base [0,0,0] or related to another object in the description, here's what i forumaled with the help of my highly trained AI

---


## Spatial Lora Training




### 1. Dimension & Anchor Aliases (The Bounding Variables)

This comprehensive list maps natural language spatial concepts directly to your token-minimum layout blocks, accounting for your new distance multipliers (`4fw`, `4fh`), relative directions, and compound placement rules.
These represent the dynamic dimensions, global overrides, syntax hooks, and primitive keys utilized by the layout engine.

| Variable | Definition | Contextual Behavior |
| --- | --- | --- |
| `fw` | Full Width | The complete lateral footprint along the X-axis. |
| `hw` | Half Width | Lateral midpoint offset along the X-axis. |
| `fd` | Full Depth | The complete longitudinal footprint along the Y-axis. |
| `hd` | Half Depth | Longitudinal midpoint offset along the Y-axis. |
| `fh` | Full Height | The complete vertical footprint along the Z-axis. |
| `hh` | Half Height | Vertical midpoint offset along the Z-axis. |
| **`-%`** | Negative Scale | Inverts geometry data or acts as a subtraction mask (CSG Difference). |
| **`sym(X)`** | Lateral Symmetry | Evaluates the block twice: once at `+X` and once at `-X` relative to center. |
| **`surf`** | Surface Anchor | Snaps the child object's pivot directly flush to the parent's outer crust/hull. |
| **`@0`** | Origin Anchor | Explicitly references the very first object (the global scene root). |
| **`@N`** | Target Anchor Pointer | Explicitly references the $N$-th object generated in the current block stream. |
| **`abs`** | Absolute Space Flag | Completely detaches the block from anchor bounding metrics; switches to world units. |
| **`@idx`** | Internal Loop Counter Index | Evaluates index variables inside sequential layout paths to cleanly increment array layouts. |
| **`sphere`** | Primitive Target | Standard UV Sphere or Icosahedron procedural baseline vertex array. |
| **`cone`** | Primitive Target | Radial circular footprint base tapering uniformly to a single polar coordinate apex. |
| **`box`** | Primitive Target | Six-sided rectangular cuboid mesh primitive. |
| **`cylinder`** | Primitive Target | Parallel, flat circular extrusion profiles bounded by a fixed vertical perimeter. |
| **`torus`** | Primitive Target | Swept circular ring path generating a standard continuous coordinate torus. |
| **`capsule`** | Primitive Target | Parallel circular wall bounded at both extrema by matching hemispherical dome ends. |
| **`crescent`** | Primitive Target | Dual offset intersecting arc profiles configured for structural arches or lunar splines. |
| **`mesh`** | Vertex Attribute | Signals the instantiation of a raw complex target asset hull instead of a primitive. |
| **`noise`** | Displacement Attribute | Quantifies an interactive amplitude float passed directly to fragment/vertex shaders for surface distortion (e.g., fuzz, rust). |


---

### 2. Explicit Multiplier Conversions (The "Near & Far" Rule)

To make translation absolute, anytime the user specifies human-scale distance descriptors, the model maps directly to exact bounding multipliers rather than guessing arbitrary float boundaries.

#### A. Distance Multiplier Mapping Table

| Multiplier Shorthand Target | Natural Language Descriptor | Translational Meaning |
| --- | --- | --- |
| `[fw, fd, fh]` base | **"Tightly packed against"** / **"Flush with"** / **"Abutting"** / **"Pressed against"** | Flush boundary contact (zero gap surface-to-surface). |
| `[hw, hd, hh]` | **"Slightly overlapping"** / **"Partially inside"** / **"Piercing"** | Inward intersection by half the anchor's dimensions. |
| `2fw` / `2fd` / `2fh` | **"Near"** / **"Close to"** / **"In the immediate vicinity of"** / **"Alongside"** | Twice the bounding footprint away (leaves exactly one object-width gap). |
| `3fw` / `3fd` / `3fh` | **"A moderate distance from"** / **"A few paces from"** / **"Separated from"** | Three times the bounding footprint away (leaves a clear two-object gap). |
| `4fw` / `4fd` / `4fh` | **"Far away from"** / **"In the distance"** / **"Distant from"** / **"Way off from"** | Four times the bounding footprint away (creates massive spatial decoupling). |
| `[hw, -hd, hh, 0, 0, 0, 0.5]` | **"Peeking out from behind"** / **"Tucked slightly behind"** | Offset back on Y, up on Z, shifted laterally on X, and scaled down by half. |
| `[0, -fd, 0, 0, 0, 0, 1]` | **"Directly behind"** / **"In back of"** / **"Rear of"** | Placed flush against the negative longitudinal (Y) face. |
| `[0, -4fd, 0, 0, 0, 0, 1]` | **"Way behind"** / **"Far in the background"** / **"Distant rear"** | Dropped significantly back along the negative Y axis. |
| `[0, fd, 0, 0, 0, 0, 1]` | **"In front of"** / **"Ahead of"** / **"Forefront of"** | Placed flush against the positive longitudinal (Y) face. |
| `[0, 4fd, 0, 0, 0, 0, 1]` | **"Far ahead"** / **"Way out in front"** / **"Leading"** | Projecting significantly forward along the positive Y axis. |
| `[0, 0, -fh, 0, 0, 0, 1]` | **"Underneath"** / **"Beneath"** / **"Below"** / **"Under"** | Positioned directly underneath the baseline of the anchor object. |
| `[0, 0, -4fh, 0, 0, 0, 1]` | **"Buried deep under"** / **"Sunken beneath"** | Negative vertical tracking mapping far below the ground plane/anchor. |
| `[0, 0, fh, 0, 0, 0, 1]` | **"On top of"** / **"Standing on"** / **"Sitting on"** / **"Resting on"** | Balanced perfectly on the positive vertical (Z) ceiling of the anchor. |
| `[0, 0, 2fh, 0, 0, 0, 1]` | **"Hovering over"** / **"Floating above"** / **"Suspended over"** | Clear air gap on the vertical axis equal to double the anchor height. |
| `[fw, 0, 0, 0, 0, 0, 1]` | **"To the right of"** / **"East of"** / **"Starboard of"** | Flush against the positive lateral (X) edge. |
| `[-fw, 0, 0, 0, 0, 0, 1]` | **"To the left of"** / **"West of"** / **"Portside of"** | Flush against the negative lateral (X) edge. |
| `[fw, fd, 0, 0, 0, 0, 1]` | **"Diagonally front-right"** / **"Off to the front-right"** | Compound translation shifting positive on both X and Y. |
| `[-fw, fd, 0, 0, 0, 0, 1]` | **"Diagonally front-left"** / **"Off to the front-left"** | Compound translation shifting negative on X, positive on Y. |
| `[fw, -fd, 0, 0, 0, 0, 1]` | **"Diagonally back-right"** / **"Off to the back-right"** | Compound translation shifting positive on X, negative on Y. |
| `[-fw, -fd, 0, 0, 0, 0, 1]` | **"Diagonally back-left"** / **"Off to the back-left"** | Compound translation shifting negative on both X and Y. |


#### B. Structural & Boolean Interaction Mapping Table

| Multiplier / Token Target | Natural Language Descriptor | Translational Meaning |
| --- | --- | --- |
| `[-0.2, 0, 0, 0, 0, 0, 0.15]` *(With CSG flag)* | **"Depressed into"** / **"Carved out"** / **"A divet in"** / **"Hollowed"** | Triggers an inverted geometry boolean modifier. Subtracts the volume from the parent mesh. |
| `[sym(hw*0.5), fd, hh, 0, 0, 0, 1]` | **"Equally spaced"** / **"A pair of"** / **"On both sides"** | Spawns two instances mirrored across the central vertical axis of the anchor. |
| `[0, hd, hh, 0, 0, 0, 1]` | **"In the middle front"** / **"Centered on the face"** | X-axis centered, snapped to the positive Y surface edge, at vertical midpoint. |
| `[0, 0, fh, 0, 0, 0, 1]` | **"On top of"** / **"Sprouting from the crest"** | Positioned directly at the apex peak of the vertical bounding volume. |
| `[0, 0, 0, 0, 0, 0, 0.5]` *(Internal)* | **"Encased within"** / **"Submerged inside"** | Center point matches parent center point completely; bounds remain internal. |
| `[0, 0, 0, 0, 0, 0, 1.2]` *(External)* | **"Wrapped around"** / **"Enclosing"** | Parent object is completely inside the boundary volume of this child object. |
| `[0, hd+0.1, hh, 0, 0, 0, 1]` | **"Protruding from"** / **"Sticking out of"** | Positioned just past the outer surface threshold along the normal vector. |
| `[sym(fw), 0, hh, 0, 0, 0, 0.2]` | **"Flanking"** / **"On the sides of"** | Mirrored directly on the outermost left and right structural profiles. |

#### C. Complex Scene and Absolute Positioning Table

| Multiplier / Token Target | Natural Language Descriptor | Translational Meaning |
| --- | --- | --- |
| `[abs][0, 0, 0, 0, 0, 0, 1]` | **"Back at the center"** / **"At the origin"** | Ignores previous object bounds. Snaps directly to the absolute world center $0,0,0$. |
| `[abs][0, 0, 5.0, 0, 0, 0, 1]` | **"Shifted 5 units up"** / **"Moved up higher"** | Applies a strict, non-relational metric translation along the global Z-axis. |
| `[@0][fw, 0, 0, 0, 0, 0, 1]` | **"Relative to the first [Object]"** | Forces the spatial layout engine to calculate bounds using Object 0 instead of the latest object. |
| `[@0, @1][0, 0, 0, 0, 0, 0, 1]` *(Interpolate)* | **"Between [Obj A] and [Obj B]"** | Instructs the parser to find the halfway midpoint between the bounds of Object 0 and Object 1. |
| `[fw*@idx, 0, 0, 0, 0, 0, 1]` | **"Line them up"** / **"In a row"** | Uses an internal loop counter index (`@idx`) to linearly space objects sequentially. |



##### D. Primitive Shape Target Table

| Primitive Token Target | Natural Language Descriptor | Engine Baseline Mesh |
| --- | --- | --- |
| `[sphere]` | **"Sphere"** / **"Ball"** / **"Orb"** / **"Blob"** | Perfect UV Sphere / Icosahedron base. |
| `[cone]` | **"Cone"** / **"Funnel"** / **"Spike"** / **"Pyramid"** | Radial base tapering to a single point. |
| `[box]` | **"Cube"** / **"Box"** / **"Block"** / **"Slab"** | 6-sided rectangular cuboid base. |
| `[cylinder]` | **"Cylinder"** / **"Tube"** / **"Rod"** / **"Pipe"** | Parallel circular bases with a straight wall. |
| `[torus]` | **"Torus"** / **"Donut"** / **"Ring"** / **"Loop"** | A ring with a circular cross-section. |
| `[capsule]` | **"Capsule"** / **"Pill"** / **"Pod"** | Cylinder capped with hemispherical ends. |
| `[crescent]` | **"Moon"** / **"Crescent"** / **"Arch"** | Two intersecting offset arcs (CSG or swept path). |

##### E. Structural Deformation Mapping Table

| Vector Shorthand Transformation | Natural Language Modifier | Geometric Result |
| --- | --- | --- |
| `[1, 1, 2.0]` (Z-dominant) | **"Elongated"** / **"Tall"** / **"Stretched"** | Pulls the primitive vertically into a column/ellipsoid. |
| `[1, 1, 0.2]` (Z-compressed) | **"Flat"** / **"Squashed"** / **"Pancake"** | Flattens the object along its local vertical thickness. |
| `[0.3, 0.3, 1]` (X/Y-compressed) | **"Skinny"** / **"Narrow"** / **"Slender"** | Thins out the lateral footprint while preserving height. |
| `[2.0, 1, 1]` (X-dominant) | **"Wide"** / **"Broad"** / **"Stretched out"** | Expands the lateral horizontal footprint. |
| `[mesh, noise=0.15]` *(Vertex attribute)* | **"Fuzzy"** / **"Rough"** / **"Spiky"** | Passes a displacement noise map to the fragment shader. |



---



### 3. Examples



##### A. Geometric Primitive Vocabulary Mapping

| Token Block | Target Descriptor | Geometric / Morph Behavior |
| --- | --- | --- |
| `[sphere][0,0,0,0,0,0,[1,1,1.5]]` | **1. Elongated Sphere (Anchor Head)** | The base structure scaled taller on the Z-axis. |
| `[sphere][0,0,fh,0,0,0,[1,1,0.2],noise=0.3]` | **2. Fuzzy stuff on top** | Flattened canopy snapped to the head's full height with a vertex displacement modifier. |
| `[sphere][sym(fw),0,hh,0,0,0,0.2]` | **3. Two smaller flat spheres on side (Ears)** | Symmetrically mirrored across the lateral profile at vertical midpoint. |
| `[cone][0,hd,hh,0,0,0,0.25]` | **4. Rounded cone in middle front (Nose)** | Centered on X, pushed forward along the longitudinal face. |
| `[crescent][0,hd+0.05,hh*0.5,0,0,0,[-0.5,1,-0.15]]` | **5. Depressed skinny moon underneath (Mouth)** | Positioned below the nose, using negative scale/CSG flags to cut an inward shape. |
| `[sphere][sym(hw*0.4),hd,hh*1.2,0,0,0,-0.2]` | **6. Two depressed sphere divets (Eyes)** | Symmetrically spaced, front-facing negative volumes to morph eye sockets out of the head mesh. |

#### B. Spatial Direction & Distance Syntax Mapping

Each block structure follows your exact vector format: `[X, Y, Z, Pitch, Yaw, Roll, ScaleFactor]`.

---

##### Vertical Layouts (Z-Axis)

| Token Block | Target Descriptor | Translational Meaning |
| --- | --- | --- |
| `[0, 0, fh, 0, 0, 0, 1]` | **On top of / Standing on** | Directly resting on the top surface. |
| `[0, 0, fh+0.5, 0, 0, 0, 1]` | **Floating over / Above** | Hovering with a clear buffer gap. |
| `[0, 0, hh, 0, 0, 0, 1]` | **Impaled / Halfway through** | Intersecting at the vertical center. |
| `[0, 0, -fh, 0, 0, 0, 1]` | **Underneath / Directly beneath** | Resting on the ground, flush with anchor base. |
| `[0, 0, -fh-0.5, 0, 0, 0, 1]` | **Buried deep under** | Negative vertical clearance. |

##### Lateral / Proximity Layouts (X-Axis)

| Token Block | Target Descriptor | Translational Meaning |
| --- | --- | --- |
| `[fw, 0, 0, 0, 0, 0, 1]` | **Next to / Beside (Right side)** | Flush against the right profile. |
| `[-fw, 0, 0, 0, 0, 0, 1]` | **Next to / Beside (Left side)** | Flush against the left profile. |
| `[2fw, 0, 0, 0, 0, 0, 1]` | **A short distance to the right** | Two full widths away. |
| `[-4fw, 0, 0, 0, 0, 0, 1]` | **Far to the left** | Four full widths away. |
| `[hw, 0, 0, 0, 0, 0, 1]` | **Slightly overlapping to the right** | Offset by half width. |

##### Depth & Occlusion Layouts (Y-Axis)

| Token Block | Target Descriptor | Translational Meaning |
| --- | --- | --- |
| `[0, fd, 0, 0, 0, 0, 1]` | **In front of** | Flush along the positive longitudinal axis. |
| `[0, -fd, 0, 0, 0, 0, 1]` | **Behind / In back of** | Flush against the rear profile. |
| `[0, 4fd, 0, 0, 0, 0, 1]` | **Far ahead / Far in front** | Four full depths forward. |
| `[0, -4fd, 0, 0, 0, 0, 1]` | **Far behind / Far away in the background** | Four full depths backward. |
| `[0, -hd, hh, 0, 0, 0, 0.5]` | **Peeking out from behind** | Tucked slightly back, raised, and shrunk. |

##### Diagonal & Compound Layouts (Multi-Axis)

| Token Block | Target Descriptor | Translational Meaning |
| --- | --- | --- |
| `[fw, fd, 0, 0, 0, 0, 1]` | **Diagonal front-right** | Shifted out right and forward. |
| `[-fw, fd, 0, 0, 0, 0, 1]` | **Diagonal front-left** | Shifted out left and forward. |
| `[fw, -fd, 0, 0, 0, 0, 1]` | **Diagonal back-right** | Shifted out right and backward. |
| `[-fw, -fd, 0, 0, 0, 0, 1]` | **Diagonal back-left** | Shifted out left and backward. |
| `[fw, 0, fh, 0, 0, 0, 1]` | **Perched on the right edge** | Shifted right and flush on top. |

---

#### C. Orientation & Scale Descriptors (Rotational Syntax)

These handle terms indicating posture, direction faced, or sizing variations relative to the anchor block.

| Token Block | Target Descriptor | Translational Meaning |
| --- | --- | --- |
| `[0, 0, 0, 0, 180, 0, 1]` | **Facing away / Opposite direction** | 180° Yaw twist. |
| `[0, 0, 0, 0, 90, 0, 1]` | **Facing sideways / Looking right** | 90° Yaw rotation. |
| `[0, 0, 0, 0, -90, 0, 1]` | **Facing sideways / Looking left** | -90° Yaw rotation. |
| `[0, 0, 0, 90, 0, 0, 1]` | **Toppled over / Face down** | 90° Pitch shift. |
| `[0, 0, 0, -90, 0, 0, 1]` | **Flipped backwards / Upside down** | -90° Pitch shift. |
| `[0, 0, 0, 0, 0, 45, 1]` | **Tilted / Slanted** | 45° Roll variation. |
| `[0, 0, 0, 0, 0, 0, 0.2]` | **Tiny / Miniature / Microscopic** | Scale dropped to 20%. |
| `[0, 0, 0, 0, 0, 0, 3]` | **Giant / Huge / Massive** | Scale multiplied by 3. |


---


#### Example A: 3-Model Relational Chaining (The Stack Pass)

* **Input:** *“A table, a plate on top of the table, and a cup next to the plate.”*
* **Deconstruction:** Object 1 (plate) anchors to Object 0 (table). Object 2 (cup) must anchor specifically to Object 1 (plate), not the table.

| Token Block | Target Descriptor | Contextual Behavior & Geometric Logic |
| --- | --- | --- |
| `[table][0,0,0,0,0,0,1]` | **Object 0: Base Anchor** | Placed at world origin. |
| `[plate][0,0,fh,0,0,0,1]` | **Object 1: Vertical Stack** | Relies on Object 0's full height `fh`. |
| `[cup][@1][fw,0,0,0,0,0,1]` | **Object 2: Lateral Chain** | Explicitly targets Object 1's full width `fw` via the `@1` index. |

#### Example B: Non-Relational / Absolute Positioning Override

* **Input:** *“An elephant at the center, a mouse way off to the right 10 units away, and a bird hovering 5 units directly above the elephant.”*
* **Deconstruction:** The mouse ignores the elephant's footprint and jumps out by fixed units. The bird passes a pointer back to the elephant (`@0`) to calculate its height position, skipping the mouse entirely.

| Token Block | Target Descriptor | Contextual Behavior & Geometric Logic |
| --- | --- | --- |
| `[elephant][0,0,0,0,0,0,1]` | **Object 0: Base Anchor** | Placed at world origin. |
| `[mouse][abs][10.0,0,0,0,0,0,1]` | **Object 1: Absolute Disconnect** | Uses `abs` flag to skip parent scaling, moving 10 linear units out on X. |
| `[bird][@0][0,0,fh+5.0,0,0,0,1]` | **Object 2: Pointer Jump** | Targets Object 0's height via `@0`, then pushes upward by an absolute 5 units. |

#### Example C: The Midpoint Interpolation (Between Rule)

* **Input:** *“A couch on the left, a chair on the right, and a small rug placed right between them.”*
* **Deconstruction:** The parser computes the absolute distance between Object 0 and Object 1, splitting the vector difference down the exact midpoint line.

| Token Block | Target Descriptor | Contextual Behavior & Geometric Logic |
| --- | --- | --- |
| `[couch][-4fw,0,0,0,0,0,1]` | **Object 0: Left Perimeter Anchor** | Pushed out 4 full widths left. |
| `[chair][4fw,0,0,0,0,0,1]` | **Object 1: Right Perimeter Anchor** | Pushed out 4 full widths right. |
| `[rug][@0,@1][0,0,0,0,0,0,0.5]` | **Object 2: Interpolated Center** | Multi-anchor syntax resolves the median space between `@0` and `@1` at half scale. |


---


### 4. Response Fitting Grammar:  Gerganov Backus-Naur Form 

```ebnf

root    ::= (block (ws block)* ws? "\n"?)*
block   ::= primitive anchor? vector

# Primitive definitions or raw model strings
primitive ::= "[" [a-z0-9_-]+ "]"

# Structural qualifiers: [@0], [@0, @1], [abs]
anchor    ::= "[abs]" | "[@" [0-9]+ ("," ws? "@" [0-9]+)* "]"

# Coordinates block: enclosing 7 elements or specific key-value overloads
vector    ::= "[" value ("," ws? value)* "]"

value     ::= expression | scaling | attribute

# Mathematical shorthand expressions, fractions, or raw floats
expression ::= (sign? (term | num)) (op term)?
term       ::= ("sym(" ws? expression ws? ")") | variable | (variable "*" variable) | (variable "*" num)
variable   ::= "fw" | "hw" | "fd" | "hd" | "fh" | "hh" | "@idx"

# Vector math scaling nested brackets: [1,1,1.5] or [-0.5,1,-0.15]
scaling    ::= "[" sign? num "," ws? sign? num "," ws? sign? num "]"

# Vertex attributes: noise=0.15 or mesh
attribute  ::= "noise=" num | "mesh"

# Base scalar primitives
num    ::= [0-9]+ ("." [0-9]+)?
op     ::= "+" | "-" | "*" | "/"
sign   ::= "+" | "-"
ws     ::= [ \t]+

```


---


### 5. Lora Training: Message Format


#### A. Combinitorial Prompt Training Messages

```json
[
  {
    "messages": [
      {"role": "system", "content": "Convert the spatial relationship description into normalized tracking vector blocks. Follow the token-minimum format where the first object mentioned sets the origin root, and all subsequent objects calculate layout relative to anchor bounds or explicit pointers."},
      {"role": "user", "content": "An elongated sphere with fuzzy stuff on top, with two smaller flat spheres on the side about 20% the size of the first sphere, and a rounded cone in the middle front, and a depressed skinny moon underneath about 15% tall and 50% wide for a mouth, and 2 depressed spheres equally spaced divets for eyes."},
      {"role": "assistant", "content": "[sphere][0,0,0,0,0,0,[1,1,1.5]][sphere][0,0,fh,0,0,0,[1,1,0.2],noise=0.3][sphere][sym(fw),0,hh,0,0,0,0.2][cone][0,hd,hh,0,0,0,0.25][crescent][0,hd+0.05,hh*0.5,0,0,0,[-0.5,1,-0.15]][sphere][sym(hw*0.4),hd,hh*1.2,0,0,0,-0.2]"}
    ]
  },
  {
    "messages": [
      {"role": "system", "content": "Convert the spatial relationship description into normalized tracking vector blocks. Follow the token-minimum format where the first object mentioned sets the origin root, and all subsequent objects calculate layout relative to anchor bounds or explicit pointers."},
      {"role": "user", "content": "A table, a plate on top of the table, and a cup next to the plate."},
      {"role": "assistant", "content": "[table][0,0,0,0,0,0,1][plate][0,0,fh,0,0,0,1][cup][@1][fw,0,0,0,0,0,1]"}
    ]
  },
  {
    "messages": [
      {"role": "system", "content": "Convert the spatial relationship description into normalized tracking vector blocks. Follow the token-minimum format where the first object mentioned sets the origin root, and all subsequent objects calculate layout relative to anchor bounds or explicit pointers."},
      {"role": "user", "content": "An elephant at the center, a mouse way off to the right 10 units away, and a bird hovering 5 units directly above the elephant."},
      {"role": "assistant", "content": "[elephant][0,0,0,0,0,0,1][mouse][abs][10.0,0,0,0,0,0,1][bird][@0][0,0,fh+5.0,0,0,0,1]"}
    ]
  },
  {
    "messages": [
      {"role": "system", "content": "Convert the spatial relationship description into normalized tracking vector blocks. Follow the token-minimum format where the first object mentioned sets the origin root, and all subsequent objects calculate layout relative to anchor bounds or explicit pointers."},
      {"role": "user", "content": "A couch on the left, a chair on the right, and a small rug placed right between them."},
      {"role": "assistant", "content": "[couch][-4fw,0,0,0,0,0,1][chair][4fw,0,0,0,0,0,1][rug][@0,@1][0,0,0,0,0,0,0.5]"}
    ]
  },
  {
    "messages": [
      {"role": "system", "content": "Convert the spatial relationship description into normalized tracking vector blocks. Follow the token-minimum format where the first object mentioned sets the origin root, and all subsequent objects calculate layout relative to anchor bounds or explicit pointers."},
      {"role": "user", "content": "A box with a ball floating over it, a capsule buried deep under, and another cylinder topled over face down far to the left."},
      {"role": "assistant", "content": "[box][0,0,0,0,0,0,1][sphere][0,0,fh+0.5,0,0,0,1][capsule][0,0,-fh-0.5,0,0,0,1][cylinder][-4fw,0,0,90,0,0,1]"}
    ]
  },
  {
    "messages": [
      {"role": "system", "content": "Convert the spatial relationship description into normalized tracking vector blocks. Follow the token-minimum format where the first object mentioned sets the origin root, and all subsequent objects calculate layout relative to anchor bounds or explicit pointers."},
      {"role": "user", "content": "A giant pillar with a torus wrapped around it at the vertical center, looking sideways left."},
      {"role": "assistant", "content": "[cylinder][0,0,0,0,0,0,[1,1,3]][torus][0,0,hh,0,-90,0,1.2]"}
    ]
  },
  {
    "messages": [
      {"role": "system", "content": "Convert the spatial relationship description into normalized tracking vector blocks. Follow the token-minimum format where the first object mentioned sets the origin root, and all subsequent objects calculate layout relative to anchor bounds or explicit pointers."},
      {"role": "user", "content": "A small cube that is tightly packed against the front profile of a massive block, flanked by tiny spheres on the sides."},
      {"role": "assistant", "content": "[box][0,0,0,0,0,0,3][box][0,fd,0,0,0,0,0.2][sphere][@0][sym(fw),0,hh,0,0,0,0.2]"}
    ]
  },
  {
    "messages": [
      {"role": "system", "content": "Convert the spatial relationship description into normalized tracking vector blocks. Follow the token-minimum format where the first object mentioned sets the origin root, and all subsequent objects calculate layout relative to anchor bounds or explicit pointers."},
      {"role": "user", "content": "A row of four boxes lined up one after another starting from the center."},
      {"role": "assistant", "content": "[box][0,0,0,0,0,0,1][box][fw*@idx,0,0,0,0,0,1][box][fw*@idx,0,0,0,0,0,1][box][fw*@idx,0,0,0,0,0,1]"}
    ]
  },
  {
    "messages": [
      {"role": "system", "content": "Convert the spatial relationship description into normalized tracking vector blocks. Follow the token-minimum format where the first object mentioned sets the origin root, and all subsequent objects calculate layout relative to anchor bounds or explicit pointers."},
      {"role": "user", "content": "A main sphere with a small capsule sticking out of its front-right diagonal face, slanted slightly."},
      {"role": "assistant", "content": "[sphere][0,0,0,0,0,0,1][capsule][hw,hd+0.1,0,0,0,45,0.3]"}
    ]
  },
  {
    "messages": [
      {"role": "system", "content": "Convert the spatial relationship description into normalized tracking vector blocks. Follow the token-minimum format where the first object mentioned sets the origin root, and all subsequent objects calculate layout relative to anchor bounds or explicit pointers."},
      {"role": "user", "content": "A table at the origin, a book resting on top of the table, a coffee mug sitting directly on top of the book, and an absolute override chair shifted 5 units up in the air away from everything."},
      {"role": "assistant", "content": "[table][0,0,0,0,0,0,1][box][0,0,fh,0,0,0,0.4][cylinder][0,0,fh,0,0,0,0.2][chair][abs][0,0,5.0,0,0,0,1]"}
    ]
  },
  {
    "messages": [
      {"role": "system", "content": "Convert the spatial relationship description into normalized tracking vector blocks. Follow the token-minimum format where the first object mentioned sets the origin root, and all subsequent objects calculate layout relative to anchor bounds or explicit pointers."},
      {"role": "user", "content": "A car base with two pairs of wheels on both sides equally spaced along the bottom width profiles."},
      {"role": "assistant", "content": "[box][0,0,0,0,0,0,[2,1,0.5]][cylinder][sym(hw*0.5),-hd,-hh,0,90,0,0.3][cylinder][sym(hw*0.5),hd,-hh,0,90,0,0.3]"}
    ]
  },
  {
    "messages": [
      {"role": "system", "content": "Convert the spatial relationship description into normalized tracking vector blocks. Follow the token-minimum format where the first object mentioned sets the origin root, and all subsequent objects calculate layout relative to anchor bounds or explicit pointers."},
      {"role": "user", "content": "A hollowed divet in a flat plane serving as a pool basin, with a tiny ladder perched on the right edge."},
      {"role": "assistant", "content": "[box][0,0,0,0,0,0,[4,4,0.1]][box][0,0,0,0,0,0,[-1,1,-0.1]][mesh][@0][fw,0,fh,0,0,0,0.15]"}
    ]
  },
  {
    "messages": [
      {"role": "system", "content": "Convert the spatial relationship description into normalized tracking vector blocks. Follow the token-minimum format where the first object mentioned sets the origin root, and all subsequent objects calculate layout relative to anchor bounds or explicit pointers."},
      {"role": "user", "content": "A tree trunk cylinder, a giant green ball canopy sitting on top of the trunk, and a small fruit sphere hanging directly underneath the canopy."},
      {"role": "assistant", "content": "[cylinder][0,0,0,0,0,0,[0.2,0.2,2]][sphere][0,0,fh,0,0,0,3][sphere][0,0,-fh,0,0,0,0.1]"}
    ]
  },
  {
    "messages": [
      {"role": "system", "content": "Convert the spatial relationship description into normalized tracking vector blocks. Follow the token-minimum format where the first object mentioned sets the origin root, and all subsequent objects calculate layout relative to anchor bounds or explicit pointers."},
      {"role": "user", "content": "A pillar on the far left, another matching pillar far to the right, and a heavy ceiling slab between them resting on their tops."},
      {"role": "assistant", "content": "[cylinder][-4fw,0,0,0,0,0,1][cylinder][4fw,0,0,0,0,0,1][box][@0,@1][0,0,fh,0,0,0,1]"}
    ]
  },

```


---

#### B. Inset Complex Training Messages

```json

  {
    "messages": [
      {"role": "user", "content": "A standard monitor screen box with two small speakers flanking its outer left and right sides."},
      {"role": "assistant", "content": "[box][0,0,0,0,0,0,[1.5,0.1,1]][box][sym(fw),0,hh,0,0,0,0.3]"}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "A house roof crescent perched on the right edge of a massive stone foundation slab."},
      {"role": "assistant", "content": "[box][0,0,0,0,0,0,[4,4,1]][crescent][fw,0,fh,0,0,0,1]"}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "An archway frame consisting of a post cylinder on the left, a post cylinder on the right, and a curved torus section resting right between them."},
      {"role": "assistant", "content": "[cylinder][-3fw,0,0,0,0,0,2][cylinder][3fw,0,0,0,0,0,2][torus][@0,@1][0,0,fh,90,0,0,1]"}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "A target bullseye board with a concentric smaller sphere encased completely within its interior volume."},
      {"role": "assistant", "content": "[cylinder][0,0,0,90,0,0,[2,2,0.1]][sphere][0,0,0,0,0,0,0.5]"}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "A high-precision laser array where three emitting tubes line them up in a row staring way ahead forward."},
      {"role": "assistant", "content": "[cylinder][0,0,0,0,90,0,0.5][cylinder][fw*@idx,0,0,0,90,0,0.5][cylinder][fw*@idx,0,0,0,90,0,0.5]"}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "A giant central statue, a stone path leading out from in front of it, and a tiny signpost perched on the right edge of that path."},
      {"role": "assistant", "content": "[mesh][0,0,0,0,0,0,4][box][0,4fd,0,0,0,0,[1,4,0.1]][box][fw,0,fh,0,0,0,0.2]"}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "A smooth landscape plane with an absolute coordinate platform shifted 5 units up, and a drone capsule hovering over that platform."},
      {"role": "assistant", "content": "[box][0,0,0,0,0,0,[10,10,0.1]][box][abs][0,0,5.0,0,0,0,1][capsule][0,0,fh+0.5,0,0,0,0.3]"}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "A large crate box with a spiky protective shield wrapping around it tightly."},
      {"role": "assistant", "content": "[box][0,0,0,0,0,0,1.5][box][0,0,0,0,0,0,1.2,noise=0.4]"}
    ]
  }

]

```


#### C. Positonal Training Lora Messages

```json
[
  {
    "messages": [
      {"role": "user", "content": "A giant box shifted 5 units up higher in the air away from everything."},
      {"role": "assistant", "content": "[box][abs][0,0,5.0,0,0,0,3]"}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "A standard cylinder flipped completely backwards and upside down at the origin."},
      {"role": "assistant", "content": "[cylinder][0,0,0,-90,0,0,1]"}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "A capsule way off to the right 10 units away in world space."},
      {"role": "assistant", "content": "[capsule][abs][10.0,0,0,0,0,0,1]"}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "A tiny miniature sphere facing sideways looking right."},
      {"role": "assistant", "content": "[sphere][0,0,0,0,90,0,0.2]"}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "A rough spiky mesh primitive toppled over face down at world center."},
      {"role": "assistant", "content": "[mesh][abs][0,0,0,90,0,0,1,noise=0.15]"}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "An elongated torus tilted and slanted at a forty five degree angle."},
      {"role": "assistant", "content": "[torus][0,0,0,0,0,45,[1,1,2.0]]"}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "A flat squashed crescent base facing away in the opposite direction."},
      {"role": "assistant", "content": "[crescent][0,0,0,0,180,0,[1,1,0.2]]"}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "A slender skinny cone projecting far ahead along the forward vector."},
      {"role": "assistant", "content": "[cone][0,4fd,0,0,0,0,[0.3,0.3,1]]"}
    ]
  }
]
```


---



## So Far (Continued)



### 06/15/26


That repository is an absolute goldmine for this specific use case. Leveraging Project Euler solutions written across dozens of different languages means you get highly representative, idiomatic structural code blocks solving the exact same algorithmic math problems.

By restructuring that repository into your conversational JSON format, you are building a highly effective instruction alignment set.

---

#### Expanding Your Neural Patch: ASI and Spell-Checking

Once you have this baseline classification working, your intuition about expanding into **ASI (Automatic Semicolon Insertion)** or **Syntax/Spell-Checking** is spot on. You can use the exact same base model (`Qwen2.5-0.5B`) and target the exact same low-rank attention paths (`["q_proj", "v_proj", "k_proj", "o_proj"]`) to execute those specific code transformations.

The only things that need to change are your **System Instruction** and the **Target Completion Template**.

##### 1. The Automatic Semicolon Insertion (ASI) / Code Formatter Patch

Instead of asking for a single-token identifier name, you train the model to look for raw, minified, or loosely styled snippets and complete them with structural precision.

```json
{
  "messages": [
    {"role": "system", "content": "Analyze the input code. Enforce strict line-terminating semicolons, fix indentation boundaries, and return only the corrected source text."},
    {"role": "user", "content": "const x = 5\nlet y = 10\nconsole.log(x + y)"},
    {"role": "assistant", "content": "const x = 5;\nlet y = 10;\nconsole.log(x + y);"}
  ]
}

```

##### 2. The Code Spell-Check / Typo Correction Patch

You can pollute your training inputs with deliberate typos in variable declarations, common property names, or method invocations, and provide the exact clean compilation target.

```json
{
  "messages": [
    {"role": "system", "content": "Locate typographic errors in keywords, syntax elements, or method identifiers. Output only the corrected code snippet."},
    {"role": "user", "content": "functon calculateTotal(prce, quantty) {\n    return prce * quantty;\n}"},
    {"role": "assistant", "content": "function calculateTotal(price, quantity) {\n    return price * quantity;\n}"}
  ]
}

```

---

#### The Big Architectural Advantage

Because your `chat-agent.py` server is now using a compiled, **unified matrix fusion step** on startup (`peft_wrapper.merge_and_unload()`), you can build an array of independent micro-adapters on your desktop drive:

* `loras/code_classifier_lora`
* `loras/code_asi_formatter_lora`
* `loras/code_spellcheck_lora`

Whenever you want to switch your agent from being a lightning-fast router to an inline code-linter, you just update your disk variable pointer path, restart your server instance, and let it seamlessly rebuild its base layer paths. You get tailored, enterprise-grade tooling adjustments inside a 500-million parameter model footprint that runs natively on standard computer hardware.




### 06/14/26



#### 🏗️ Architecture & Core Components

The backend is decoupled into three distinct microservice routes (runnable locally for debug or deployable as separate Google Cloud Functions):

##### 1. `clusterManager` (The Brain)
* **Endpoint:** `/api/cluster/status`
* **Role:** Tracks the live state of the compute horizon. 
* **Mechanics:** * Queries GCP for running or staging worker instances (`illustrious-juggernaut-worker-node`).
  * If the pool is empty, it triggers the `bootGpu` service to scale up.
  * **Failover Engine:** If the default zone (`us-central1-a`) is exhausted of Spot GPUs, it automatically pivots the entire infrastructure pool to backup zones (e.g., `us-central1-f`, `us-east1-c`).
  * **Diagnostic extraction:** Intercepts serial port boot logs for crashed machines to pass raw kernel/preemption errors down to the client canvas.

##### 2. `bootGpu` (The Muscle)
* **Endpoint:** `/api/cluster/allocate` (Usually triggered internally by `clusterManager`)
* **Role:** Provisions the physical hardware, handles disk orchestration, and bootstraps the ML environment.
* **Mechanics:**
  * **Image Recon:** Dynamically queries Google's public registries to find the latest valid `debian-11` OS image, bypassing hardcoded deprecation traps.
  * **Mode A (Seeding):** If the permanent Juggernaut-Z vault (`illustrious-juggernaut-z-vault`) is missing or unformatted in the target zone, it spins up a temporary seeder node, formats the SSD to `ext4`, pulls the 6B parameter weights directly from HuggingFace, and self-destructs.
  * **Mode B (Production):** Once the disk is `READY`, it attaches the vault in `READ_ONLY` mode (allowing concurrent multi-node attachment) and boots the GPU worker with an injected Python FastAPI agent.

##### 3. `spatialRelay` (The Network Bridge)
* **Endpoint:** `/api/spatial/relay`
* **Role:** Bypasses browser Mixed-Content (HTTPS -> HTTP) security blocks.
* **Mechanics:** Acts as a secure, streaming pass-through. It accepts `multipart/form-data` (spatial coordinates and image slices) from the secure frontend canvas, pipes it directly into the raw IP of the active worker node, and streams the generated JPEG binary back to the user seamlessly.

##### 4. `worker-agent.py` (The Artist)
* **Role:** The headless FastAPI inference engine running directly on the GPU node.
* **Mechanics:** * Loads `RunDiffusion/Juggernaut-Z-Image` into VRAM at `fp16` precision.
  * Accepts spatial coordinate maps (X, Y, W, H) and base image slices.
  * Executes the diffusion pipeline and composites the generated "infected layer" back into the staging matrix before streaming it back.

---

#### ⚔️ The War Room: Challenges Solved

We didn't just write a script; we fought through the GCP hypervisor to make it bulletproof. Here is the historical ledger of dragons slain:

* **The SDK Client Migration:** Bypassed the legacy `new Compute()` monolithic wrapper (which threw `not a constructor` errors locally) and successfully migrated to the modern Gapic sub-clients (`InstancesClient`, `DisksClient`, `ImagesClient`).
* **The Auth Matrix Bypass:** Solved Windows local Application Default Credentials (ADC) failures by extracting active OAuth2 session tokens from the Express middleware and piping them directly into the Google Cloud API constructors in real-time.
* **The OS Image Deprecation Trap:** Google quietly deleted the `common-cu121-debian-11-py310` image families. Built a dynamic `resolveActiveImage` scanner that queries multiple projects to ensure the system always finds a bootable OS.
* **The Ghost Disk Locks:** Fixed a race condition where GCP threw a `400 Bad Request: resourceInUseByAnotherResource`. The manager now actively scans for "zombie" seeder disks that failed to detach properly, issuing asynchronous purge commands to shred them before attempting a new worker boot.
* **The `ZONE_RESOURCE_POOL_EXHAUSTED` Drought:** When Google ran entirely out of cheap Tesla T4 cards in `us-central1-a`, the script threw cryptic serial port lockouts. Built a multi-region failover matrix (`resolveOperationalZone`) that actively queries hardware availability and shifts the infrastructure to a new zone instantly.

---

#### 🔮 Future Plans & Next Steps

1. **Frontend Canvas Hookup:** Wire the React/Web application to consume the `CLUSTER_MANAGER_URL` and map the visual hardware staging states (`STAGING`, `INITIALIZING_STORAGE`, `ACTIVE`).
2. **Telemetry Dashboards:** Add a real-time log ingestion view to the front-end so users can watch the `worker.log` `apt-get` and `pip` installation streams as the node boots.
3. **Scaling the Horizon:** Currently hardcoded to `GPU_COUNT: 1` and a single node setup. The `READ_ONLY` disk architecture supports dozens of simultaneous nodes—ready to be upgraded to a load-balanced array once user demand spikes.
4. **Automated Reaper:** Implement a background cron-job that pings the `clusterManager` to kill any workers that have been idle for more than 15 minutes to aggressively protect billing quotas.

---
*Built for the Illustrious Studio Engine.*