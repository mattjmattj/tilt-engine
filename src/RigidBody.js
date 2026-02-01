import { clamp } from "./utils.js";

export default class RigidBody {
    constructor({ gameObject, mass = 10, friction = 0.98, isStatic = false, bounciness = 0.5 } = {}) {
        this.gameObject = gameObject;
        this.mass = mass;
        this.friction = clamp(friction, 0, 1);
        this.isStatic = isStatic;
        this.bounciness = clamp(bounciness, 0, 1);
        this.vx = 0;
        this.vy = 0;
    }

    update(dt) {
        if (this.isStatic) {
            return;
        }

        this.vx *= this.friction;
        this.vy *= this.friction;

        this.gameObject.x += this.vx * dt;
        this.gameObject.y += this.vy * dt;
    }
}