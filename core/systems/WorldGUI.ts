import GUI from 'lil-gui';
import { PhysicsSystem } from './PhysicsSystem';
import { TrajectoryLine } from '../objects/TrajectoryLine';

export class WorldGUI {
    private gui: GUI;
    private physicsSystem: PhysicsSystem;
    private trajectoryLine: TrajectoryLine;

    constructor(physicsSystem: PhysicsSystem, trajectoryLine: TrajectoryLine) {
        this.physicsSystem = physicsSystem;
        this.trajectoryLine = trajectoryLine;
        this.gui = new GUI({ title: 'World Settings' });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = 'auto';
        this.gui.domElement.style.bottom = '0';
        this.gui.domElement.style.left = 'auto';
        this.gui.domElement.style.right = '0';
        this.gui.domElement.style.margin = '5px';

        this.setupPhysicsFolder();
    }

    private setupPhysicsFolder() {
        const folder = this.gui.addFolder('Physics');
        const params = {
            showPrediction: false,
            speed: this.physicsSystem.speed,
            gravity: Math.abs(this.physicsSystem.getGravityY())
        };

        folder.add(params, 'showPrediction')
            .name('Show Prediction Line')
            .onChange((value: boolean) => {
                // Check if setVisible method exists and call it appropriately
                if (typeof (this.trajectoryLine as any).setVisible === 'function') {
                    (this.trajectoryLine as any).setVisible(value);
                } else if ('visible' in this.trajectoryLine) {
                    (this.trajectoryLine as any).visible = value;
                }
            });

        folder.add(params, 'speed', 0, 100)
            .name('Speed')
            .onChange((value: number) => {
                this.physicsSystem.speed = value;
            });

        folder.add(params, 'gravity', 0, 200)
            .name('Gravity')
            .onChange((value: number) => {
                this.physicsSystem.setGravity(-value);
            });
    }

    public dispose() {
        this.gui.destroy();
    }
}