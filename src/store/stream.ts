import { action, observable, computed } from 'mobx';
import GQLClient from '../api/gqlClient';

import Entity, { EntitySpec } from './entity';

export interface StreamStoreProps {
  streamStore: Stream;
}
export const streamStoreDefaultProps = { streamStore: (null as unknown) as Stream };

export interface MapInfo {
  key: number;
  id: string;
  SizeFactor: number;
  OffsetX: number;
  OffsetY: number;
  PlaceName: string;
  PlaceNameSub: string;
  TerritoryType: string;
}

export interface Place {
  mapID: number;
  territoryID: number;
  maps: MapInfo[];
}

export interface InspectorOptions {
  followSelection: boolean;
  locationInterpolation: boolean;
}

export interface PluginParams {
  apiURL: string;
  apiToken?: string;
  streamID?: number;
}

class Stream {
  @observable loading = true;

  gqlClient?: GQLClient;
  streamID = 0;
  apiURL = '';

  @observable serverID = 0;
  @observable characterID = 0;

  @observable place: Place = { mapID: 0, territoryID: 0, maps: [] };
  @observable entities = new Map<number, Entity>();

  @observable selectedEntityID = 0;
  @observable selectedMapIndex = 0;

  @observable options: InspectorOptions = {
    followSelection: true,
    locationInterpolation: true,
  };

  @action async initialize(pluginParams: PluginParams) {
    this.gqlClient = new GQLClient(pluginParams.apiURL, pluginParams.apiToken);
    const streamID = this.streamID = await this.getActiveStreamID(pluginParams);
    this.apiURL = pluginParams.apiURL;
    this.subscribeToStreamEvents();
    this.subscribeToEntityEvents();

    if (!streamID) { return; }

    const stream = await this.gqlClient.getStream(streamID);
    const { serverID, characterID, place, entities } = stream;
    this.serverID = serverID;
    this.characterID = characterID;
    this.place = place;
    for (let ent of entities) {
      this.entities.set(ent.id, new Entity(ent, undefined, this.options));
    }
    window.requestAnimationFrame(this.animationFrame);

    this.entities.forEach(ent => {
      let targetEnt = this.entities.get(ent.targetID);
      ent.target = targetEnt;
      if (ent.castingInfo) {
        let castingTargetEnt = this.entities.get(ent.castingInfo.targetID);
        ent.castingInfo.target = castingTargetEnt;
      }
    });

    this.loading = false;
  }

  async getActiveStreamID(pluginParams: PluginParams) {
    if (pluginParams.streamID) {
      return pluginParams.streamID;
    } else {
      const streams = await this.gqlClient!.listStreams();
      if (streams.length > 0) {
        return streams[0].id;
      }
    }
    return 0;
  }

  @action subscribeToStreamEvents() {
    return this.gqlClient!.subscribeToStreamEvents(
      this.streamID,
      action((typename: string, eventData: any) => {
        if (this.loading) { return; }
        switch (typename) {
          case "UpdateIDs":
            this.serverID = eventData.serverID;
            this.characterID = eventData.characterID;
            break;
          case "UpdateMap":
            this.place = eventData.place;
            this.selectedMapIndex = 0;
            break;
        }
      }),
    );
  }

  @action subscribeToEntityEvents() {
    return this.gqlClient!.subscribeToEntityEvents(
      this.streamID,
      action((entityID: number, typename: string, eventData: any) => {
        if (this.loading) { return; }

        if (typename === "AddEntity") {
          this.addEntity(eventData.entity);
          return;
        } else if (typename === "RemoveEntity") {
          this.removeEntity(eventData.id);
          return;
        } else if (typename === "SetEntities") {
          this.setEntities(eventData.entities);
          return;
        }
        let ent = this.entities.get(entityID);
        if (typename === "UpdateTarget") {
          let targetEnt = this.entities.get(eventData.targetID);
          if (targetEnt) {
            eventData.target = targetEnt;
          }
        }
        if (typename === "UpdateCastingInfo") {
          if (eventData.castingInfo) {
            let targetEnt = this.entities.get(eventData.castingInfo.targetID);
            if (targetEnt) {
              eventData.castingInfo.target = targetEnt;
            }
          }
        }
        if (ent) {
          ent.handleEntityEvent(typename, eventData);
        }
      }),
    );
  }

  @action addEntity(ent: EntitySpec) {
    let targetEnt = this.entities.get(ent.targetID);
    let currentCharacter = new Entity(ent, targetEnt, this.options);
    this.entities.set(ent.id, currentCharacter);
  }

  @action removeEntity(id: number) {
    this.entities.delete(id);
  }

  @action setEntities(entities: EntitySpec[]) {
    this.entities.clear();
    entities.forEach((ent) => {
      this.addEntity(ent);
    });
  }

  @action animationFrame = (time: number) => {
    if (this.options.locationInterpolation) {
      this.entities.forEach((ent) => ent.animationFrame(time));
    }
    window.requestAnimationFrame(this.animationFrame)
  }

  @action setSelectedEntityID(id: number) {
    this.selectedEntityID = id;
  }

  @action setSelectedMapIndex(idx: number) {
    this.selectedMapIndex = idx;
  }

  @action setOption(optionName: 'followSelection' | 'locationInterpolation', toggle: boolean) {
    this.options[optionName] = toggle;
  }

  @computed get hexCharacterID() {
    if (this.currentCharacter) {
      return this.currentCharacter.hexID;
    }
    return '0x00000000';
  }

  @computed get currentCharacter() {
    return this.entities.get(this.characterID);
  }

  @computed get selectedEntity() {
    if (this.entities.has(this.selectedEntityID)) {
      return this.entities.get(this.selectedEntityID);
    } else {
      return this.currentCharacter;
    }
  }

  @computed get entityList() {
    let ents: Entity[] = [];
    this.entities.forEach((ent) => ents.push(ent));
    ents.sort((a, b) => a.index - b.index);
    return ents;
  }


  @computed get currentMap(): MapInfo {
    if (this.place && this.place.maps.length > 0) {
      return this.place.maps[this.selectedMapIndex];
    }

    return {
      key: 1,
      id: "default/00",
      SizeFactor: 100,
      OffsetX: 0,
      OffsetY: 0,
      PlaceName: "Eorzea",
      PlaceNameSub: "",
      TerritoryType: ""
    };
  }
}

export default new Stream();
