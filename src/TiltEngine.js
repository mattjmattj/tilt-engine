import Collider from "./Collider.js";
import InputManager from "./InputManager.js";

export default class TiltEngine {
    constructor(canvas, { onUpdate, onDraw, autoResize = true, doubleBuffering = false, fps = 120} = {}) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.doubleBuffering = doubleBuffering;
        this.fps = fps;
        this.onUpdate = onUpdate;
        this.onDraw = onDraw;
        this.gameObjects = [];
        this.isRunning = false;
        this.lastTime = 0;
        this.width = 0;
        this.height = 0;

        if (this.doubleBuffering) {
            this.bufferCanvas = document.createElement('canvas');
            this.bufferCtx = this.bufferCanvas.getContext('2d');
        }
        this.input = new InputManager();
        this.input.setup();

        if (autoResize) {
            window.addEventListener('resize', () => this.resize());
            this.resize();
        }
    }

    addGameObject(obj) {
        this.gameObjects.push(obj);
    }

    removeGameObject(obj) {
        this.gameObjects = this.gameObjects.filter(item => item !== obj);
    }

    clearGameObjects() {
        this.gameObjects = [];
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        if (this.doubleBuffering) {
            this.bufferCanvas.width = this.width;
            this.bufferCanvas.height = this.height;
        }
        if (this.width === 0 || this.height === 0) {
            return;
        }
        if (!this.isRunning) {
            this._renderFrame();
        }
    }

    _renderFrame() {
        const targetCtx = this.doubleBuffering ? this.bufferCtx : this.ctx;
        const screenSize = {
            width: this.width,
            height: this.height
        };

        targetCtx.clearRect(0, 0, this.width, this.height);

        // game-wide draw
        if (this.onDraw) {
            this.onDraw(targetCtx, screenSize)
        };

        // draw
        this.gameObjects.forEach(obj => obj.draw(targetCtx));

        if (this.doubleBuffering) {
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.ctx.drawImage(this.bufferCanvas, 0, 0);
        }
    }

    _loop(timestamp) {
        if (!this.isRunning) {
            return;
        }
        
        requestAnimationFrame((t) => this._loop(t));

        if (this.width === 0 || this.height === 0) {
            return;
        }

        const dt = (timestamp - this.lastTime) / 1000;
        if (dt < 1/this.fps) {
            return;
        }
        this.lastTime = timestamp;

        // TODO find a way to avoid running this on mobile devices
        this.input.simulateTiltWithArrowKeys();

        const screenSize = {
            width: this.width,
            height: this.height
        };

        // game-wide logic
        if (this.onUpdate) {
            this.onUpdate(dt, this.input, screenSize);
        }

        // game logic
        this.gameObjects.forEach(obj => obj.update(dt, this.input, screenSize));
        
        // physics
        this.gameObjects.forEach(obj => obj.rigidBody?.update(dt));
        
        // collisions and related physics, doing it 4 times per frame, in case some
        // collisions produce new collisions (case of stacked objects)
        for (let i = 0; i < 4; ++i) {
            this._checkCollisions();
        }
        
        // draw
        this._renderFrame();        
    }


    _checkCollisions() {
        const objectsWithColliders = this.gameObjects.filter((obj) => obj.collider instanceof Collider);

        for (let i = 0; i < objectsWithColliders.length; i++) {
            const objA = objectsWithColliders[i];
            for (let j = i + 1; j < objectsWithColliders.length; j++) {
                const objB = objectsWithColliders[j];

                const collisionManifold = objA.collider.testCollision(objB.collider, objA, objB);
                if (collisionManifold?.collided) {
                    // maybe we should collect evey collision and resolve them afterwards
                    objA.onCollision(objB);
                    objB.onCollision(objA);
                    if (objA.rigidBody && objB.rigidBody) {
                        this._resolveCollision(objA, objB, collisionManifold);
                    }
                }
            }
        }
    }

    // TODO move to rigidbody ?
    _resolveCollision(a, b, { normal, depth }) {
        // POSITIONAL CORRECTION

        // only correct 80% of overlap per frame, to avoid jittering
        const percent = 0.8;
        // we allow some overlapping, to avoid micro-correctoins of resting objects
        const slop = 0.01;

        // we use the mass for correction, with the idea of correcting lighter objects more
        // when static, infinite mass, so 1/mass = 0
        const invMassA = a.rigidBody.isStatic ? 0 : 1 / a.rigidBody.mass;
        const invMassB = b.rigidBody.isStatic ? 0 : 1 / b.rigidBody.mass;
        const invMassSum = invMassA + invMassB;
        if (invMassSum === 0) {
            return;
        }

        const correctionMag = Math.max(depth - slop, 0) / invMassSum * percent;
        const correction = {
            x: normal.x * correctionMag,
            y: normal.y * correctionMag
        };

        // now we apply correction in regards of their mass
        if (!a.rigidBody.isStatic) {
            a.x -= correction.x * invMassA;
            a.y -= correction.y * invMassA;
        }
        if (!b.rigidBody.isStatic) {
            b.x += correction.x * invMassB;
            b.y += correction.y * invMassB;
        }

        // IMPULSE RESOLUTION

        // relative velocity
        const rv = {
            x: b.rigidBody.vx - a.rigidBody.vx,
            y: b.rigidBody.vy - a.rigidBody.vy
        };

        // dot-product of the relative velocity and the normal, to know how much
        // of that relative velocity is directed towards the collision surface
        const velocityAlongNormal = rv.x * normal.x + rv.y * normal.y;

        // if the objects are already moving apart, but still in collision, we should
        // not do anything
        if (velocityAlongNormal > 0) {
            return;
        }

        // coefficient of restitution (https://en.wikipedia.org/wiki/Coefficient_of_restitution)
        // this is why we define bounciness
        // here, the choice was between max (if one is bouncy, the collision is bouncy)
        // or min (if one is not bouncy, the collision is not bouncy)
        // or maybe average
        const e = Math.max(a.rigidBody.bounciness, b.rigidBody.bounciness);

        // impulse (https://en.wikipedia.org/wiki/Impulse_(physics)) = what force we will apply back
        // along the normal
        // -(1 - e) gives -1 for 0 restitution, which means only negating velocity
        // -(1 - e) gives -2 for 1 restitution, which means no energy loss at impact (perfect bounce)
        const j = -(1 + e) * velocityAlongNormal / invMassSum;
        const impulse = {
            x: j * normal.x,
            y: j * normal.y
        };

        if (!a.rigidBody.isStatic) {
            a.rigidBody.vx -= impulse.x * invMassA;
            a.rigidBody.vy -= impulse.y * invMassA;
        }
        if (!b.rigidBody.isStatic) {
            b.rigidBody.vx += impulse.x * invMassB;
            b.rigidBody.vy += impulse.y * invMassB;
        }
    }

    start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this._loop(t));
    }

    stop() {
        this.isRunning = false;
    }
}