# Music Marble

Music Marble is a interactive 3d physics sandbox where you can create marble run that generate music.


## Generated music showcase Video

<video src="public/video/demo.mov" controls width="100%"></video>

## Features
- **Object Controls** - Object movement, rotation, and removal
- **Notes Selections** - 12 Key selections and octave selection for higher/lower notes
- **Physics Settings** - Adjustable gravity and marble speed
- **Visual Enhancements** - 3D model decorations, shadow casting and lighting effect on collision 
- **Record & Playback** - Pre-build demo, save/load scene configurations
- **Others** - Lock/unlock camera, clear scene

## Controls

| Action | Control |
| :--- | :--- |
| **Change gravity/marble speed** | Use the lil-gui in the bottom right |
| **Move Objects** | `W` `A` `S` `D` or `Left Click + Drag` |
| **Orbit** | `Left Click + Drag` |
| **Select Object** | `Left Click` |
| **Rotate/Delete/Select note For Object** | Use the lil-gui after selecting an object |
| **Lock Camera** | Utility buttons in the top left |
| **Load demo** | Utility buttons in the top left |
| **Save/load scene** | Utility buttons in the top left |
| **Clear** | Utility buttons in the top left |

## Tech Stack

*   **Framework**: [Next.js 16](https://nextjs.org/) / [React 19](https://react.dev/)
*   **3D Engine**: [Three.js](https://threejs.org/)
*   **Physics**: [Rapier3D](https://rapier.rs/) (WASM-based deterministic physics)
*   **UI**: [Shadcn/ui](https://ui.shadcn.com/docs/components) + [Tailwind CSS](https://tailwindcss.com/) + [Lil-GUI](https://lil-gui.georgealways.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)

## Installation

1. Clone the repository
    ```bash
    git clone https://github.com/your-username/music-marble.git
    cd music-marble
    ```

2. Install dependencies
    ```bash
    npm install
    ```

3. Run the development server
    ```bash
    npm run dev
    ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser.


## Future Improvements

### Audio Features
- Add different instrument sounds (xylophone, marimba, guitar)
- Volume controls

### Visual Enhancements
- Different texture on the background and the marble
- Add more complex objects
- Lighting and shadow tweaks to make it more realistic
- Add more decorations

### Physics Enhancements
- More realistic collision detection and response on complex objects (eg. curve)
- Bounce/elasticity controls for objects' surfaces
- Support for multiple marbles

## Authors and acknowledgment
Piano sound samples sourced from [fuhton/piano-mp3](https://github.com/fuhton/piano-mp3).
Decoration models credits:

Spongebob" (https://skfb.ly/6ULpS) by SleepyPineapple is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

Christmas Ginger Bread Cookies" (https://skfb.ly/o8tMH) by GetDeadEntertainment is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

Minecraft - Steve" (https://skfb.ly/6RsFO) by Vincent Yanez is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

Minecraft Creeper" (https://skfb.ly/6TPTz) by keithandmarchant is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
