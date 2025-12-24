# Music Marble

Music Marble is a interactive 3D physics sandbox where users can create marble run that generate music. \
Our app is live at: https://music-marble.vercel.app/

## Overview
Music Marble combines physics simulation with audio feedback to create an engaging creative experience. Users can place a marble and various 3D shapes (curve, block, and hollow cylinder) onto a vertical wall, adjust their positions and rotations, and then let the marble roll through the custom-built course. Each collision generates audio feedback, turning your marble run into a musical instrument.

## Generated music showcase Video

https://github.com/user-attachments/assets/eb494d92-aaef-4e7d-9d20-4f3640862f50

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
| **Rotate / Delete (Selected Object)** | Select an object, then use lil-gui or press `R` / `Delete`
| **Lock Camera** | Utility buttons in the top left or press `L`|
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
    git clone https://github.com/willzy-MHS21/music_marble.git
    cd music_marble
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

## Usage Example

1. **Build**: Select marble and shapes from the buttons and place them on the wall
2. **Arrange**: Drag and rotate shapes to position them
3. **Test**: Press Space or the play button and watch the marble roll
4. **Refine**: Pause, adjust shapes, and iterate on your design
5. **Enjoy**: Listen to the music created by marble collisions

## Future Improvements

### Audio Features
- Add different instrument sounds (xylophone, marimba, guitar)
- Volume controls
- Different sound effects

### Visual Enhancements
- Different texture on the background and the marble
- Add more complex objects
- Lighting and shadow tweaks to make it more realistic
- Display which sepefic note is playing
- Add more decorations

### Physics Enhancements
- More realistic collision detection and response on complex objects (eg. curve)
- Bounce/elasticity controls for objects' surfaces
- Support for multiple marbles

## Project Structure
```
marble_music/
├── app/                        # Next.js app directory
├── components/                 # UI components
│   └── scene/
│       ├── MarbleScene.tsx     # Main scene component
│   └── ui/
│       ├── button.tsx          # Shadcn button components
│       ├── shape-buttons.tsx   # Shape selection buttons
│       ├── shape-gui.tsx       # Lil-gui for objects
│       ├── tooltip.tsx         # Shadcn tooltip component
│       └── utility-buttons.tsx # Utility action buttons
├── core/                       
│   ├── managers/
│   │   ├── AssetLoader.ts      # Asset loading manager
│   │   ├── MarbleManager.ts    # Marble state manager
│   │   ├── ModelManager.ts     # 3D model manager
│   │   └── SceneManager.ts     # Scene import/export manager
│   ├── objects/
│   │   ├── Model.ts            # Model class definition
│   │   └── TrajectoryLine.ts   # Physics trajectory visualization
│   ├── systems/
│   │   ├── AudioSystem.ts      # Sound effects system
│   │   ├── CameraController.ts # Camera control system
│   │   ├── DragSystem.ts       # Drag objects handling
│   │   ├── InputSystem.ts      # User input handling
│   │   ├── PhysicsSystem.ts    # Physics simulation
│   │   ├── SelectionSystem.ts  # Object selection
│   │   └── WorldGUI.ts         # Physics world controls
│   └── MarbleWorld.ts          # Main world 
└── lib/
    └── utils.ts                # React Utility functions
```

## Authors and Acknowledgment
### Development Backlogs
This project was built through three development epics:

**Epic 1: Foundation**
- Set Up the Scene
- Embed Shapes On the Background
- ***More details:** https://github.com/users/willzy-MHS21/projects/3*

**Epic 2: Core Mechanics**
- Utility Features
- Object Placement (Add, Move, Edit)
- Integrate Physics
- ***More details:** https://github.com/users/willzy-MHS21/projects/3/views/4*

**Epic 3: Polish & Features**
- Angry-Bird Like Prediction Line on Marble
- Polish the Scene
- Final Documentation
- Better Collision for Curve
- ***More details:** https://github.com/users/willzy-MHS21/projects/3/views/5*

### Credits:
- Piano sound samples sourced from [fuhton/piano-mp3](https://github.com/fuhton/piano-mp3).

- Spongebob" (https://skfb.ly/6ULpS) by SleepyPineapple is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

- Christmas Ginger Bread Cookies" (https://skfb.ly/o8tMH) by GetDeadEntertainment is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

- Minecraft - Steve" (https://skfb.ly/6RsFO) by Vincent Yanez is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

- Minecraft Creeper" (https://skfb.ly/6TPTz) by keithandmarchant is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
