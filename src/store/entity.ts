import { observable, action, computed, ObservableMap } from 'mobx';
import { InspectorOptions } from './stream';

function toHex(id: number): string {
  return `0x${('00000000' + id.toString(16)).slice(-8)}`
}

class Interpolation {
  public p0: Location;
  public t0: number;
  public p1: Location;
  public t1: number;

  private duration: number;

  constructor(p0: Location, p1: Location, startTime: number) {
    this.p0 = p0;
    this.p1 = p1;
    this.t0 = startTime;
    this.duration = p1.lastUpdated - p0.lastUpdated;
    this.t1 = this.t0 + this.duration;
  }

  pt(t: number): Location {
    if (t <= this.t0) {
      return this.p0;
    } else if (t >= this.t1) {
      return this.p1;
    }
    const lerpFactor = (t - this.t0) / (this.duration);
    const xt = this.p0.x + (this.p1.x - this.p0.x) * lerpFactor;
    const yt = this.p0.y + (this.p1.y - this.p0.y) * lerpFactor;
    const zt = this.p0.z + (this.p1.z - this.p0.z) * lerpFactor;
    return { x: xt, y: yt, z: zt, orientation: 0, lastUpdated: 0 };
  }
}

export interface BNPCInfo {
  nameID: number;
  baseID: number;
  modelID: number;
  name: string;
  size: number;
  error: string;
}

export interface ClassJob {
  id: number;
  name: string;
  abbreviation: string;
}
export interface Location {
  x: number;
  y: number;
  z: number;
  orientation: number;
  lastUpdated: number;
}

export interface Resources {
  hp: number;
  mp: number;
  tp: number;
  maxHP: number;
  maxMP: number;
  lastTick: number;
}

export interface Status {
  id: number;
  param: number;
  name: string;
  description: string;
  startedTime: number;
  duration: number;
  actorID: number;
  lastTick: number;
}

export interface Action {
  id: number;
  name: string;
  targetID: number;
  useTime: number;
}

export interface CastingInfo {
  actionID: number;
  actionName: string;
  startTime: number;
  castTime: number;
  targetID: number;
  location: Location;

  castType: number;
  effectRange: number;
  xAxisModifier: number;
  omen: string;

  target?: Entity;
}

export interface EntitySpec {
  id: number;
  index: number;
  name: string;
  targetID: number;
  ownerID: number;
  level: number;
  classJob: ClassJob;
  isNPC: boolean;
  isEnemy: boolean;
  isPet: boolean;
  bNPCInfo?: BNPCInfo;
  resources: Resources;
  location: Location;
  lastAction?: Action;
  statuses: Status[];
  lockonMarker: number;
  castingInfo?: CastingInfo;
  rawSpawnJSONData: string;
}

export default class Entity {
  id = 0;
  index = -1;
  name = "";
  bNPCInfo?: BNPCInfo;
  ownerID = 0;
  isNPC = false;
  isEnemy = false;
  isPet = false;
  rawSpawnData = {};

  @observable targetID = 0;
  @observable target?: Entity;
  @observable level = -1;
  @observable classJob: ClassJob;
  @observable resources: Resources;
  @observable location: Location;
  @observable lastAction?: Action;
  @observable castingInfo?: CastingInfo;;

  statuses = observable.map<number, Status>();

  interpBufffer: Interpolation[] = [];
  @observable interpLocation: Location;

  private options: InspectorOptions;

  constructor(ent: EntitySpec, target: Entity | undefined, options: InspectorOptions) {
    let {
      id, index, name, bNPCInfo, ownerID, isNPC, isEnemy, isPet,
      targetID, level, lastAction, castingInfo,
    } = ent;
    Object.assign(this, {
      id, index, name, bNPCInfo, ownerID, isNPC, isEnemy, isPet,
      targetID, level, lastAction, castingInfo,
    });

    this.classJob = ent.classJob;
    this.resources = ent.resources;
    this.location = ent.location;

    this.target = target;
    this.interpLocation = ent.location;
    this.rawSpawnData = JSON.parse(ent.rawSpawnJSONData);
    ent.statuses.forEach((s, idx) => {
      if (s) { this.statuses.set(idx, s); }
    });
    this.options = options;
  }

  @action handleEntityEvent(typename: string, eventData: any) {
    switch (typename) {
      case "UpdateTarget":
        this.targetID = eventData.targetID;
        this.target = eventData.target;
        break;
      case "UpdateClass":
        this.classJob = eventData.classJob;
        break;
      case "UpdateLastAction":
        this.lastAction = eventData.action;
        break;
      case "UpdateCastingInfo":
        this.castingInfo = eventData.castingInfo;
        break;
      case "UpsertStatus":
        this.statuses.set(eventData.index, eventData.status);
        break;
      case "RemoveStatus":
        this.statuses.delete(eventData.index);
        break;
      case "UpdateLocation":
        let p0 = this.location;
        this.location = eventData.location;
        if (this.options.locationInterpolation) {
          if (this.interpBufffer.length === 0) {
            p0.lastUpdated = eventData.location.lastUpdated - 350;
          }
          this.interpBufffer.push(new Interpolation(p0, eventData.location, performance.now()));
        }
        break;
      case "UpdateResources":
        this.resources = eventData.resources;
        break;
    }
  }

  @action animationFrame(time: number) {
    if (!this.options.locationInterpolation) {
      return;
    }
    let interpolation: Interpolation | undefined;
    while (this.interpBufffer.length > 0) {
      if (time < this.interpBufffer[0].t0) {
        return;
      } else if (time > this.interpBufffer[0].t1) {
        this.interpBufffer.shift();
      } else {
        interpolation = this.interpBufffer[0];
        break;
      }
    }
    if (interpolation) {
      this.interpLocation = interpolation.pt(time);
      return;
    }
    let { x: xi, y: yi, z: zi } = this.interpLocation;
    let { x, y, z } = this.location;
    let [dx, dy, dz] = [(xi - x), (yi - y), (zi - z)];
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) > 0.1) {
      this.interpLocation = this.location;
    }
  }

  @computed get realName() {
    if (this.isNPC && this.bNPCInfo) {
      return this.bNPCInfo.name || this.name;
    }
    return this.name;
  }

  @computed get hexID() {
    return toHex(this.id);
  }

  @computed get hasTarget() {
    return this.targetID !== 0xE0000000 && this.targetID !== 0;
  }

  @computed get targetString() {
    if (!this.hasTarget) { return "" };
    let name = (this.target && this.target.realName) || "Unknown";
    return `${name} (${this.hexTargetID})`;
  }

  @computed get hexTargetID() {
    return toHex(this.targetID);
  }

  @computed get castingSummary() {
    if (!this.castingInfo) { return null; }
    const { actionName, actionID } = this.castingInfo;
    return `${actionName} (${actionID})`
  }

  @computed get castingDetails() {
    if (!this.castingInfo) { return null; }

    let info: { [key: string]: any } = Object.assign({}, this.castingInfo)
    let name = (info.target && info.target.realName) || "Unknown";
    info.targetString = `${name} (${toHex(info.targetID)})`;
    delete info.targetID;
    delete info.target;

    return info;
  }

  @computed get statusList() {
    return Object.fromEntries(this.statuses.toJS());
  }

  @computed get radius() {
    if (this.bNPCInfo && this.bNPCInfo.size > 0) {
      return this.bNPCInfo.size;
    }
    return 0.5;
  }
}
