import Matter from "matter-js";
import { CatShapeId } from "../types";
import { CAT_SHAPES } from "../data/catShapes";
import { PHYSICS } from "../constants/physics";
import { SCREEN_WIDTH } from "../constants/layout";

export class CatSpawner {
  selectNextShape(onlyShapeId?: CatShapeId): CatShapeId {
    if (onlyShapeId) return onlyShapeId;
    const totalWeight = CAT_SHAPES.reduce((sum, s) => sum + s.spawnWeight, 0);
    let rand = Math.random() * totalWeight;
    for (const shape of CAT_SHAPES) {
      rand -= shape.spawnWeight;
      if (rand <= 0) return shape.id;
    }
    return "round";
  }

  createCatBody(shapeId: CatShapeId, x: number): Matter.Body {
    const shape = CAT_SHAPES.find((s) => s.id === shapeId)!;

    const body = Matter.Bodies.fromVertices(
      x,
      PHYSICS.SPAWN_Y,
      [shape.physicsVertices],
      {
        mass: shape.mass,
        friction: shape.friction,
        restitution: shape.restitution,
        frictionAir: 0.01,
        label: `cat_${shapeId}_${Date.now()}`,
        render: { visible: false },
      }
    );

    if (shape.centerOfMass.x !== 0 || shape.centerOfMass.y !== 0) {
      Matter.Body.setCentre(body, shape.centerOfMass, true);
    }

    Matter.Body.setStatic(body, true);
    return body;
  }

  dropCat(body: Matter.Body): void {
    Matter.Body.setStatic(body, false);
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
  }

  setPosition(body: Matter.Body, x: number): void {
    const halfWidth = 40;
    const minX = halfWidth;
    const maxX = SCREEN_WIDTH - halfWidth;
    const clampedX = Math.max(minX, Math.min(maxX, x));
    Matter.Body.setPosition(body, { x: clampedX, y: body.position.y });
  }
}
