Getting a custom map or model set into the PlayStation 5 Minecraft Marketplace (Add-On store) is **not easy** if you are trying to do it independently.

Because the PS5 uses Minecraft's unified Bedrock Engine, any content sold on the console must go through the official **Minecraft Partner Program**. Microsoft treats this as a strict, business-to-business commercial arrangement, not a casual creator workshop.

The process is divided into two distinct routes: applying as an independent partner or joining an existing team.

---

## Route 1: Apply Directly as a Partner (High Friction)

If you want to submit content under your own name or brand, Microsoft requires you to clear several high legal and professional hurdles before they will even review your content.

### Gatekeeping Requirements

* **Registered Business Entity:** You cannot apply as an individual. You must have a legally registered company (like an LLC or your regional equivalent) with a valid Tax ID (EIN in the US) to sign their commercial agreement.
* **Age Limit:** You must be 18 or older to sign the contracts and handle payouts.
* **A Proven Portfolio:** You must submit a portfolio containing at least **3 to 5 highly polished, original Bedrock content pieces** (worlds, skin packs, or add-ons) that you have already created and shared for free with the community (e.g., via platforms like MCPEDL).
* **Strict Quality & Tech Standards:** Your files must pass rigorous automated and manual QA, featuring clean JSON manifests, flawless Bedrock formatting, and no broken mechanics or copyrighted material.

### The Standard Pipeline

1. **Register Your Business:** Requires Tax ID.
Set up an LLC or legal equivalent. Gather your corporate tax documentation and a business banking or PayPal account for payouts.


2. **Build a Public Portfolio:** 3-5 original items.
Create, test, and release several high-quality Bedrock maps or model sets to the free community to prove your technical capability.


3. **Submit the Partner Application:** via minecraft.net/partner.
Fill out the formal application, link your portfolio, and submit your business details to Microsoft.


4. **Vetting & Review:** 2 to 12 weeks.
Microsoft reviews your business status and content quality. If accepted, you gain access to the partner portal to upload files for retail.


---

## Route 2: Join an Existing Marketplace Team (Low Friction)

Because setting up an LLC and getting approved independently is a massive hurdle, the common workaround for solo artists or builders is to **join an established Minecraft Marketplace Partner** (such as Spark Universe, Noxcrew, or Waypoint Studios).

* **How it works:** You pitch your custom models or map builds to an existing team as a freelancer or contract creator.
* **The benefit:** They handle the business infrastructure, tax reporting, asset encryption, submission pipelines, and ingestion into the Microsoft system.
* **The tradeoff:** They will take a cut of your earnings, and your work will be published under their brand umbrella.

---

> ### 💰 The Financial Split
> 
> 
> If you make it through the gate, Microsoft uses a unified virtual currency (**Minecoins**), allowing creators to set global pricing. After the platform operators (like Sony for PS5) take their standard 30% ecosystems cut, Microsoft splits the remaining revenue, typically netting the creator **around 50% to 70%** of the remaining pool.

If you just want to play your own custom maps on your PS5 without selling them, you don't need the store at all; you can host a local Bedrock dedicated server or use a Realm to join your own custom-built worlds from a PC or mobile device.



Since the business side doesn't faze you, navigating the technical pipeline for a Bedrock server will be straightforward.

Getting a PlayStation 5 to connect to a local dedicated server requires a specific DNS or proxy workaround because Sony hides the "Direct Connect / Add Server" button on consoles. However, once that bridge is crossed, the server becomes an ideal, automated, low-overhead system for pushing custom maps, custom models, and automatic backups for your kids.

---

## Part 1: Dealing with the PS5 Console Restriction

The official Bedrock Dedicated Server (BDS) software runs natively on Windows or Linux. Because Sony blocks direct IP entry on consoles to protect its ecosystem, you have two options to get the PS5 to see your server:

1. **The LAN Proxy Trick (Highly Recommended):** Run a tiny proxy script called **Geyser/BedrockConnect** or **Phantom** on any computer, phone, or Raspberry Pi on your local network. It tricks the PS5 into thinking your remote/local server is a standard LAN multiplayer game. It shows up instantly under the "Friends" tab.
2. **The DNS Workaround:** Change the Primary DNS settings on the PS5's network configuration to a public BedrockConnect DNS server (like `104.238.130.180`). When your kids click *any* featured server in the official list (like CubeCraft), it intercepts the request and opens a custom server-list menu where they can type in your server's IP and save it.

---

## Part 2: Low-Entry Custom Content & Plugins

Bedrock does not natively use Java-style `.jar` plugins (like Paper or Spigot). Instead, it uses **Add-Ons** (Behavior Packs and Resource Packs) powered by JSON schemas and optional JavaScript engines (the Minecraft GameTest Framework / TypeScript API).

### What you can drop into the map:

* **Custom Models & Items:** Created via **Blockbench**. You can define new geometry, textures, animations, and custom item behaviors.
* **Behavior Scripting:** You can hook directly into structural game events via JavaScript (`@minecraft/server`) to alter mechanics, build custom commands, or track player states.
* **Server Modding (Advanced Options):** If you want actual server-side plugins (like permissions, anti-griefing, or custom chat managers) without forcing your kids to download a heavy client pack, you can swap the vanilla Mojang BDS binary for **LeviLamina** (a lightweight, modern C++ mod loader for Bedrock) or **BDSX** (which binds Node.js directly to the server binary memory space).

---

## Part 3: Step-by-Step Server Setup Pipeline

Here is the exact manual pipeline to launch the server, inject your custom maps, and attach your behavior/resource packs.

1. **Download the Vanilla BDS:** Windows/Linux Binary.
Grab the official Bedrock Dedicated Server zip from Mojang's site. Extract it. In `server.properties`, set `allow-cheats=true` and critically ensure **`allow_addons=true`** is enabled.


2. **Migrate & Backup World Files:** worlds/ directory.
Drop your current map folder into the `worlds/` directory. To make this an automated backup pipeline for your kids, run a lightweight cron job or PowerShell script executing a `tar` or `zip` of this directory every midnight while calling the server console's `save hold` and `save resume` commands to prevent file corruption.


3. **Extract the Custom Packs:** BP and RP separation.
When you build or download custom content (`.mcpack` or `.mcaddon`), change the extension to `.zip` and extract them. Move behavior folders into `behavior_packs/` and texture/model folders into `resource_packs/`.


4. **Bind Packs via manifest.json:** Extracting header UUIDs.
Open the `manifest.json` inside your custom pack. Find the `header.uuid` string and the `version` array. You must map these values directly into your specific world folder so the engine links them.


---

## Part 4: Writing the JSON Binding Arrays

To force the server to load your custom models and maps when your kids connect, you need to edit two configuration files inside your active world directory:
`/worlds/[YourWorldName]/world_behavior_packs.json` and `world_resource_packs.json`.

Use your code editor to create an array of objects mapping the precise manifest UUIDs. The syntax must look exactly like this:

```json
[
  {
    "pack_id": "11111111-2222-3333-4444-555555555555",
    "version": [1, 0, 0]
  }
]

```

> **Important Node on Client Delivery:** When your kids join the server from the PS5, the console will read the `world_resource_packs.json` file, see that a custom model/texture set is required, download it automatically into the PS5's cache, and apply it instantly without them needing to install anything manually on their console. You can update these packs on the server backend anytime—just make sure to bump the version array (e.g., `[1, 0, 1]`) in both the pack's manifest and the world JSON link so the console knows to fetch the updated assets.



Yes, exactly! Everything—the server software, the world files, the custom models, and the behavioral scripts—lives entirely on your local computer (Windows or Linux machine) sitting on your home network.

When you edit those JSON manifests and file paths, you are doing it 100% on your local machine. The PlayStation 5 doesn't host or store any of the permanent files; it acts as a client that connects to your computer, fetches the world data, and streams the custom assets into its temporary cache.

Here is how that local architecture looks in practice:

### The Local Setup Workflow

* **Your Computer:** Runs the Bedrock Dedicated Server executable (`bedrock_server.exe` on Windows or `bedrock_server` on Linux). This is where you drop in your custom maps and manage your automated backup scripts.
* **The Network Bridge:** On that same computer (or even a Raspberry Pi), you run your LAN proxy/loopback tool.
* **The PS5:** Sits on the couch, looks at the local network, sees the proxy pretending to be a LAN game, and connects right into your computer.

Because it's all local, your transfer speeds for downloading huge custom maps or high-resolution model packs onto the PS5 will be incredibly fast, completely bypassing PlayStation Store restrictions or long cloud upload times.


Setting up a local Windows network pipeline for a Minecraft Bedrock Dedicated Server (BDS) gives you total control over the server environment, file transfers, and scripts.

By setting the PS5's **Primary DNS** to BedrockConnect and the **Secondary DNS** to Google Public DNS (`8.8.8.8`), your console will securely route normal internet traffic via Google while using the BedrockConnect proxy strictly to bypass Sony's custom server block.

---

## Step 1: Prep Your Windows Server Environment

Before touching the server software, grab your Windows machine’s local IP address so you can point the PS5 to it later.

1. Open PowerShell or Command Prompt on your host Windows PC and run `ipconfig`.
2. Locate your active network adapter (Ethernet or Wi-Fi) and copy down the **IPv4 Address** (it will look like `192.168.1.XX` or `10.0.0.XX`).
3. Download the official **Bedrock Dedicated Server for Windows** zip from Mojang's website.
4. Extract the folder directly to a root directory like `C:\MinecraftServer\`.

---

## Step 2: Configure the Server Profile

Open `server.properties` inside your extracted folder using a text editor. Update or verify the following configuration rows to ensure external local devices and custom behavior assets can load flawlessly:

```ini
server-name=Family Dedicated Server
gamemode=survival
difficulty=easy
allow-cheats=true
server-port=19132
server-portv6=19133
online-mode=true
allow-addons=true
level-name=FamilyWorld

```

*Note: The `level-name` must perfectly match the directory name of your map located inside the `worlds/` folder.*

---

## Step 3: Configure Windows Firewall

Because Windows blocks inbound UDP traffic by default, you must tell the advanced firewall wrapper to explicitly allow incoming connections on port `19132`.

Run PowerShell as an **Administrator** and execute this command to create the inbound rule:

```powershell
New-NetFirewallRule -DisplayName "Minecraft Bedrock Server UDP" -Direction Inbound -LocalPort 19132 -Protocol UDP -Action Allow

```

---

## Step 4: Map the Network Stack on the PS5

Now, adjust the PS5's network stack to utilize the DNS trick while maintaining a solid connection to Google for general network stability.

1. On your PS5, go to **Settings** > **Network** > **Settings** > **Set Up Internet Connection**.
2. Hover over your active connection, press the **Options button** on your controller, and select **Advanced Settings**.
3. Set **DNS Settings** to **Manual**.
4. Set **Primary DNS** to `104.238.130.180` (The public BedrockConnect proxy instance).
5. Set **Secondary DNS** to `8.8.8.8` (Google's Public DNS fallback).
6. Save the settings and let the console verify the network connection status.

---

## Step 5: Automate Backups and Run the Server

To give you peace of mind regarding world corruption or lost player data, set up an automated backup loop. Create a file named `backup_and_run.bat` inside your `C:\MinecraftServer\` root directory and populate it with the following code:

```cmd
@echo off
:: Start the server in a separate background window
start "Minecraft Server Engine" bedrock_server.exe

:loop
:: Wait 86400 seconds (24 hours) before creating the next point-in-time recovery backup
timeout /t 86400 /nobreak

echo Creating point-in-time recovery map backup...
set BACKUP_DIR=C:\MinecraftBackups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Extract the current timestamp for precise chronological ordering
set TIMESTAMP=%date:~10,4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%

:: Compress the live active world folder directly into the archive directory
powershell -Command "Compress-Archive -Path 'C:\MinecraftServer\worlds\FamilyWorld' -DestinationPath '%BACKUP_DIR%\FamilyWorld_%TIMESTAMP%.zip' -Force"

echo Backup cycle complete.
goto loop

```

Double-click `backup_and_run.bat` to launch your system.

### Connecting from the Console

Tell your kids to go to the **Servers** tab on their PS5 and join any featured server entry in the list (e.g., *The Hive* or *Lifeboat*). The DNS setup will intercept that request and load the custom BedrockConnect GUI. Click **Connect to a Server**, type in your Windows host PC’s local IPv4 address, leave the port at `19132`, and save it to the dashboard. Every time they connect from this menu, the server will automatically download whatever custom model sets or asset updates you have dropped into the server backend.



To run your own local instance of BedrockConnect instead of relying on the public public proxy, your Windows machine needs to act as a **DNS interceptor**.

When the PS5 asks your local DNS server for the IP address of an official featured server (like `geo.hivebedrock.network`), your server will intentionally "lie" and return your Windows PC's local IP. For any other request (like a PlayStation Network login or a Netflix stream), your server will transparently pass the request up to Google's `8.8.8.8`.

Here is how to set up your own self-hosted BedrockConnect DNS and proxy stack natively on Windows.

---

## Step 1: Install Java Runtime Environment (JRE)

The standard, open-source version of BedrockConnect is written in Java.

1. Download and install the latest version of **Eclipse Temurin OpenJDK** (Java 17 or 21 is ideal) for Windows.
2. Ensure you check the box during installation that says **"Add to PATH"**.

---

## Step 2: Download the BedrockConnect Binary

1. Create a new folder on your Windows PC dedicated to the proxy: `C:\BedrockConnect\`.
2. Download the official server release `.jar` file from the [BedrockConnect GitHub releases page](https://github.com/Pugmatt/BedrockConnect).
3. Rename the downloaded file to `BedrockConnect.jar` and place it inside your `C:\BedrockConnect\` folder.

---

## Step 3: Configure the Local DNS Interceptor

Create a configuration file named `config.json` inside `C:\BedrockConnect\` to tell the software which upstream DNS to look at, and how to behave. Paste the following configuration into it:

```json
{
  "bds-address": "127.0.0.1",
  "bds-port": 19132,
  "mysql-host": "",
  "mysql-user": "",
  "mysql-pass": "",
  "mysql-db": "",
  "custom-servers": [],
  "dns-upstream": "8.8.8.8",
  "enable-built-in-dns": true,
  "dns-port": 53
}

```

* **`dns-upstream`**: Set to `8.8.8.8`. This ensures your kids' PS5 can still browse the web, watch YouTube, or play other games normally without internet interruption.
* **`dns-port`**: Set to `53`. This is the standard networking port for DNS traffic worldwide.

---

## Step 4: Open Port 53 and 19132 on Windows Firewall

Since your PC is now acting as a core network router/DNS for the PS5, you must open Port 53 (DNS traffic) and Port 19132 (Minecraft traffic) through the Windows Advanced Firewall layer.

Open PowerShell as an **Administrator** and run these two commands:

```powershell
New-NetFirewallRule -DisplayName "BedrockConnect DNS UDP" -Direction Inbound -LocalPort 53 -Protocol UDP -Action Allow
New-NetFirewallRule -DisplayName "BedrockConnect Proxy UDP" -Direction Inbound -LocalPort 19132 -Protocol UDP -Action Allow

```

---

## Step 5: Automate the Launcher Script

To make sure your local DNS engine starts reliably and doesn't conflict with your actual Minecraft server (if running them on the same machine), you can launch BedrockConnect on a custom proxy port if needed, but it defaults smoothly.

Create a file named `run_dns.bat` inside `C:\BedrockConnect\` containing the following startup sequence:

```cmd
@echo off
title BedrockConnect DNS Engine
cd /d "C:\BedrockConnect"
echo Starting Local BedrockConnect DNS Node...
:: Run the Java binary, allocating 1GB of RAM
java -Xmx1024M -jar BedrockConnect.jar
pause

```

Double-click `run_dns.bat`. You will see output in the terminal showing that the **DNS Server has started on port 53** and the **Bedrock proxy engine is listening on port 19132**.

---

## Step 6: Update the PS5 Networking Stack

Now point your PS5 straight to your Windows machine instead of the public internet proxy.

1. On your PS5, go to **Settings** > **Network** > **Settings** > **Set Up Internet Connection**.
2. Press the **Options button** over your connection and choose **Advanced Settings**.
3. Set **Primary DNS** to your **Windows PC’s exact local IPv4 Address** (e.g., `192.168.1.XX`).
4. Set **Secondary DNS** to `8.8.8.8` (as a secondary safety backup).
5. Save and connect.

### How it operates now

When your kids open Minecraft on the PS5 and select any featured server, the PS5 sends a DNS request to your Windows computer. Your local `BedrockConnect.jar` intercepts that specific address packet, points the PS5 directly to its own local proxy engine, and brings up your own private server-list UI where they can securely jump straight into your home-hosted maps!


You don't *need* a custom or paid JDK at all—any standard Java Runtime Environment (JRE) or Java Development Kit (JDK) version 17 or higher will run it perfectly.

The reason **Eclipse Temurin** specifically gets recommended by default in the self-hosting community comes down to legal and corporate shifts over the last several years:

## 1. The Oracle License Trap

Years ago, everyone just downloaded Java from Oracle's main website. However, Oracle changed its licensing terms for the standard Oracle JDK, making it restricted or requiring paid commercial licenses under certain conditions.

## 2. The OpenJDK Standard

To keep Java free and open-source, the community rallies around the **OpenJDK** project. Because OpenJDK is just the raw source code, various trusted organizations compile that code into ready-to-run installers for Windows, Mac, and Linux.

## 3. Why Temurin?

**Eclipse Temurin** (managed by the Eclipse Foundation and backed by companies like IBM, Red Hat, and Microsoft) is simply the most popular, rock-solid, 100% free build of the OpenJDK. It contains zero corporate licensing traps and doesn't bundle junkware or telemetry.

### The Bottom Line

If you already have a modern Java version installed on your Windows machine (like the OpenJDK build packaged by Microsoft, Amazon Corretto, or an existing development environment), you can skip downloading anything else entirely. Just open PowerShell, type `java -version`, and as long as it returns **version 17, 21, or newer**, your local DNS interceptor script will boot right up.





Your friend is talking about a popular engineering hack: building a **budget split ergonomic keyboard** by laying two separate, identical compact keyboards side-by-side.

Instead of dropping $350+ on a high-end split mechanical keyboard (like an Ergodox, Moonlander, or Dygma Raise) to fix shoulder and wrist posture during long coding blocks, developers just buy two cheap 60% mechanical keyboards, angle them shoulder-width apart, and call it a day.

However, if you just plug two keyboards in and start typing, you immediately hit a frustrating hardware architecture wall—which is exactly why your friend mentioned "sharing shift keys" and special software.

---

## The "Cross-Keyboard Modifier" Problem

Operating systems handle multiple keyboards natively by merging their text inputs, but they often isolate their modifier states per device hardware ID.

> **The Flaw:** If you hold down `Left Shift` on your left keyboard with your pinky, and press the `M` key on your right keyboard, the OS sees them as two distinct physical devices. It registers a lowercase `m` because the Shift state from Keyboard A never bridges over to the input stream of Keyboard B.

To turn two separate Bluetooth or USB keyboards into a true unified split layout, you have to use a low-level hardware input interceptor to fuse them.

---

## The Software to Use (Windows Pipeline)

To fix the Shift problem and unlock custom macro layers, you need software that sits at the driver level to catch raw HID (Human Interface Device) events before Windows processes them.

The two most powerful, open-source utilities favored by developers are **Kanata** and **KMonad**. They run on a single background thread, parse your keyboard inputs via a configuration file, and output a clean, unified virtual keyboard stream.

### Setting Up Kanata for Dual Keyboards

1. Download the latest executable of **Kanata** from GitHub.
2. Create a basic configuration file named `config.kbd`.
3. Define your source keys and layers. Kanata automatically intercepts all connected keyboards and unifies modifier states natively—meaning holding Shift on your left keyboard will now seamlessly capitalize keys on your right keyboard.

A simple structural layout file looks like this:

```lisp
(defsrc
  grv  1    2    3    4    5    6    7    8    9    0    -    =    bspc
  tab  q    w    e    r    t    y    u    i    o    p    [    ]    \
  caps a    s    d    f    g    h    j    k    l    ;    '    ret
  lsft z    x    c    v    b    n    m    ,    .    /    rsft
  lctl lmet lalt           spc            ralt rmet rctl
)

(deflayer default
  grv  1    2    3    4    5    6    7    8    9    0    -    =    bspc
  tab  q    w    e    r    t    y    u    i    o    p    [    ]    \
  caps a    s    d    f    g    h    j    k    l    ;    '    ret
  lsft z    x    c    v    b    n    m    ,    .    /    rsft
  lctl lmet lalt           spc            ralt rmet rctl
)

```

You can launch it via a simple PowerShell script pointing to the executable: `kanata.exe --cfg config.kbd`.

---

## Why Is This Considered "Ultimate Leet Code"?

Once developers have low-level interceptors like Kanata running across dual keyboards, they don't just fix the Shift key—they implement **Home Row Modifiers** and **Layer Tapping**.

* **Home Row Mods:** Instead of reaching your pinky down to the corner for `Ctrl`, `Alt`, or `Shift`, you program the software so that *holding* `f` acts as `Ctrl`, and *tapping* `f` types the letter `f`. Your hands never have to leave the home row.
* **Navigation Layers:** You can turn the entire right keyboard into a dedicated Vim-style navigation block or arrow pad simply by holding down the Spacebar on the left keyboard.

If you are trying it right now with dual Bluetooth keyboards on Windows, test the Shift key trick. If your layout is dropping capitals across the gap, dropping Kanata or KMonad into your startup routine will instantly bind them into a single, cohesive developer rig.





You want to run **`kanata_windows_tty_winIoV2_x64.exe`** to start out.

Here is the quick breakdown of what those naming conventions mean so you can pick the perfect one for your setup:

### 1. Interception Method (`winIoV2` vs. `wintercept`)

* **`winIoV2` (Choose this):** Uses the native Windows input API. It works out of the box without requiring you to install any extra third-party drivers.
* **`wintercept`:** Requires you to manually install the external "Interception" driver asset onto your machine.

### 2. Interface Style (`tty` vs. `gui`)

* **`tty` (Best for starting out):** Launches inside a visible command prompt window. You want this right now because if you make a syntax error in your `config.kbd` file, the terminal will print the exact line number where the typo is before closing.
* **`gui` (Best for later):** Runs completely in the background without opening a window. Once your config is perfect and you want Kanata to launch silently when Windows boots up, switch to this executable.

### 3. Permissions (`cmd_allowed`)

* Executables with `cmd_allowed` in the name allow Kanata to launch external Windows apps or system scripts directly via a keyboard macro. If you don't need your keyboard to physically open windows applications or run scripts, leave it off for a cleaner security profile.






If you want to keep runtime plugins to an absolute minimum and build raw, high-performance world-generation tools, the industry standard has moved completely away from executing commands inside a live game. Instead, the modern way is **offline, programmatic file manipulation**—compiling maps directly on your hard drive before the server even starts.

Because you are hosting a **Bedrock Dedicated Server (BDS)** on Windows, you have two primary native pipelines depending on whether you want to procedurally generate a vast landscape or programmatically sculpt precision builds (like cities, mini-games, or custom templates) for your kids.

---

## Option 1: The `mcanvil` Python Framework (Vast World & Rules Engine)

Released as a unified toolkit for Python 3.13+, `mcanvil` is the most modern framework designed specifically for Bedrock content development on Windows. Instead of parsing binary bytes manually, it wraps the underlying world schemas, blocks, and entities into a modular component-driven framework.

### Setup and Initialization

Open your Windows terminal and install the framework via pip:

```powershell
pip install mcanvil

```

To scaffold an optimized project structure with script validation, run:

```powershell
anvil create family_ns my_custom_world --addon
cd my_custom_world

```

This generates a highly structured layout with isolated directories for assets, javascript hooks, behavior rule sets, and your raw world generation data. You run your generation loops natively in Python, and executing `anvil run` compiles the binary targets cleanly into Bedrock-compatible worlds.

---

## Option 2: The `mcschematic` / `.mcstructure` Approach (Precision Voxel Modeling)

If you want to treat Minecraft map building like a raw 3D matrix where you programmatically loop through $X, Y, Z$ coordinates to place custom blocks, layouts, or logic arrays, you want to write to raw `.mcstructure` or `.mcworld` files.

The Python package `mcschematic` features a dedicated **`MCStructure` sub-engine** designed specifically to transform, rotate, scale, and compile blocks straight into Bedrock's data structures without running a client.

### Direct Code Implementation

Here is a raw, self-contained Python script demonstrating how to programmatically generate a multi-tier structure (like a floating platform with procedurally placed items) and export it directly for your server.

```python
import mcschematic

def generate_procedural_base():
    # Instantiate a clean Bedrock-compatible structural canvas
    struct = mcschematic.MCStructure()
    
    # Define a simple 3D bounding box dimensions
    width, height, depth = 20, 5, 20
    
    print("Computing voxel matrices...")
    for x in range(width):
        for z in range(depth):
            # Programmatic terrain: create a basic procedural sine-wave floor profile
            import math
            y_offset = int(2 + math.sin(x * 0.5) * math.cos(z * 0.5))
            
            # Place base foundational blocks
            struct.setBlock((x, 0, z), "minecraft:smooth_stone")
            
            # Layer dirt up to our calculated wave height
            for y in range(1, y_offset):
                struct.setBlock((x, y, z), "minecraft:dirt")
                
            # Cap the top with grass
            struct.setBlock((x, y_offset, z), "minecraft:grass_block")
            
            # Programmatically frame a border perimeter
            if x == 0 or x == width - 1 or z == 0 or z == depth - 1:
                struct.setBlock((x, y_offset + 1, z), "minecraft:polished_andesite_slab")

    # In-place geometric transformations (Scale, Translation, Rotation)
    # Move the entire computed geometry into positive coordinates if needed
    struct.translate((0, 64, 0)) # Drop it right into skybox tier

    # Export cleanly to an offline structural asset file
    output_path = "./output"
    struct.save(output_path, "procedural_fortress")
    print(f"Compilation successful! Saved to {output_path}/procedural_fortress.mcstructure")

if __name__ == "__main__":
    generate_procedural_base()

```

---

## Injecting the Map Data Into Your Live Server

Once your generation script fires and dumps the binary `.mcstructure` file, you don't need a plugin to read it. Minecraft Bedrock handles these files natively via the in-game **Structure Block** or the `/structure` command.

1. Take your compiled `.mcstructure` file and drop it into your server's active world behavioral template folder:
`C:\MinecraftServer\worlds\FamilyWorld\behavior_packs\structures\`
2. Boot up your server.
3. When your kids want to load the fresh programmatic map updates you just built, you can execute a raw console command (or trigger it via an automated script) to place the asset anywhere in the coordinate space instantly:
```text
/structure load procedural_fortress 100 70 100

```



```

This approach allows you to leave your server binary completely clean, vanilla, and un-modded, keeping runtime execution incredibly light while you do all your heavy computational design, arithmetic, and world-shaping offline in pure Python scripts.

```


This is one of the most satisfying ways to handle programmatic generation. By defining a human-readable text matrix (a string blueprint), you can design your layouts visually right inside your text editor, and then let your Python script handle the boring task of extruding that blueprint into 3D space, layer by layer.

Using **`mcschematic`** is perfect for this because it lets us map characters directly to block IDs and heights.

---

## The Python Blueprint Script

This script reads a 2D text layout string. It treats spaces/dots as empty air, `W` as stone walls, `T` as high cobblestone towers, and `G` as an open iron gate. It handles different heights for different characters to instantly turn a flat map into a 3D structure.

```python
import mcschematic

# Define a human-readable 2D map layout
# W = Wall (5 blocks high)
# T = Tower (10 blocks high)
# G = Gatehouse (3 blocks high + iron bars)
# . = Walkway / Floor (1 layer of smooth stone)
#   = Empty space (Air)
CASTLE_BLUEPRINT = """
T W W W G G W W W T
W                 W
W   . . . . . .   W
W   .         .   W
G   .         .   G
G   .         .   G
W   .         .   W
W   . . . . . .   W
W                 W
T W W W G G W W W T
"""

def parse_blueprint_to_structure():
    # Initialize the Bedrock structure canvas
    struct = mcschematic.MCStructure()
    
    # Clean the input string and split it into an addressable 2D grid matrix
    lines = [line.strip() for line in CASTLE_BLUEPRINT.strip().split("\n") if line.strip()]
    
    # Process the grid coordinates
    for z, line in enumerate(lines):
        # Split tokens by space to handle the layout characters cleanly
        tokens = line.split(" ")
        for x, token in enumerate(tokens):
            
            # Base Ground Layer: Clear grass out under the structural footprint
            struct.setBlock((x, -1, z), "minecraft:cobblestone")
            
            # Case 1: Towers (T) - Height 10
            if token == "T":
                for y in range(10):
                    struct.setBlock((x, y, z), "minecraft:mossy_cobblestone" if y % 3 == 0 else "minecraft:cobblestone")
                # Add a crenellation rim at the top of the tower
                struct.setBlock((x, 10, z), "minecraft:stone_brick_wall")
                
            # Case 2: Perimeter Walls (W) - Height 5
            elif token == "W":
                for y in range(5):
                    struct.setBlock((x, y, z), "minecraft:stone_bricks")
                # Add top wall walking path slabs
                struct.setBlock((x, 5, z), "minecraft:stone_brick_slab")
                
            # Case 3: Gatehouse Flanks & Iron Gates (G)
            elif token == "G":
                # Build the side pillars up to height 4
                for y in range(4):
                    struct.setBlock((x, y, z), "minecraft:stone_bricks")
                # Bridge across the top of the gate
                struct.setBlock((x, 4, z), "minecraft:stone_brick_stairs")
                # Drop an iron portcullis bar in the upper clearance slot
                struct.setBlock((x, 3, z), "minecraft:iron_bars")
                struct.setBlock((x, 2, z), "minecraft:iron_bars")
                
            # Case 4: Interior Courtyard Walkway (.)
            elif token == ".":
                struct.setBlock((x, 0, z), "minecraft:smooth_stone")
                
            # Case 5: Empty space (Air)
            else:
                # Do nothing, leaves it as natural game terrain or clears it
                pass

    # Save the output file out to your working directory
    output_dir = "./structures"
    file_name = "auto_castle"
    struct.save(output_dir, file_name)
    print(f"Success! Compiled text matrix into: {output_dir}/{file_name}.mcstructure")

if __name__ == "__main__":
    parse_blueprint_to_structure()

```

---

## How to Test and Run this Setup

1. Save the code above into a script file on your Windows host named `build_castle.py`.
2. Install the library if you haven't already:
```powershell
pip install mcschematic

```


3. Execute the script:
```powershell
python build_castle.py

```


4. Copy the freshly generated `auto_castle.mcstructure` file out of your script's `./structures/` directory and paste it directly into your live server world template cache:
`C:\MinecraftServer\worlds\FamilyWorld\behavior_packs\structures\`
5. Open up Minecraft on the PS5, connect to your local dedicated server instance, stand in an open field, and type this into the game chat console to watch your visual string map materialize perfectly out of thin air:
```text
/structure load auto_castle ~ ~ ~

```



Because this is basic matrix manipulation, you can make the `CASTLE_BLUEPRINT` string as wide or long as you want, add new character tokens (like `L` for Lava or `F` for Fences), and design entire massive dungeons visually right inside your text files without typing a single tedious setup command in-game.


The `mcanvil` workflow is built entirely around a **compiler pipeline** design philosophy. Instead of manually zipping files, writing messy JSON schemas by hand, or dragging and dropping folders into Minecraft directories, `mcanvil` treats a Minecraft world and its behaviors exactly like a software development project.

The pipeline automates asset management, runs validation scripts, handles schema rules, and packages your output into final target formats.

---

## The Compilation Pipeline Structure

The workspace architecture handles files before they are fed into the compiler:

```text
my_custom_world/
├── assets/                 # Raw source materials
│   ├── bbmodels/           # Raw Blockbench 3D model files (.bbmodel)
│   ├── textures/           # Raw PNG image files
│   └── structures/         # .mcstructure files (like your castle)
├── scripts/
│   ├── python/             # Logic that builds things programmatically
│   └── javascript/         # In-game GameTest/TypeScript execution engine
├── world/                  # Base world map database/level files
└── output/                 # The compilation target folder (compiled output)

```

---

## How the Pipeline Processes Data (`anvil run`)

When you open your terminal inside your project folder and fire the compiler command:

```powershell
anvil run

```

The framework executes a multi-stage ingestion pipeline to transform those loose source files into binary assets.

### 1. Ingestion & Schema Synthesis

The pipeline reads the core configuration metrics. It scans your custom entity declarations or behavioral definitions written in Python and automatically synthesizes the strict, matching Minecraft Bedrock JSON schemas. If a JSON array or property doesn't match Mojang's specification rules, the engine catches it here before it ever touches your server.

### 2. Asset Conversion & Matrix Packing

The compilation engine looks into `assets/bbmodels/`. It parses raw Blockbench models, automatically extracts their custom geometry arrays, maps the designated vector configurations, and generates the resulting unified texture atlas mapping sheets.

### 3. Execution of Programmatic Generators

The pipeline runs any generation scripts located in `scripts/python/` (like your text-blueprint castle scanner or procedural landscape code). The output geometry data is dynamically injected directly into the designated map directory inside the `world/` folder.

### 4. Build Targets and Packaging

Finally, the compiler bundles the output. Depending on how you configure your project settings, it compiles the asset streams into one of three unified builds dropped into the `output/` folder:

* **`.mcworld`:** A completely self-contained world bundle containing the maps, behavioral scripts, and custom model assets merged into one double-clickable wrapper.
* **`.mctemplate`:** A standardized marketplace world template that allows players to continuously spawn fresh instances of your programmatic map.
* **Isolated Packs:** Separated `_BP` (Behavior Pack) and `_RP` (Resource Pack) folders ready to map straight into your local Bedrock Dedicated Server workspace.

By running this pipeline, you never have to worry about broken JSON syntax or mismatched UUID paths again; you write pure logic, and the compiler guarantees a valid build on the other side.





To disable "DNS Client", run the following command in command prompt as admin to set the needed registry: 
REG add "HKLM\SYSTEM\CurrentControlSet\services\Dnscache" /v Start /t REG_DWORD /d 4 /f

If you want to revert this change later, run this which will enable it again: 
REG add "HKLM\SYSTEM\CurrentControlSet\services\Dnscache" /v Start /t REG_DWORD /d 2 /f


-= BedrockConnect =-
Developed by Pugmatt

Full video tutorial on how to set this up can be found on my channel: https://www.youtube.com/user/Pugmatt

Requires Java 8 or higher to run the JAR.

This setup requires a program called mod0Umleitung, which can be found here: https://modzero.github.io/mod0Umleitung/

-------------------

Execute run.bat. Once you choose the IP you want on the DNS records, the software will create a bc_dns.conf file in the parent directory.
Start up mod0Umleitung, and load bc_dns.conf as a ruleset, which will load the needed DNS records.

If you receive an error about "Only one usage of each socket address", you need to disable the Windows service "DNS Client", which is hogging port 53.

To disable "DNS Client", run the following command in command prompt as admin to set the needed registry: 
REG add "HKLM\SYSTEM\CurrentControlSet\services\Dnscache" /v Start /t REG_DWORD /d 4 /f

If you want to revert this change later, run this which will enable it again: 
REG add "HKLM\SYSTEM\CurrentControlSet\services\Dnscache" /v Start /t REG_DWORD /d 2 /f

(Both of these commands will require a restart)

You should then be able to set the DNS on your game console, and connect to the BedrockConnect serverlist through the Featured Server list.

-------------------

Although not required, if you like the software feel free to throw a few bucks to support what I do! http://paypal.me/Pugmatt



You nailed it. Changing the default Minecraft server ports is exactly the right move.

Because the PS5 hardcodes its connections to the official featured servers on port `19132`, **BedrockConnect must stay on 19132** to hijack that traffic and present its menu GUI on the TV.

This means you can spin up as many separate Minecraft server instances on your PC as your hardware can handle, simply by assigning each its own unique port number (e.g., `19134`, `19135`, `19136`). Your kids will be able to see and choose between all of them right from the BedrockConnect custom menu.

Here is the clean pipeline to set up a multi-server grid on your local machine.

---

## Step 1: Duplicate Your Server Environments

Instead of trying to host multiple maps inside one running app, create separate directories for each world instance so their logs, configurations, and player files stay isolated.

```text
C:\MinecraftServer\
├── Server_Creative\   <-- Running on Port 19134
│   ├── bedrock_server.exe
│   └── server.properties
└── Server_Survival\   <-- Running on Port 19136
    ├── bedrock_server.exe
    └── server.properties

```

---

## Step 2: Configure Unique Ports and Names

Open the `server.properties` file inside each directory and increment the port settings so they never overlap.

### For Server 1 (Creative Map):

```ini
server-name=Kids Creative Sandbox
server-port=19134
server-portv6=19135
level-name=CreativeWorld

```

### For Server 2 (Survival Map):

```ini
server-name=Family Survival World
server-port=19136
server-portv6=19137
level-name=SurvivalWorld

```

---

## Step 3: Clear the Windows Firewall for the New Ports

Because you are opening new networking gates, you need to tell Windows Advanced Firewall to permit inbound traffic on your new ports.

Open PowerShell as an **Administrator** and execute this rule block:

```powershell
New-NetFirewallRule -DisplayName "Minecraft Creative Port" -Direction Inbound -LocalPort 19134 -Protocol UDP -Action Allow
New-NetFirewallRule -DisplayName "Minecraft Survival Port" -Direction Inbound -LocalPort 19136 -Protocol UDP -Action Allow

```

---

## Step 4: Run Everything Simultaneously

1. Ensure your BedrockConnect proxy loop is running on your network (holding down port `19132`).
2. Go into `Server_Creative\` and launch its `bedrock_server.exe`.
3. Go into `Server_Survival\` and launch its `bedrock_server.exe`.

### The End-User Experience for Your Kids

When your kids open Minecraft on the PS5 and join a featured server, they will drop straight into your local BedrockConnect portal dashboard.

From there, they can click **"Add Server"** twice to create two persistent bookmarks:

* **Bookmark 1:** Name: `Creative Sandbox` | IP: `192.168.4.23` | Port: `19134`
* **Bookmark 2:** Name: `Survival World` | IP: `192.168.4.23` | Port: `19136`

They can jump back and forth between worlds at will, and you can freely run scripts, drop in your text-blueprint castle structures, or generate new map files on either server without kicking players offline from the other instance.

No, you don't need to register your local servers with the official BedrockConnect project or anyone else.

Because you are running the BedrockConnect DNS engine locally on your own computer (`192.168.4.23`), you have your own entirely private instance of the software.

You have two ways to handle adding your multiple local servers, both of which keep everything 100% internal:

### Option 1: The UI Method (Easiest)

When your kids boot up the PS5, go to the servers tab, and open your local BedrockConnect menu, they can simply use the controller to click **"Add Server"** right on the TV screen. They type in your computer's IP and whatever custom port you configured (like `19134` or `19136`).

The software automatically saves those bookmarks locally to the PS5's cache or your server's folder. They only have to type it in once.

### Option 2: Pre-Load Them via `config.json` (Automated)

If you don't want your kids to have to manually type in IPs and ports on a console controller, you can pre-load your servers directly into the BedrockConnect backend on your PC.

Open your `C:\Program Files (x86)\BedrockConnect\config.json` file and locate the `"custom-servers"` array. You can hardcode your servers right there like this:

```json
{
  "bds-address": "127.0.0.1",
  "bds-port": 19133,
  "custom-servers": [
    {
      "name": "Kids Creative Sandbox",
      "address": "192.168.4.23",
      "port": 19134
    },
    {
      "name": "Family Survival World",
      "address": "192.168.4.23",
      "port": 19136
    }
  ],
  "dns-upstream": "8.8.8.8",
  "enable-built-in-dns": true,
  "dns-port": 53
}

```

If you use this method, restart your `run.bat` script. The next time the PS5 connects, your Creative and Survival servers will already be sitting beautifully on the TV menu waiting for them to click play!




Ah, eagle eye! You caught a critical piece of the puzzle. What you just pasted there is an **XML configuration for a DNS server/interceptor (like a DNSMasq wrapper)**, whereas the previous `config.json` is BedrockConnect's internal application config.

They are two halves of the same trick, but to answer your question directly: **Yes, it will load it automatically anyway, but *only* if BedrockConnect itself is running alongside this XML DNS tool.**

Here is exactly how these two files work together to automate everything for your kids:

---

## The Two Halves of the Hijack

### 1. The XML File (The Redirector)

The XML configuration you found intercepts the actual domain names (like `mco.cubecraft.net`). When the PS5 tries to connect to Cubecraft, this file forces the network traffic to route to your computer's IP: `192.168.4.23`.

### 2. The `config.json` File (The Menu Provider)

Once the PS5 traffic arrives at your computer, it hits BedrockConnect. BedrockConnect reads its `config.json` file, looks at the `"custom-servers"` array, and builds the visual list on the TV screen.

---

## Will it load automatically?

If you populate that XML config, you are bypassing BedrockConnect's built-in DNS service and using an external DNS manager (like a custom router feature or a local Pi-hole/DNSMasq setup) to handle the redirect.

Because you are doing that, the PS5 will hit your computer automatically whenever they click a featured server. However, you still have two ways to handle the actual menu they see:

### Scenario A: You use the `custom-servers` json array

If you hardcode your local servers into the `config.json` block, your kids will click "Cubecraft", the XML will redirect them to your PC, and **they will immediately see "Kids Creative Sandbox" pop up on their screen automatically** without having to type a thing.

### Scenario B: You leave the json array empty

If you don't pre-load the json array, they will click "Cubecraft", the XML will still redirect them to your PC, but they will be greeted with a blank BedrockConnect menu where they have to use the controller to manually add your custom ports.

### One quick fix on your JSON sample:

In the sample text you pasted, you set the target port for your Creative Sandbox to `19133`:

```json
"port": 19133

```

Make sure that port matches whatever you specified as the `server-port=` inside that specific Minecraft instance's `server.properties` file (e.g., if you shifted your actual game server to `19134` to keep it separate from the proxy, change it to `19134` here too!).




To bridge the gap between nunuStudio (which evaluates to a traditional Three.js scene graph of meshes, materials, and geometries) and Minecraft's rigid, grid-aligned voxel structure (`.schematic` or `.schem` formats), you need to pass the geometry through a **3D raycasting voxelizer** or **surface sampler**.

Since your architecture heavily favors zero-backend, client-side compilation via Web Workers, the most efficient way to handle this is entirely in-browser. You can extract the raw buffers from your nunuStudio/Three.js objects, map them to an aligned 3D bounding grid, and export an array of byte data.

Here is the technical blueprint and a complete, zero-dependency client-side implementation designed to run inside a Web Worker or directly on your canvas logic.

---

## The Voxelization Pipeline

Converting smooth or complex 3D meshes into a Minecraft-compatible structure requires three distinct phases:

1. **Scene Traversal & Extraction:** Recursively walk your nunuStudio scene object to find all `THREE.Mesh` instances, computing their world matrices so their local coordinates align perfectly in a single global space.
2. **Ray-AABB Intersect / Bounding Box Grid:** Determine the boundaries of the scene, divide that 3D space into discrete $1 \times 1 \times 1$ cubes (voxels), and test which meshes occupy which grids.
3. **Minecraft Format Encoding:** Map the resulting grid coordinates to classic Minecraft `BlockID` and `Data` bytes, or the modern, more robust `.schem` NBT (Named Binary Tag) schema.

---

## Complete Client-Side Voxelizer

This implementation extracts vertex attributes directly from a target nunuStudio canvas/scene object, performs a fast 3D bounding box intersection check per voxel unit, and formats the output into a structured JavaScript object ready for an NBT encoder.

```javascript
/**
 * Zero-dependency Client-Side Three.js / nunuStudio Voxelizer
 * Maps complex scene geometry into a dense 3D grid layout.
 */
function voxelizeNunuScene(sceneObject, voxelScale = 1.0) {
    // 1. Gather all meshes and compute world-space bounding boxes
    const meshes = [];
    sceneObject.updateMatrixWorld(true);
    
    sceneObject.traverse((child) => {
        if (child.isMesh && child.geometry) {
            // Ensure we have up-to-date world geometry boundaries
            if (!child.geometry.boundingBox) {
                child.geometry.computeBoundingBox();
            }
            
            const worldBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
            meshes.push({
                mesh: child,
                box: worldBox
            });
        }
    });

    if (meshes.length === 0) {
        return { dimensions: [0, 0, 0], blocks: [] };
    }

    // 2. Compute the global scene bounding box to establish our grid origin
    const globalBox = meshes[0].box.clone();
    for (let i = 1; i < meshes.length; i++) {
        globalBox.union(meshes[i].box);
    }

    const min = globalBox.min;
    const max = globalBox.max;

    // Calculate dimensions based on the target voxel size
    const sizeX = Math.ceil((max.x - min.x) / voxelScale);
    const sizeY = Math.ceil((max.y - min.y) / voxelScale);
    const sizeZ = Math.ceil((max.z - min.z) / voxelScale);

    // Flat array optimization for high-density spatial grids
    // Minecraft classic format layout size: X * Y * Z
    const totalCells = sizeX * sizeY * sizeZ;
    const blockIds = new Uint8Array(totalCells);
    const blockData = new Uint8Array(totalCells);

    // Helper to map 3D grid coordinates to a 1D flat index
    const getIndex = (x, y, z) => {
        return (y * sizeZ + z) * sizeX + x;
    };

    // 3. Perform spatial sampling (AABB voxel intersections)
    // For extreme performance inside complex scenes, port this loop to a Web Worker
    const sampleBox = new THREE.Box3();

    for (let x = 0; x < sizeX; x++) {
        for (let y = 0; y < sizeY; y++) {
            for (let z = 0; z < sizeZ; z++) {
                
                // Define the boundaries of the current voxel cell
                sampleBox.min.set(
                    min.x + (x * voxelScale),
                    min.y + (y * voxelScale),
                    min.z + (z * voxelScale)
                );
                sampleBox.max.set(
                    min.x + ((x + 1) * voxelScale),
                    min.y + ((y + 1) * voxelScale),
                    min.z + ((z + 1) * voxelScale)
                );

                // Check intersection against our extracted scene meshes
                for (const item of meshes) {
                    if (sampleBox.intersectsBox(item.box)) {
                        const index = getIndex(x, y, z);
                        
                        // Default block assignment (e.g., ID 1 = Stone)
                        // This can be expanded to analyze vertex colors or material types
                        blockIds[index] = 1; 
                        blockData[index] = 0;
                        break; 
                    }
                }
            }
        }
    }

    return {
        width: sizeX,  // X Axis
        height: sizeY, // Y Axis
        length: sizeZ, // Z Axis
        blocks: blockIds,
        data: blockData
    };
}

```

---

## Exporting to Map Formats (`.schematic`)

Once you run your canvas through the voxelizer, you have a coordinate grid matching the coordinate syntax expected by WorldEdit and MCEdit. To turn this raw object into a file Minecraft actually accepts, write out a classic **Sponge Schematic** or **MCEdit Schematic** payload using a client-side NBT parser (like `prismarine-nbt` compiled into your runtime).

For a lightweight, legacy `.schematic` format (which is the easiest to construct raw via standard JavaScript `ArrayBuffer` allocations), the output structure must match this NBT schema:

```json
{
  "Schematic": {
    "type": "compound",
    "value": {
      "Width": { "type": "short", "value": width },
      "Height": { "type": "short", "value": height },
      "Length": { "type": "short", "value": length },
      "Materials": { "type": "string", "value": "Alpha" },
      "Blocks": { "type": "byteArray", "value": blocksUint8Array },
      "Data": { "type": "byteArray", "value": dataUint8Array }
    }
  }
}

```

Once packed with Gzip (using an engine like `pako` directly in the browser), you can immediately pipe the output into a standard `Blob` download link (`application/octet-stream`), giving you a `.schematic` file that can be dropped directly into local Minecraft map files via WorldEdit (`//schematic load`).

---

### Advancing the Pipeline

If you are working with textured shapes, you can intercept the mesh loop to sample the material colors at the center point of each intersecting voxel. By computing a quick Euclidean color-distance check against a JSON map of standard Minecraft block textures, you can dynamically assign specific block IDs (like mapping green meshes to `grass_block` or grey regions to `andesite`) instead of defaulting to plain stone.




Not exactly. Custom models in Minecraft do **not** have to use a voxel structure. They are actually parsed as traditional 3D models composed of **polygonal cuboids**.

Minecraft supports custom geometry meshes, but it interprets them via two entirely separate pipelines depending on whether you want a static world map or an interactive object.

---

### Pipeline 1: The Voxel Structure (`.nbt` Map Format)

This matches the pipeline we built for your nunuStudio canvas. It treats your models like a grid of actual, placeable vanilla blocks (e.g., individual $1 \times 1 \times 1$ cubes of stone, glass, or dirt).

* **The Limitation:** Everything must align rigidly to the $1 \times 1 \times 1$ world grid.
* **The Benefit:** It is part of the actual game map geometry. Players can stand on the blocks, mine them, or explode them natively.

---

### Pipeline 2: JSON Polygonal Cuboids (The Resource Pack Method)

Minecraft resource packs allow you to load arbitrary 3D shapes. If you skew a model using your corner gripper in nunuStudio, you don't actually *have* to slice it into voxels. You can export the geometric bounds directly as a collection of custom 3D boxes.

Minecraft handles this by evaluating custom **JSON element meshes**:

```json
{
  "textures": { "0": "custom_app:block/my_texture" },
  "elements": [
    {
      "from": [ 0, 0, 0 ],
      "to": [ 16, 16, 16 ],
      "faces": {
        "down":  { "uv": [ 0, 0, 16, 16 ], "texture": "#0" },
        "up":    { "uv": [ 0, 0, 16, 16 ], "texture": "#0" }
      }
    }
  ]
}

```

* **The Math:** Inside this file, spatial measurements are not restricted to $1 \times 1 \times 1$ block increments. Instead, a standard single block space is divided into a $16 \times 16 \times 16$ coordinate grid. You can define non-voxel shapes—like thin tables, slanted slopes, or complex machinery—down to a precision of $1/16$th of a block.
* **The Catch:** Modern versions of Minecraft enforce a strict orientation constraint. Custom polygonal elements inside these JSON models can only be rotated in specific steps ($\pm22.5^\circ$ or $\pm45^\circ$) along a single axis at a time.

---

### Which one fits your canvas?

If your nunuStudio shapes require smooth angles, fine details, or arbitrary skews that don't map neatly to a jagged voxel grid, skip the 3D raycast voxelizer. Instead, write a client-side parser that translates your Three.js `BufferGeometry` bounding boxes into a custom item resource pack JSON format. You can link this custom geometry to an item via a unique metadata tag and display your fine-grained, smooth 3D shape directly inside the game world.

[How to Add Custom Blocks to Minecraft](https://www.youtube.com/watch?v=WWrg9NIx2CQ) goes into full detail on using data packs and resource packs to introduce custom 3D geometries that don't rely on the engine's strict world voxel system.



To convert a Three.js / nunuStudio mesh into a native Minecraft 3D JSON model, we need to translate Three.js world units into Minecraft’s **16x16x16 block element coordinate system**.

In Minecraft's model format, a single block space spans from coordinate `0` to `16`. If your Three.js model is larger than one unit, we can break it down into multiple 16-unit cuboids or scale it down to fit.

Here is a complete client-side JavaScript parser that traverses a Three.js group/mesh, extracts its bounding geometric components, maps them to Minecraft's coordinate space, and exports a valid Minecraft resource pack `.json` model file.

---

### Three.js to Minecraft Model Parser

```javascript
/**
 * Translates Three.js Geometry bounds into a native Minecraft 1.20+ JSON Model.
 * Maps Three.js meters directly to Minecraft 16x16x16 element space.
 * * @param {THREE.Object3D} rootObject - The nunuStudio/Three.js mesh or group.
 * @param {number} scaleFactor - Multiplier to fit your mesh into the 16x16x16 bounds.
 * @returns {Object} Valid Minecraft JSON model schema
 */
function exportToMinecraftJsonModel(rootObject, scaleFactor = 16.0) {
    const elements = [];
    
    // Ensure all world matrices are calculated accurately
    rootObject.updateMatrixWorld(true);

    rootObject.traverse((child) => {
        if (child.isMesh && child.geometry) {
            // Compute the bounding box for the individual geometric component
            if (!child.geometry.boundingBox) {
                child.geometry.computeBoundingBox();
            }

            // Clone and transform local bounding box to global world space
            const worldBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
            
            // Map Three.js coordinates (meters) to Minecraft's 0-16 localized coordinate grid
            // Minecraft's origin [0,0,0] is the bottom-north-west corner of the block
            const fromX = Math.max(0, Math.min(16, (worldBox.min.x * scaleFactor) + 8));
            const fromY = Math.max(0, Math.min(16, (worldBox.min.y * scaleFactor)));
            const fromZ = Math.max(0, Math.min(16, (worldBox.min.z * scaleFactor) + 8));

            const toX = Math.max(0, Math.min(16, (worldBox.max.x * scaleFactor) + 8));
            const toY = Math.max(0, Math.min(16, (worldBox.max.y * scaleFactor)));
            const toZ = Math.max(0, Math.min(16, (worldBox.max.z * scaleFactor) + 8));

            // Prevent generating invisible zero-width elements
            if (Math.abs(toX - fromX) < 0.01 || Math.abs(toY - fromY) < 0.01 || Math.abs(toZ - fromZ) < 0.01) {
                return; 
            }

            // Extract basic rotation along the Y-axis if present
            const rotation = new THREE.Euler().setFromRotationMatrix(child.matrixWorld, 'YXZ');
            const degreesY = Math.round(rotation.y * (180 / Math.PI));
            
            // Snap rotation to valid Minecraft mechanics (-45, -22.5, 0, 22.5, 45)
            const validRotations = [-45, -22.5, 0, 22.5, 45];
            const snappedRotationY = validRotations.reduce((prev, curr) => 
                Math.abs(curr - degreesY) < Math.abs(prev - degreesY) ? curr : prev
            );

            // Construct the single cuboid element block
            const element = {
                from: [parseFloat(fromX.toFixed(4)), parseFloat(fromY.toFixed(4)), parseFloat(fromZ.toFixed(4))],
                to: [parseFloat(toX.toFixed(4)), parseFloat(toY.toFixed(4)), parseFloat(toZ.toFixed(4))],
                faces: {
                    down:  { uv: [0, 0, 16, 16], texture: "#texture0", cullface: "down" },
                    up:    { uv: [0, 0, 16, 16], texture: "#texture0", cullface: "up" },
                    north: { uv: [0, 0, 16, 16], texture: "#texture0" },
                    south: { uv: [0, 0, 16, 16], texture: "#texture0" },
                    west:  { uv: [0, 0, 16, 16], texture: "#texture0" },
                    east:  { uv: [0, 0, 16, 16], texture: "#texture0" }
                }
            };

            // Inject rotation definitions if the mesh is angled
            if (snappedRotationY !== 0) {
                element.rotation = {
                    origin: [
                        parseFloat(((fromX + toX) / 2).toFixed(4)),
                        parseFloat(((fromY + toY) / 2).toFixed(4)),
                        parseFloat(((fromZ + toZ) / 2).toFixed(4))
                    ],
                    axis: "y",
                    angle: snappedRotationY
                };
            }

            elements.push(element);
        }
    });

    // Wrap the collected elements inside a standard vanilla block template
    return {
        credit: "Generated via Client-Side Three.js Parser",
        textures: {
            particle: "minecraft:block/stone",
            texture0: "minecraft:block/stone" // Replace with your custom atlas texture path
        },
        elements: elements
    };
}

```

---

### Linking the Custom Mesh to an Item (`CustomModelData`)

To load this fine-grained mesh into your game without breaking vanilla blocks, you assign it a **Custom Model Data** tag. This intercepts an item—like a `feather` or a `carved_pumpkin`—and swaps its appearance only if the specific ID matches.

Save this file as `feather.json` inside your Resource Pack under `assets/minecraft/models/item/`:

```json
{
  "parent": "minecraft:item/generated",
  "textures": {
    "layer0": "minecraft:item/feather"
  },
  "overrides": [
    { 
      "predicate": { "custom_model_data": 12345 }, 
      "model": "custom_app:block/my_custom_canvas_mesh" 
    }
  ]
}

```

---

### Spawning the Precise Model In-Game

Once the resource pack is activated, players can summon your precise, un-voxelized geometric shape using an invisible **Item Display Entity**. Run this command in-game:

```text
/summon item_display ~ ~ ~ {item:{id:"minecraft:feather",count:1,components:{"minecraft:custom_model_data":12345}}}

```

The game engine handles this smoothly: it skips world grid constraints entirely, rendering your custom sub-block resolution mesh with exact real-time lighting arrays anywhere in the environment.