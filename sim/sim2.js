// Full port of Boxel 3D (v1 hosted build) gameplay physics for TAS search.
// Mirrors: entities/*.js constructors, Level.setObjectProperties/resetLevel/retryLevel,
// Collision.checkPlayerCollision, Player (jump/controls/force/rope), Rope.js, App.updateEngine/updateGravity,
// and the Boxel 3D TAS v2.1.1 input semantics.
const Matter = require('./matter/build/matter.js');
const { Engine, Bodies, Body, Composite, Events, Vector, Query, Constraint, Sleeping } = Matter;

let UUID = 0;
class Ent {
  constructor(opts = {}) {
    this.name = 'ent' + (UUID++);
    this.position = { x: 0, y: 0, z: 0 };
    this.rotationZ = 0;
    this.scale = { x: 1, y: 1, z: 1 };
    this.visible = true;
    const sx = opts.scaleX == null ? 1 : opts.scaleX, sy = opts.scaleY == null ? 1 : opts.scaleY;
    this.hitbox = Bodies.rectangle(0, 0, sx, sy, { class: 'hitbox' });
    this.body = Body.create({
      parts: [this.hitbox], friction: 0.0, frictionAir: 0.0, frictionStatic: 0.0,
      restitution: 0.0, slop: 0.0, timeScale: 1.0, name: this.name, class: 'cube', object3D: this,
    });
    this.setPosition({ x: 0, y: 0, z: 0 });
    this.setRotation(0);
    this.setScale({ x: 1, y: 1, z: 1 });
    this.setMode(); this.setJumpMode(); this.setForceDirection();
  }
  setPosition(p, updateOrigin = true) {
    p = { x: p.x == null ? this.position.x : p.x, y: p.y == null ? this.position.y : p.y, z: p.z == null ? this.position.z : p.z };
    this.position = { x: p.x, y: p.y, z: p.z };
    Body.setPosition(this.body, { x: p.x, y: -p.y });
    if (updateOrigin) this.positionOrigin = { x: p.x, y: p.y, z: p.z };
  }
  setRotation(r, updateOrigin = true) {
    const z = typeof r == 'object' ? r.z : r;
    this.rotationZ = z;
    Body.setAngle(this.body, -z);
    if (updateOrigin) this.rotationOrigin = z;
  }
  setScale(s, updateOrigin = true) {
    s = { x: s.x == null ? this.scale.x : s.x, y: s.y == null ? this.scale.y : s.y, z: s.z == null ? this.scale.z : s.z };
    const tempAngle = this.rotationZ;
    this.setRotation(0, false);
    Body.scale(this.body, s.x / this.scale.x, s.y / this.scale.y);
    this.scale = { x: s.x, y: s.y, z: s.z };
    this.setRotation(tempAngle, false);
    if (updateOrigin) this.scaleOrigin = { x: s.x, y: s.y, z: s.z };
  }
  setStatic(isStatic = true, updateOrigin = true) { Body.setStatic(this.body, isStatic); if (updateOrigin) this.isStaticOrigin = isStatic; }
  setFriction(f = 0.1, updateOrigin = true) { this.body.friction = parseFloat(f); if (updateOrigin) this.frictionOrigin = parseFloat(f); }
  setMode(mode, updateOrigin = true) { mode = mode == null ? 'default' : mode; this.mode = mode; if (updateOrigin) this.modeOrigin = mode; }
  setJumpMode(mode, updateOrigin = true) { mode = mode == null ? 'limited' : mode; this.jumpMode = mode; if (updateOrigin) this.jumpModeOrigin = mode; }
  setForceDirection(force = { x: 0, y: 0 }, updateOrigin = true) { this.force = force; if (updateOrigin) this.forceOrigin = force; }
  freeze(state = true) { this.body.collisionFilter.category = state ? 0 : 1; Sleeping.set(this.body, state); }
  hide(state = true) { this.visible = !state; this.freeze(state); }
  isFrozen() { return this.body.collisionFilter.category == 0; }
  isStatic() { return this.body.isStatic; }
  resetToOrigin() {
    this.hide(false);
    this.setPosition(this.positionOrigin, false);
    this.setRotation(this.rotationOrigin, false);
    this.setScale({ x: this.scaleOrigin.x, y: this.scaleOrigin.y, z: this.scaleOrigin.z }, false);
    this.setForceDirection(this.forceOrigin, false);
    this.setStatic(this.isStaticOrigin, false);
    this.setFriction(this.frictionOrigin, false);
    this.setMode(this.modeOrigin, false);
    this.setJumpMode(this.jumpModeOrigin, false);
    Body.setVelocity(this.body, { x: 0, y: 0 });
    Body.setAngularVelocity(this.body, 0);
  }
  calculateForceDirection(bodyA, bodyB) { return Vector.rotate({ x: 0.00025 * bodyB.mass, y: 0 }, bodyA.angle); }
}

function sensorPart(ent, cls, pos, size) {
  ent.body.class = cls;
  ent.sensor = Bodies.rectangle(pos.x, -pos.y, size.x, size.y, { isSensor: true, density: 0, class: 'sensor' });
  Body.setParts(ent.body, [ent.hitbox, ent.sensor]);
}

function createObject(cls) {
  const e = new Ent({});
  switch (cls) {
    case 'player':
      e.body.class = 'player';
      e.setScale({ x: 16, y: 16, z: 16 }); e.setStatic(false);
      e.setMode('jump'); e.setJumpMode('limited');
      e.jumpReady = false; e.controls = { left: 0, right: 0, acceleration: 0.5, speed: 4 };
      e.rope = new Rope(); e.checkpoint = null;
      break;
    case 'finish': case 'direction': case 'grapple':
      sensorPart(e, cls, { x: 0, y: 0 }, { x: 1, y: 1 }); e.setScale({ x: 16, y: 16, z: 16 }); break;
    case 'bounce': case 'spike':
      sensorPart(e, cls, { x: 0, y: 0.6 }, { x: 0.6, y: 0.2 }); e.setScale({ x: 16, y: 16, z: 16 }); break;
    case 'control': case 'checkpoint': case 'reset': case 'resize':
      e.hitbox.isSensor = true; sensorPart(e, cls, { x: 0, y: 0 }, { x: 1, y: 1 }); e.setScale({ x: 16, y: 16, z: 16 }); break;
    case 'gravity': case 'tip':
      e.body.class = cls; e.hitbox.isSensor = true; e.hitbox.class = 'sensor'; e.setScale({ x: 16, y: 16, z: 16 }); break;
    case 'cube': break;
    default: throw new Error('unsupported class ' + cls);
  }
  return e;
}

class Rope {
  constructor() { this.radius = 4; this.children = []; }
  addJoints(game, bodyA, bodyB, pointB) {
    const p1 = bodyA.position, p2 = pointB;
    const length = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    const joints = 4, minLength = 16 / joints, speed = 1 / joints;
    for (let i = 1; i <= joints; i++) {
      const isLastJoint = i == joints, percent = i / joints;
      const jointPosition = { x: p1.x + (p2.x - p1.x) * percent, y: p1.y + (p2.y - p1.y) * percent };
      if (i > 1) bodyA = this.children[this.children.length - 1].body;
      this.children.push(new Joint(game, { bodyA, bodyB, isLastJoint, minLength, position: jointPosition, radius: this.radius, speed }));
    }
  }
  removeJoints(game) {
    for (let i = this.children.length - 1; i >= 0; i--) { const c = this.children[i]; Composite.remove(game.world, c.constraint); Composite.remove(game.world, c.body); this.children.splice(i, 1); }
  }
  updateJoints() { for (const c of this.children) c.shrink(); }
}
class Joint {
  constructor(game, o) {
    this.speed = o.speed; this.minLength = o.minLength;
    this.part = Bodies.circle(o.position.x, o.position.y, o.radius, { isSensor: true });
    this.body = Body.create({ parts: [this.part], friction: 0, frictionAir: 0, frictionStatic: 0, restitution: 0 });
    Composite.add(game.world, this.body);
    let bodyB = this.body, pointB = { x: 0, y: 0 };
    if (o.isLastJoint) {
      Composite.remove(game.world, this.body);
      bodyB = o.bodyB;
      pointB = { x: -(bodyB.position.x - o.position.x), y: -(bodyB.position.y - o.position.y) };
    }
    this.offset = pointB;
    this.constraint = Constraint.create({ bodyA: o.bodyA, bodyB, mass: 0, pointB, stiffness: 1.5, shrink: true });
    Composite.add(game.world, this.constraint);
  }
  shrink() {
    if (this.constraint.shrink == true) {
      if (this.constraint.length > this.minLength) this.constraint.length -= this.speed;
      else { this.constraint.length = this.minLength; this.constraint.shrink = false; }
    }
  }
}

function gravityVector(angle = 0) { // Utility.getVectorFromAngle
  const pi = Math.PI, decimal = 1e3, degrees = -angle * (180 / pi);
  return { x: Math.round(Math.cos((90 - degrees) * (pi / 180)) * decimal) / decimal, y: Math.round(Math.sin((90 - degrees) * (pi / 180)) * decimal) / decimal };
}

class Game {
  constructor(levelJSON) {
    this.engine = Engine.create();
    this.world = this.engine.world;
    this.children = [];
    this.byName = new Map();
    this.play = true; this.finished = false; this.dead = false;
    this.tips = 0; this.events = []; this.virtualTips = false; this.hiddenTips = {};
    for (const d of levelJSON.children) {
      const o = createObject(d.class);
      o.setPosition({ x: d.position.x, y: d.position.y, z: d.position.z });
      o.setScale({ x: d.scale.x, y: d.scale.y, z: d.scale.z });
      o.setRotation({ x: d.rotation.x, y: d.rotation.y, z: d.rotation.z });
      o.setStatic(d.isStatic);
      if (d.text) o.text = d.text;
      o.setFriction(d.friction);
      if (o.position.z == 0) Composite.add(this.world, o.body);
      this.children.push(o); this.byName.set(o.name, o);
      if (d.class == 'player') this.player = o;
    }
    this.engine.__game = this;
    Events.on(this.engine, 'collisionStart', function (e) { this.__game.onCollision(e); });
    this.afterUpdate = [];
    Events.on(this.engine, 'afterUpdate', function () { const g = this.__game; for (const f of g.afterUpdate) f(g); });
  }
  updateGravity(angle) { const v = gravityVector(angle); this.world.gravity.x = v.x; this.world.gravity.y = v.y; }
  removeRope() { this.player.rope.removeJoints(this); }
  resetLevel() { for (const c of this.children) c.resetToOrigin(); }
  retryLevel(keepCheckpoint = false) {
    this.hiddenTips = {};
    this.updateGravity(); this.play = true; this.finished = false; this.dead = false;
    this.removeRope(); this.resetLevel();
    if (keepCheckpoint == false || this.player.checkpoint == null) this.player.checkpoint = null;
    else { this.player.resetToOrigin(); const c = this.player.checkpoint; this.player.setPosition({ x: c.x, y: c.y, z: c.z }, false); }
  }
  tasStart() { // TAS 't' (no savestate)
    this.removeRope();
    this.player.controls.left = 0; this.player.controls.right = 0;
    this.retryLevel();
    for (const c of this.children) if (!c.isStatic()) Body.setVelocity(c.body, { x: 0, y: 0 });
  }
  onCollision(e) {
    const P = this.player;
    for (const pair of e.pairs) {
      const bodies = [pair.bodyA, pair.bodyB];
      for (let i = 0; i < 2; i++) {
        const s = bodies[i], c = bodies[(i + 1) % 2];
        const l = this.byName.get(s.parent.name), u = this.byName.get(c.parent.name);
        if (l == null || u == null) continue;
        if (this.virtualTips && ((l.body.class == 'tip' && this.hiddenTips[l.name]) || (u.body.class == 'tip' && this.hiddenTips[u.name]))) continue;
        if (l.body.class == 'player') P.jumpReady = true;
        if (c.class == 'sensor') continue;
        if (s.class != 'sensor') continue;
        const k = l.body.class, isP = u.body.class == 'player';
        if (k == 'tip') { if (isP) { this.tips++; this.events.push(['tip', this.stepNo]); if (this.virtualTips) this.hiddenTips[l.name] = 1; else l.hide(true); } }
        else if (k == 'bounce') { const d = l.scale.y / 2; if (l.body.isStatic == false) setForce(this, l, d, u, true); if (u.body.isStatic == false) setForce(this, u, d, l, false); }
        else if (k == 'checkpoint') { if (isP) { P.checkpoint = { x: l.position.x, y: l.position.y, z: l.position.z }; this.events.push(['checkpoint', this.stepNo, l.position.x]); } }
        else if (k == 'spike') { if (isP) this.kill(); }
        else if (k == 'direction') { const d = u.calculateForceDirection(l.body, u.body); u.setForceDirection(d, false); }
        else if (k == 'gravity') { if (isP) this.updateGravity(l.body.angle); }
        else if (k == 'grapple') { if (isP) P.setMode('grapple', false); }
        else if (k == 'finish') { if (isP && this.play) { this.play = false; this.finished = true; } }
        else if (k == 'reset') { if (isP) this.playerReset(); }
        else if (k == 'control') { if (isP) P.setMode('control', false); }
        else if (k == 'resize') { if (u.isStatic() == false) u.setScale({ x: l.scale.x, y: l.scale.y, z: l.scale.z }, false); }
        else if (k != 'cube') throw new Error('unhandled ' + k);
      }
    }
  }
  playerReset() {
    const P = this.player;
    this.updateGravity(); P.setForceDirection();
    P.setScale({ x: P.scaleOrigin.x, y: P.scaleOrigin.y, z: P.scaleOrigin.z }, false);
    P.setMode(P.modeOrigin, false); P.setJumpMode(P.jumpModeOrigin, false);
    P.controls.left = P.controls.right = 0;
  }
  kill() { const P = this.player; if (!P.isFrozen()) P.freeze(true); this.dead = true; }
  jump() {
    const p = this.player, body = p.body;
    if (!(p.mode == 'jump' || p.mode == 'control')) return false;
    if (!(p.jumpReady == true || p.jumpMode == 'unlimited')) return false;
    p.jumpReady = false;
    const gravity = this.world.gravity;
    const gravityAngle = Math.PI / 2 - Vector.angle({ x: 0, y: 0 }, gravity);
    let velocity = body.velocity, angularVelocity = Math.PI / 20;
    const f = 0.025, force = { x: -(gravity.x * f * body.mass), y: -(gravity.y * f * body.mass) };
    velocity = Vector.rotate(velocity, gravityAngle);
    velocity.y = 0;
    angularVelocity *= velocity.x >= 0 ? 1 : -1;
    velocity = Vector.rotate(velocity, -gravityAngle);
    if (body.speed < p.controls.speed * 0.25) angularVelocity = 0;
    Body.setVelocity(body, velocity); Body.setAngularVelocity(body, angularVelocity);
    Body.applyForce(body, body.position, force);
    return true;
  }
  addRope(mouse) { // Player.addRope (uses render position)
    const P = this.player;
    if (!(P.mode == 'grapple' && P.isFrozen() == false)) return false;
    const spacing = 4, length = 400;
    const dx = mouse.x - P.position.x, dy = mouse.y - P.position.y, distance = Math.sqrt(dx * dx + dy * dy);
    const p1 = { x: P.position.x, y: -P.position.y };
    const p2 = { x: P.position.x + (mouse.x - P.position.x) * length / distance, y: -(P.position.y + (mouse.y - P.position.y) * length / distance) };
    this.removeRope();
    for (let i = 0; i < length; i += spacing) {
      const percent = i / length, point = { x: p1.x + (p2.x - p1.x) * percent, y: p1.y + (p2.y - p1.y) * percent };
      const col = Query.point(this.world.bodies, point);
      if (col.length > 0 && col[0].class != 'player') {
        const obj = this.byName.get(col[0].name);
        if (obj && obj.visible == true && obj.position.z == 0 && !(this.virtualTips && this.hiddenTips[obj.name])) {
          P.rope.addJoints(this, P.body, col[0], point); P.rope.updateJoints();
          return point;
        }
      }
    }
    return null;
  }
  step() { // App.updateEngine + updateRender (alpha 1)
    if (!this.play) return;
    const P = this.player, b = P.body;
    if (P.mode == 'control') { // updateControls
      const gravity = this.world.gravity, direction = P.controls.left + P.controls.right;
      const force = { x: gravity.y * direction, y: -gravity.x * direction };
      const velocity = b.velocity, speed = Vector.dot(velocity, force);
      const speedClamped = Math.max(speed, Math.min(speed + P.controls.acceleration, 4));
      const acc = speedClamped - speed;
      velocity.x += force.x * acc; velocity.y += force.y * acc;
      Body.setVelocity(b, velocity);
    }
    if (b.speed < P.controls.speed) Body.applyForce(b, b.position, { x: P.force.x, y: P.force.y });
    P.rope.updateJoints();
    Engine.update(this.engine, 1000 / 60);
    if (!P.isFrozen() && !P.isStatic()) P.position = { x: b.position.x, y: -b.position.y, z: P.position.z };
    if (P.position.y < -1000) this.kill();
    for (const c of this.dynamics || (this.dynamics = this.children.filter(c => c !== P && c.isStaticOrigin === false))) {
      if (c.removed) continue;
      if (-c.body.position.y < -1000) { Composite.remove(this.world, c.body); c.removed = true; }
    }
  }
}

function setForce(game, self, force, object, relativeAngle) {
  const x1 = self.body.positionPrev.x, x2 = self.body.position.x, y1 = self.body.positionPrev.y, y2 = self.body.position.y;
  let angleA = object.body.angle, angleB = Math.atan2(y2 - y1, x2 - x1);
  if (relativeAngle) { angleA = self.body.angle; angleB = self.body.angle + Math.PI / 2; force *= -1; }
  const vx = Math.cos(angleB), vy = Math.sin(angleB), nx = -Math.sin(angleA), ny = Math.cos(angleA);
  const dot = vx * nx + vy * ny, vnewx = vx - 2 * dot * nx, vnewy = vy - 2 * dot * ny;
  if (dot < 0 && (Math.abs(vnewx) == 1 || Math.abs(vnewy) == 1)) force *= -1;
  Body.setVelocity(self.body, { x: vnewx * force, y: vnewy * force });
}

// TAS input consumption (identical to Boxel 3D TAS v2.1.1), executed in afterUpdate
function makeConsumer(game, inputs, log) {
  const temp = [...inputs];
  return function consume() {
    for (let i = 0; i < 4; i++) {
      if (temp.length == 0) break;
      const n = temp[0];
      if (typeof n == 'number') { if (n == 0) { temp.splice(0, 1); continue; } temp[0]--; break; }
      temp.splice(0, 1);
      const P = game.player;
      if (n == 'j') log.push([game.stepNo, 'j', game.jump()]);
      else if (n == 'a') P.controls.left = -1;
      else if (n == 'd') P.controls.right = 1;
      else if (n == 'A') P.controls.left = 0;
      else if (n == 'D') P.controls.right = 0;
      else if (n[0] == 'g') { const ang = Number(n.slice(1) * Math.PI / 180); log.push([game.stepNo, n, game.addRope({ x: P.position.x + Math.cos(ang), y: P.position.y + Math.sin(ang) })]); }
      else if (n == 'G') game.removeRope();
      else if (n == 'c') { game.removeRope(); game.retryLevel(true); log.push([game.stepNo, 'c']); }
    }
  };
}

function runTAS(game, inputs, maxSteps, onStep, initialJumpReady = false, afterStart = null) {
  const log = [];
  game.tasStart();
  if (afterStart) afterStart(game);
  game.player.jumpReady = initialJumpReady;
  game.player.position = { x: game.player.body.position.x, y: -game.player.body.position.y, z: 0 };
  game.afterUpdate = [makeConsumer(game, inputs, log)];
  game.events = [];
  for (let s = 1; s <= maxSteps; s++) {
    game.stepNo = s;
    game.step();
    if (onStep) onStep(s, game);
    if (game.finished) return { r: 'finish', steps: s, log, events: game.events };
    if (game.dead) return { r: 'dead', steps: s, log, events: game.events };
  }
  return { r: 'timeout', steps: maxSteps, log, events: game.events };
}

function cloneGame(game) {
  const shared = game.__shared || (game.__shared = (() => {
    const set = new Set();
    for (const c of game.children) if (c !== game.player && c.isStaticOrigin !== false && (c.body.class != 'tip' || game.virtualTips)) {
      set.add(c); set.add(c.position); set.add(c.scale);
      for (const p of c.body.parts) { set.add(p); set.add(p.vertices); set.add(p.axes); set.add(p.bounds); for (const v of p.vertices) set.add(v); }
    }
    set.add(game.byName); set.add(game.children);
    return set;
  })());
  const map = new Map();
  const cp = (o) => {
    if (o === null || typeof o !== 'object') return o;
    if (shared.has(o)) return o;
    const m = map.get(o); if (m) return m;
    let n;
    if (Array.isArray(o)) { n = new Array(o.length); map.set(o, n); for (let i = 0; i < o.length; i++) n[i] = cp(o[i]); if (o.length !== Object.keys(o).length) for (const k of Object.keys(o)) if (!(k >= 0)) n[k] = cp(o[k]); return n; }
    n = Object.create(Object.getPrototypeOf(o)); map.set(o, n);
    for (const k of Object.keys(o)) n[k] = cp(o[k]);
    return n;
  };
  const g = cp(game); g.__shared = shared;
  // children/byName are shared containers: rebuild with cloned mutable entities
  g.children = game.children.map(c => cp(c)); g.byName = new Map(g.children.map(c => [c.name, c]));
  return g;
}

module.exports = { Game, runTAS, cloneGame, makeConsumer, Matter, gravityVector };
