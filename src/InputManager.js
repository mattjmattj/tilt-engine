
export default class InputManager {
    constructor({ gravity = 9.8, tiltDeadzone = 0.05 } = {}) {
        this.gravity = gravity;
        this.tiltDeadzone = tiltDeadzone;

        this.tilt =  { x: 0, y: 0 };
        this.raw = { x: 0, y: 0, z: 0 };
        this.keys = {
            // we preaffect arrow keys to avoid undefined values in simulateTiltWithArrowKeys
            'ArrowUp': false,
            'ArrowDown': false,
            'ArrowLeft': false,
            'ArrowRight': false,
        };
    }

    setup() {
        // keyboard
        addEventListener('keydown', (event) => this.keys[event.code] = true);
        addEventListener('keyup', (event) => this.keys[event.code] = false);

        // device motion
        // TODO it may be necessary to request sensors permissions on some browsers (IOS?)
        addEventListener('devicemotion', (event) => {
            const acc = event.accelerationIncludingGravity;
            if (!acc) {
                return;
            }

            this.raw.x = acc.x;
            this.raw.y = acc.y;
            this.raw.z = acc.z;
            
            this.tilt.x = -this.raw.x / this.gravity;
            this.tilt.y = this.raw.y / this.gravity;

            if (Math.abs(this.tilt.x) < this.tiltDeadzone) {
                this.tilt.x = 0;
            }
            if (Math.abs(this.tilt.y) < this.tiltDeadzone ) {
                this.tilt.y = 0;
            }
        });
    }

    /**
     * when using the engine on desktop, we might want to emulate tilt using arrow keys,
     * mostly for debugging purpose
     */
    simulateTiltWithArrowKeys(tilt = 0.5) {
        if (this.tilt.x === 0) {
            this.tilt.x = (this.keys['ArrowRight'] - this.keys['ArrowLeft']) * tilt;
        }
        if (this.tilt.y === 0) {
            this.tilt.y = (this.keys['ArrowDown'] - this.keys['ArrowUp']) * tilt;
        }
    }
}