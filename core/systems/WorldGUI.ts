import GUI from 'lil-gui';
import { PhysicsSystem } from './PhysicsSystem';

export class WorldGUI {
    private gui: GUI;
    private physicsSystem: PhysicsSystem;

    constructor(physicsSystem: PhysicsSystem) {
        this.physicsSystem = physicsSystem;
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
            showColliders: true,
            speed: this.physicsSystem.speed,
            gravity: Math.abs(this.physicsSystem.getGravityY())
        };

        folder.add(params, 'showColliders')
            .name('Show Debug Lines')
            .onChange((value: boolean) => {
                this.physicsSystem.setDebugVisibility(value);
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
