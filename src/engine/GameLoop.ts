import Matter from "matter-js";
import { GameState, CatShapeId, SkinId, MergeEvent } from "../types";
import { PhysicsWorld } from "./PhysicsWorld";
import { CatSpawner } from "./CatSpawner";
import { CollapseDetector } from "./CollapseDetector";
import { ScoreCalculator } from "./ScoreCalculator";
import { PHYSICS } from "../constants/physics";
import { SCREEN_WIDTH } from "../constants/layout";
import { CAT_SHAPES, EVOLUTION_MAP } from "../data/catShapes";

export class GameLoop {
  private physics: PhysicsWorld;
  private spawner: CatSpawner;
  private collapse: CollapseDetector;
  scorer: ScoreCalculator;

  private horizontalDirection: number = 1;
  private slowMotionFrames: number = 0;
  private forceShapeId: CatShapeId | undefined;
  private bodyShapeMap: Map<number, CatShapeId> = new Map();
  private pendingMerges: { bodyA: number; bodyB: number; shapeId: CatShapeId }[] = [];

  // Callbacks for haptic/sound feedback
  onCatDropped?: () => void;
  onCatMerged?: () => void;
  onCollapsed?: () => void;

  state: GameState;

  constructor(skinId: SkinId = "mike", forceShapeId?: CatShapeId) {
    this.physics = new PhysicsWorld();
    this.spawner = new CatSpawner();
    this.collapse = new CollapseDetector();
    this.scorer = new ScoreCalculator();
    this.forceShapeId = forceShapeId;
    this.state = this.createInitialState(skinId);
    this.setupCollisionDetection();
  }

  private createInitialState(skinId: SkinId): GameState {
    return {
      phase: "idle",
      score: 0,
      height: 0,
      heightPx: 0,
      combo: 0,
      maxCombo: 0,
      catCount: 0,
      mergeCount: 0,
      currentCat: null,
      nextShapeId: this.spawner.selectNextShape(this.forceShapeId),
      stackedCats: [],
      fallenCats: [],
      cameraY: 0,
      isNewRecord: false,
      dailyChallengeId: null,
      activeSkinId: skinId,
      lastMergeEvent: null,
      shapesUsedInGame: [],
    };
  }

  private setupCollisionDetection(): void {
    Matter.Events.on(this.physics.engine, "collisionStart", (event) => {
      for (const pair of event.pairs) {
        const shapeA = this.bodyShapeMap.get(pair.bodyA.id);
        const shapeB = this.bodyShapeMap.get(pair.bodyB.id);

        if (!shapeA || !shapeB) continue;
        if (shapeA !== shapeB) continue;

        // Same shape collision - check if evolution exists
        const nextShape = EVOLUTION_MAP[shapeA];
        if (!nextShape) continue;

        // Don't merge the currently dropping cat
        if (
          this.state.currentCat &&
          (pair.bodyA.id === this.state.currentCat.bodyId ||
            pair.bodyB.id === this.state.currentCat.bodyId) &&
          this.state.phase === "dropping"
        ) {
          continue;
        }

        // Queue merge (don't process during physics step)
        this.pendingMerges.push({
          bodyA: pair.bodyA.id,
          bodyB: pair.bodyB.id,
          shapeId: shapeA,
        });
      }
    });
  }

  private processMerges(): void {
    const processed = new Set<number>();

    for (const merge of this.pendingMerges) {
      if (processed.has(merge.bodyA) || processed.has(merge.bodyB)) continue;

      const bodyA = this.physics.getBodyById(merge.bodyA);
      const bodyB = this.physics.getBodyById(merge.bodyB);
      if (!bodyA || !bodyB) continue;

      // Check shape still matches (might have merged already)
      const currentShapeA = this.bodyShapeMap.get(merge.bodyA);
      const currentShapeB = this.bodyShapeMap.get(merge.bodyB);
      if (currentShapeA !== merge.shapeId || currentShapeB !== merge.shapeId) continue;

      const nextShape = EVOLUTION_MAP[merge.shapeId];
      if (!nextShape) continue;

      processed.add(merge.bodyA);
      processed.add(merge.bodyB);

      // Calculate merge position (midpoint)
      const mergeX = (bodyA.position.x + bodyB.position.x) / 2;
      const mergeY = (bodyA.position.y + bodyB.position.y) / 2;

      // Remove old bodies
      this.physics.removeBody(bodyA);
      this.physics.removeBody(bodyB);
      this.bodyShapeMap.delete(merge.bodyA);
      this.bodyShapeMap.delete(merge.bodyB);

      // Remove from stackedCats
      this.state.stackedCats = this.state.stackedCats.filter(
        (c) => c.bodyId !== merge.bodyA && c.bodyId !== merge.bodyB
      );

      // Create new evolved cat
      const newShape = CAT_SHAPES.find((s) => s.id === nextShape)!;
      const newBody = Matter.Bodies.fromVertices(mergeX, mergeY, [newShape.physicsVertices], {
        mass: newShape.mass,
        friction: newShape.friction,
        restitution: newShape.restitution,
        frictionAir: 0.01,
        label: `cat_${nextShape}_${Date.now()}`,
        render: { visible: false },
      });

      if (newShape.centerOfMass.x !== 0 || newShape.centerOfMass.y !== 0) {
        Matter.Body.setCentre(newBody, newShape.centerOfMass, true);
      }

      this.physics.addBody(newBody);
      this.bodyShapeMap.set(newBody.id, nextShape);

      // Add new cat to stacked
      this.state.stackedCats.push({
        bodyId: newBody.id,
        shapeId: nextShape,
        skinId: this.state.activeSkinId,
        expression: "love",
        position: { x: mergeX, y: mergeY },
        angle: 0,
        isStacked: true,
      });

      // Track the shape
      if (!this.state.shapesUsedInGame.includes(nextShape)) {
        this.state.shapesUsedInGame.push(nextShape);
      }

      // Update score and merge count
      this.state.mergeCount++;
      const mergeBonus = 200 * (CAT_SHAPES.findIndex((s) => s.id === nextShape) + 1);
      this.state.score += mergeBonus;
      this.state.combo++;
      this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);

      // Set merge event for visual feedback
      this.state.lastMergeEvent = {
        x: mergeX,
        y: mergeY,
        fromShapeId: merge.shapeId,
        toShapeId: nextShape,
        timestamp: Date.now(),
      };

      // Callback for haptics
      this.onCatMerged?.();
    }

    this.pendingMerges = [];
  }

  start(): void {
    this.spawnNextCat();
  }

  private spawnNextCat(): void {
    const shapeId = this.state.nextShapeId;
    const startX = SCREEN_WIDTH / 2;
    const body = this.spawner.createCatBody(shapeId, startX);
    this.physics.addBody(body);
    this.bodyShapeMap.set(body.id, shapeId);

    // Track shape used
    if (!this.state.shapesUsedInGame.includes(shapeId)) {
      this.state.shapesUsedInGame.push(shapeId);
    }

    this.state.currentCat = {
      bodyId: body.id,
      shapeId,
      skinId: this.state.activeSkinId,
      expression: "normal",
      position: { x: startX, y: PHYSICS.SPAWN_Y },
      angle: 0,
      isStacked: false,
    };

    this.state.nextShapeId = this.spawner.selectNextShape(this.forceShapeId);
    this.state.phase = "idle";
    this.horizontalDirection = 1;
  }

  onTap(): void {
    if (this.state.phase !== "idle" || !this.state.currentCat) return;

    const body = this.getBodyById(this.state.currentCat.bodyId);
    if (!body) return;

    this.state.currentCat.expression = "scared";
    this.spawner.dropCat(body);
    this.state.phase = "dropping";
    this.onCatDropped?.();
  }

  update(): GameState {
    switch (this.state.phase) {
      case "idle":
        this.updateIdle();
        break;
      case "dropping":
        this.updateDropping();
        break;
      case "settling":
        this.updateSettling();
        break;
      case "collapsing":
        this.updateCollapsing();
        break;
      case "gameover":
        break;
    }

    // Process any pending merges
    if (this.pendingMerges.length > 0) {
      this.processMerges();
    }

    this.updateCamera();
    this.syncPositions();
    return { ...this.state };
  }

  private updateIdle(): void {
    if (!this.state.currentCat) return;
    const body = this.getBodyById(this.state.currentCat.bodyId);
    if (!body) return;

    this.spawner.moveCatHorizontal(body, this.horizontalDirection);

    if (body.position.x >= SCREEN_WIDTH - 40) this.horizontalDirection = -1;
    if (body.position.x <= 40) this.horizontalDirection = 1;
  }

  private updateDropping(): void {
    this.physics.step();

    if (!this.state.currentCat) return;
    const body = this.getBodyById(this.state.currentCat.bodyId);
    if (!body) return;

    if (
      body.position.y > PHYSICS.SPAWN_Y + 50 &&
      Math.abs(body.velocity.y) < 2.0 &&
      body.speed < 3.0
    ) {
      this.state.phase = "settling";
      this.collapse.resetStableCount();
      this.collapse.recordHeight(this.physics.getHighestY());
    }
  }

  private updateSettling(): void {
    this.physics.step();

    const dynamicBodies = this.physics.getDynamicBodies();
    const currentHighestY = this.physics.getHighestY();
    const allStable = this.physics.isAllStable();

    const result = this.collapse.check(dynamicBodies, currentHighestY, allStable);

    switch (result) {
      case "stable":
        this.onStable();
        break;
      case "collapsed":
        this.onCollapse();
        break;
      case "settling":
        break;
    }
  }

  private updateCollapsing(): void {
    if (this.slowMotionFrames > 0) {
      this.physics.stepSlow(PHYSICS.COLLAPSE_SLOW_FACTOR);
      this.slowMotionFrames--;
    } else {
      this.state.phase = "gameover";
    }
  }

  private onStable(): void {
    if (!this.state.currentCat) return;

    this.state.currentCat.isStacked = true;
    this.state.currentCat.expression = "sleeping";
    this.state.stackedCats.push({ ...this.state.currentCat });

    this.state.catCount++;
    this.state.combo++;
    this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);

    const heightPx = PHYSICS.GROUND_Y - this.physics.getHighestY();
    this.state.heightPx = heightPx;
    this.state.height = heightPx / 100;
    this.state.score = this.scorer.calculate(
      this.state.catCount,
      this.state.height,
      this.state.combo
    ) + (this.state.mergeCount * 200); // Keep merge bonus

    if (this.state.stackedCats.length >= 2) {
      const below = this.state.stackedCats[this.state.stackedCats.length - 2];
      below.expression = "angry";
    }

    this.spawnNextCat();
  }

  private onCollapse(): void {
    this.state.phase = "collapsing";
    this.state.combo = 0;
    this.slowMotionFrames = Math.round(
      (PHYSICS.COLLAPSE_SLOW_DURATION / PHYSICS.TIMESTEP) *
        (1 / PHYSICS.COLLAPSE_SLOW_FACTOR)
    );

    for (const cat of this.state.stackedCats) {
      cat.expression = "shocked";
    }
    if (this.state.currentCat) {
      this.state.currentCat.expression = "shocked";
    }
    this.onCollapsed?.();
  }

  private updateCamera(): void {
    const targetY = Math.min(
      0,
      -(PHYSICS.GROUND_Y - this.physics.getHighestY() - 300)
    );
    this.state.cameraY +=
      (targetY - this.state.cameraY) * PHYSICS.CAMERA_LERP;
  }

  private syncPositions(): void {
    for (const cat of this.state.stackedCats) {
      const body = this.getBodyById(cat.bodyId);
      if (body) {
        cat.position = { x: body.position.x, y: body.position.y };
        cat.angle = body.angle;
      }
    }
    if (this.state.currentCat) {
      const body = this.getBodyById(this.state.currentCat.bodyId);
      if (body) {
        this.state.currentCat.position = {
          x: body.position.x,
          y: body.position.y,
        };
        this.state.currentCat.angle = body.angle;
      }
    }
  }

  private getBodyById(id: number): Matter.Body | undefined {
    return this.physics
      .getDynamicBodies()
      .concat([this.physics.ground])
      .find((b) => b.id === id);
  }

  continueFromReward(): void {
    const { fallenBodies, remainingBodies } =
      this.collapse.classifyBodies(this.physics.getDynamicBodies());

    for (const body of fallenBodies) {
      this.physics.removeBody(body);
      this.bodyShapeMap.delete(body.id);
    }

    this.state.stackedCats = this.state.stackedCats.filter((cat) => {
      return remainingBodies.some((b) => b.id === cat.bodyId);
    });

    this.state.fallenCats = [];
    this.spawnNextCat();
  }

  destroy(): void {
    this.physics.destroy();
  }
}
