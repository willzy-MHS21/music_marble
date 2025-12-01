import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

export class PhysicsSystem {
    world: RAPIER.World | null = null;
    private bodyMap: Map<THREE.Object3D, RAPIER.RigidBody> = new Map();

    private debugLines: THREE.LineSegments | null = null;

    async init(scene: THREE.Scene) {
        await RAPIER.init();
        const gravity = { x: 0.0, y: -9.81 * 20, z: 0.0 };
        this.world = new RAPIER.World(gravity);

        // Setup Debug Renderer
        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            vertexColors: true,
            linewidth: 2, 
            depthTest: false, 
            depthWrite: false
        });
        const geometry = new THREE.BufferGeometry();
        this.debugLines = new THREE.LineSegments(geometry, material);
        this.debugLines.renderOrder = 999;
        scene.add(this.debugLines);
    }

    public createBody(object: THREE.Object3D) {
        if (!this.world || this.bodyMap.has(object)) return;
        console.log(object);

        const type = object.userData.shapeType;

        let rigidBodyDesc: RAPIER.RigidBodyDesc;
        if (type === 'marble') {
            rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
                .setCcdEnabled(true);
        } else {
            rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
        }
        const mesh = object.children[0] as THREE.Mesh;
        const scale = this.getScale(mesh);

        rigidBodyDesc.setTranslation(object.position.x, object.position.y, object.position.z);
        rigidBodyDesc.setRotation(object.quaternion);

        const rigidBody = this.world.createRigidBody(rigidBodyDesc);
        let colliderDesc: RAPIER.ColliderDesc;
        
        // console.log(mesh);
        // console.log("real scale",this.getScale(mesh))

        if (type === 'marble') {
            console.log(scale.x)
            colliderDesc = RAPIER.ColliderDesc.ball(scale.x);
        } else {
            if (type == 'plank') {
                console.log(scale.x,scale.y,scale.z);
                colliderDesc = RAPIER.ColliderDesc.cuboid(scale.x, scale.y, scale.z);
            } else if (type == 'cylinder') {
                colliderDesc = RAPIER.ColliderDesc.cylinder(scale.y, scale.x);
            } else if (type == 'curve'){
                colliderDesc = RAPIER.ColliderDesc.cuboid(scale.x, scale.y, scale.z);
            } else {
                console.error(`Unknown shape type: ${type}`);
                return;
            }
        }
        colliderDesc.setRotation(mesh.quaternion);
        colliderDesc.setRestitution(0.9);
        this.world.createCollider(colliderDesc, rigidBody);
        this.bodyMap.set(object, rigidBody);
    }
    private getScale(mesh: THREE.Mesh) {
        const scale = new THREE.Vector3();
        mesh.updateMatrixWorld(true);
        mesh.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale);
        return scale;
    }

    public update() {
        this.world?.step();
        this.bodyMap.forEach((rigidBody, object) => {
            if (rigidBody.isDynamic()) {
                const position = rigidBody.translation();
                const rotation = rigidBody.rotation();
                object.position.set(position.x, position.y, position.z);
                object.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
            }
        });
        // Update Debug Geometry 
        if (this.world && this.debugLines) {
            const { vertices, colors } = this.world.debugRender();
            this.debugLines.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            this.debugLines.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
        }
    }
}