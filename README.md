# 🌌 Illustrious Studio Engine


## 🚀 Overview
This repository contains the dynamic, fault-tolerant Google Cloud orchestration matrix for the Illustrious Studio Engine's spatial rendering workers. It completely automates the lifecycle of headless, GPU-accelerated (Nvidia Tesla T4) Spot instances running the Lumina2/Juggernaut-Z diffusion pipeline. 

Instead of burning cash on idle compute, this system implements **Zero-to-One Auto-Scaling**. It tracks hardware availability, dynamically hops across geographic zones to find cheap Spot capacity, seeds persistent model storage on-the-fly, and securely proxies frontend HTTPs traffic down to raw backend worker sockets.

![alt text](<Screenshot 2026-06-22 133059.png>) 
![alt text](<Screenshot 2026-06-22 133929.png>) 

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
7. TODO: enabled cache reserve, start an HF account, or switch to google for distribution, whichever is cheaper. Can't have 1,000 people downloading 300MB out of my GitHub account probably.



## So Far


### 06/17/26

Got ONNX and wLlama models loaded inside a web worker initiator, even though wLlama comes with multi-threaded worker support out of the box. Both of them are loading multiple em-pthreads as workers from inside the initial worker, that reports back to the front-end UI.

I am starting to formulate training data to apply a lora and grammar combination to a gguf that can extract specific elements from language that have specifically to do with orientation related to a base [0,0,0] or related to another object in the description, here's what i forumaled with the help of my highly trained AI

---


## Spatial Lora Training


### 0. The Spatial Breakdown:

```text
[  X,  Y,  Z,  Pitch,  Yaw,  Roll,  Scale  ]
└─ Position ┘   └─── Angle ───┘   └ Size ┘
```


* **`X` (`hw`):** Moves it forward/backward.
* **`Y` (`-hd`):** Moves it left/right.
* **`Z` (`hh`):** Moves it up/down.


* **`Pitch` (`0`):** Nods/tilts forward or backward.
* **`Yaw` (`0`):** Swivels/twists left or right.
* **`Roll` (`0`):** Leans or banks side-to-side.


* **`Scale` (`0.5`):** Multiplies the overall object volume uniformly. In this case, shrinking the object down to half its normal size. *(Note: If this field is a nested array like `[1.2, 1.2, 0.8]`, it scales the Width, Depth, and Height independently).*

#### Two stone pillars holding up a heavy steel crossbeam mesh across the top.

##### Output: `[cylinder][-3fw,0,0,0,0,0,1.5][cylinder][3fw,0,0,0,0,0,1.5][mesh][@0,@1][0,0,fh,0,0,0,[6.2,0.4,0.2]]`

![natural](Gemini_Generated_Image_b15bf0b15bf0b15b.png)

### 1. Dimension & Anchor Aliases (The Bounding Variables)

This comprehensive list maps natural language spatial concepts directly to your token-minimum layout blocks, accounting for your new distance multipliers (`4fw`, `4fh`), relative directions, and compound placement rules.
These represent the dynamic dimensions, global overrides, syntax hooks, and primitive keys utilized by the layout engine.

```
parseSpatialCommands('[red balloon][0,0,0,0,0,0,1][elephant][0,fd*@idx,0,0,0,0,1]')
```

Its an implied `1fw*@idx` would be adding 1 full width of the previous, as opposed to `-/+@idx` or `@idx-fw` precise translations would be the same as subtracting a full width just like the scalar, but it also allows for exact values like @idx-100 would be the previous object `x - 100` units 



| Variable | Definition | Contextual Behavior |
| --- | --- | --- |
| `fw` | Full Width | The complete lateral footprint along the X-axis. |
| `hw` | Half Width | Lateral midpoint offset along the X-axis. |
| `fd` | Full Depth | The complete longitudinal footprint along the Y-axis. |
| `hd` | Half Depth | Longitudinal midpoint offset along the Y-axis. |
| `fh` | Full Height | The complete vertical footprint along the Z-axis. |
| `hh` | Half Height | Vertical midpoint offset along the Z-axis. |
| **`-%`** | Negative Scale | Inverts geometry data or acts as a subtraction mask (CSG Difference). |
| **`abs`** | Coordinate Override Flag | **Absolute Space:** Fully detaches the current object from the relative bounding metrics of the anchor chain; switches to raw metric coordinates directly in global world space. |
| **`@0`** | Static Reference Pointer | **Global Scene Root:** Short-circuits the local stacking chain to calculate distance, scale, or height properties relative to the absolute origin object of the entire canvas. |
| **`@N`** | Index Reference Pointer | **Target Anchor Jump:** Forces the layout engine to reference the dimensions and positions of the $N$-th item generated in the block stream instead of the immediate parent block. |
| **`@0, @1`** | Interpolation Selector | **Multi-Anchor Midpoint:** Instructs the parser to compute the bounding centroids of both referenced objects, split the vector difference, and locate the child at the exact spatial median. |
| **`@idx`** | Iteration Index | **Loop Counter Step:** Pulls the current index loop integer from a sequential path string, allowing linear incremental spacing along an axis (e.g., `fw * @idx`). |
| **`sym(X)`** | Rotational/Lateral Operator | **Symmetric Mirror:** Triggers a dual-evaluation loop inside the engine, passing a positive translation string ($+X$) and an identical inverted translation string ($-X$) across the center line. |
| **`surf`** | Raycast Alignment Operator | **Surface Snapping:** Directs the engine to cast a bounding hull ray to find the outer crust/polygon boundary of the parent mesh, aligning the child’s pivot flush against the outer geometry wall. |
| **`sphere`** | Primitive Target | Standard UV Sphere or Icosahedron procedural baseline vertex array. |
| **`cone`** | Primitive Target | Radial circular footprint base tapering uniformly to a single polar coordinate apex. |
| **`box`** | Primitive Target | Six-sided rectangular cuboid mesh primitive. |
| **`cylinder`** | Primitive Target | Parallel, flat circular extrusion profiles bounded by a fixed vertical perimeter. |
| **`torus`** | Primitive Target | Swept circular ring path generating a standard continuous coordinate torus. |
| **`capsule`** | Primitive Target | Parallel circular wall bounded at both extrema by matching hemispherical dome ends. |
| **`crescent`** | Primitive Target | Dual offset intersecting arc profiles configured for structural arches or lunar splines. |
| **`mesh`** | Vertex Attribute | Signals the instantiation of a raw complex target asset hull instead of a primitive. |
| **`noise`** | Displacement Attribute | Quantifies an interactive amplitude float passed directly to fragment/vertex shaders for surface distortion (e.g., fuzz, rust). |
| **`wall`** | Bounding box selector | Special selector for using left, right, ceiling, floor relative bounding boxes. |
| **`terrain`** | Primitive Base Target | Instantiates a high-scale procedural ground mesh utilizing custom height maps or vertex-displacement matrices. |
| **`twist(axis, deg)`** | Deformation Modifier | Iteratively rotates vertex coordinates along a specified local bounding box axis (`x`, `y`, or `z`) by a fixed degree parameter. |
| **`taper(axis, factor)`** | Deformation Modifier | Progressively scales down the orthogonal profile of a primitive mesh as it approaches the terminal coordinate of the chosen bounding axis. |

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
# Root: one or more spatial blocks, optional trailing whitespace
root ::= block_sequence ws?

block_sequence ::= block (ws_or_nl block)*

block ::= primitive anchor? vector

primitive ::= "[" [a-zA-Z0-9_-]+ "]"

anchor ::= "[abs]" | "[@" [0-9]+ ("," ws? "@" [0-9]+)* "]"

# Vector now supports 3-7 elements with nested scaling and expressions
vector ::= "[" value ("," ws? value)* "]"

value ::= expression | scaling | attribute | num

# Improved expressions: handle negatives, multiplication, @idx, sym(), etc.
expression ::= sign? term (op term)*
term ::= variable ("*" (variable | num))? | "sym(" ws? expression ws? ")" | num
variable ::= "fw" | "hw" | "fd" | "hd" | "fh" | "hh" | "@idx"

scaling ::= "[" sign? num "," ws? sign? num "," ws? sign? num "]"

attribute ::= "noise=" num | "mesh"

num ::= sign? [0-9]+ ("." [0-9]+)?

op ::= "+" | "-" | "*" | "/"

sign ::= ("+" | "-")+

ws ::= [ \t]+
ws_or_nl ::= [ \t\r\n]+

```


---


### 5. Lora Training: Message Format


#### A. Combinitorial Prompt Training Messages

* [sme-gemini-combos.json](https://github.com/briancullinan2/illustrious/blob/main/loras/spatial_engine/dataset/sme-gemini-combos.json)

#### B. Inset Complex Training Messages

* [sme-gemini-complex.json](https://github.com/briancullinan2/illustrious/blob/main/loras/spatial_engine/dataset/sme-gemini-complex.json)
* [sme-gemini-multiples.json](https://github.com/briancullinan2/illustrious/blob/main/loras/spatial_engine/dataset/sme-gemini-multiples.json)

#### C. Positonal Training Lora Messages

* [sme-gemini-positional.json](https://github.com/briancullinan2/illustrious/blob/main/loras/spatial_engine/dataset/sme-gemini-positional.json)

#### D. Negative Feedback Training

* [sme-gemini-negatives.json](https://github.com/briancullinan2/illustrious/blob/main/loras/spatial_engine/dataset/sme-gemini-negatives.json)

#### E. Objaverse Noun Extraction Training

* [sme-gemini-nouns.json](https://github.com/briancullinan2/illustrious/blob/main/loras/spatial_engine/dataset/sme-gemini-nouns.json)

#### F. Complex Queries and Room Building

* [sme-gemini-rooms.json](https://github.com/briancullinan2/illustrious/blob/main/loras/spatial_engine/dataset/sme-gemini-rooms.json)

#### G. Terrian and Outdoor Generations

* [sme-gemini-scenes.json](https://github.com/briancullinan2/illustrious/blob/main/loras/spatial_engine/dataset/sme-gemini-scenes.json)

#### H. Camera Coordination for Scene Changes

*(No corresponding file match found in the current raw file list)*


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