import Matter from "matter-js";
import { PHYSICS } from "../constants/physics";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "../constants/layout";

export class PhysicsWorld {
  engine: Matter.Engine;
  world: Matter.World;
  ground: Matter.Body;
  leftWall: Matter.Body;
  rightWall: Matter.Body;

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: PHYSICS.GRAVITY,
      enableSleeping: false,
    });
    this.world = this.engine.world;

    this.ground = Matter.Bodies.rectangle(
      SCREEN_WIDTH / 2,
      PHYSICS.GROUND_Y + 25,
      SCREEN_WIDTH,
      50,
      {
        isStatic: true,
        friction: PHYSICS.GROUND.friction,
        restitution: PHYSICS.GROUND.restitution,
        label: "ground",
      }
    );

    this.leftWall = Matter.Bodies.rectangle(
      -25,
      SCREEN_HEIGHT / 2,
      50,
      SCREEN_HEIGHT * 3,
      {
        isStatic: true,
        friction: PHYSICS.WALL.friction,
        restitution: PHYSICS.WALL.restitution,
        label: "wall_left",
      }
    );

    this.rightWall = Matter.Bodies.rectangle(
      SCREEN_WIDTH + 25,
      SCREEN_HEIGHT / 2,
      50,
      SCREEN_HEIGHT * 3,
      {
        isStatic: true,
        friction: PHYSICS.WALL.friction,
        restitution: PHYSICS.WALL.restitution,
        label: "wall_right",
      }
    );

    Matter.Composite.add(this.world, [
      this.ground,
      this.leftWall,
      this.rightWall,
    ]);
  }

  addBody(body: Matter.Body): void {
    Matter.Composite.add(this.world, body);
  }

  removeBody(body: Matter.Body): void {
    Matter.Composite.remove(this.world, body);
  }

  step(delta: number = PHYSICS.TIMESTEP): void {
    Matter.Engine.update(this.engine, delta);
  }

  stepSlow(factor: number): void {
    Matter.Engine.update(this.engine, PHYSICS.TIMESTEP * factor);
  }

  getDynamicBodies(): Matter.Body[] {
    return Matter.Composite.allBodies(this.world).filter((b) => !b.isStatic);
  }

  isAllStable(): boolean {
    const bodies = this.getDynamicBodies();
    return bodies.every(
      (b) =>
        Math.abs(b.velocity.x) < PHYSICS.STABLE_VELOCITY_THRESHOLD &&
        Math.abs(b.velocity.y) < PHYSICS.STABLE_VELOCITY_THRESHOLD &&
        Math.abs(b.angularVelocity) < 0.01
    );
  }

  getHighestY(): number {
    const bodies = this.getDynamicBodies();
    if (bodies.length === 0) return PHYSICS.GROUND_Y;
    return Math.min(...bodies.map((b) => b.position.y - 30));
  }

  clear(): void {
    const bodies = this.getDynamicBodies();
    bodies.forEach((b) => Matter.Composite.remove(this.world, b));
  }

  destroy(): void {
    Matter.Engine.clear(this.engine);
  }
}
