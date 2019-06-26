import React, { Component } from 'react';

import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import { inject, observer } from 'mobx-react';

import MapBackground from './MapBackground';
import MapEntity from './MapEntity';
import MapTelegraph from './MapTelegraph';
import { observe, IMapDidChange, ObservableMap } from 'mobx';
import { StreamStoreProps, streamStoreDefaultProps, MapInfo } from '../store/stream';
import Entity from '../store/entity';
import Telegraph from './MapTelegraph';

// interface ViewportFixed {
//   screenHeight: number;
//   fixHeight()
// }
@inject('streamStore')
@observer
export default class MapView extends Component<StreamStoreProps> {
  static defaultProps = streamStoreDefaultProps;

  private _canvas?: HTMLCanvasElement;
  private app?: PIXI.Application;
  private viewport?: Viewport;
  private entityContainer = new PIXI.Container();
  private telegraphsContainer = new PIXI.Container();
  private mapContainer = new PIXI.Container();

  private entitySprites: { [key: number]: MapEntity } = {};
  private telegraphSprites: { [key: number]: Telegraph } = {};
  private mapSprite?: MapBackground;

  private entityObserverDispose?: () => void;
  private mapObserverDispose?: () => void;
  private selectedEntityObserverDispose?: () => void;
  private optionsObserverDispose?: () => void;

  private coordText = new PIXI.Text('', {fontFamily : 'Arial', fontSize: 24, fill : 0x000000, align : 'center'});
  private hoverName?: string;

  componentDidMount() {
    this.app = new PIXI.Application({
      width: 100,
      height: 100,
      view: this._canvas,
      antialias: true,
    });

    this.viewport = new Viewport({
      interaction: this.app.renderer.plugins.interaction,
    });

    this.viewport
      .drag()
      .pinch()
      .wheel()
      .decelerate();

    this.viewport.zoomPercent(8);

    this.app.stage.addChild(this.viewport);

    this.viewport.addChild(this.mapContainer);
    this.viewport.addChild(this.telegraphsContainer);
    this.viewport.addChild(this.entityContainer);

    window.addEventListener('resize', this.resize);
    this.resize();

    this.updateMap(this.props.streamStore.currentMap);

    this.props.streamStore.entities.forEach((entity, key) => {
      this.addEntity(key, entity);
      this.updateTelegraph(key, entity);
    });

    this.entityObserverDispose = observe<number, Entity>(
      this.props.streamStore.entities as ObservableMap<number, Entity>,
      this.handleEntityChange,
    );

    this.mapObserverDispose = observe(
      this.props.streamStore, "currentMap",
      (change) => this.updateMap(change.newValue),
    );

    this.selectedEntityObserverDispose = observe(
      this.props.streamStore, "selectedEntity",
      (change) => this.updateEntitySelection(change.oldValue, change.newValue),
    );
    this.updateEntitySelection(undefined, this.props.streamStore.selectedEntity);

    this.optionsObserverDispose = observe(
      this.props.streamStore.options,
      (change) => {
        if (change.type === "update") { this.updateOptions(change.name, change.newValue); }
      },
    );

    this.coordText.x = 0;
    this.coordText.y = 0;
    let moveHandler = (e: any) => {
      let pos = e.data.getLocalPosition(this.mapContainer);
      this.setOverlay(this.hoverName || '', pos.x, pos.y);
    };
    this.app.stage.interactive = true;
    this.app.stage.on("pointermove", moveHandler);

    this.app.stage.addChild(this.coordText);
  }

  resize = () => {
    if (!this.app || !this.viewport) { return; }
    const parent = this.app.view.parentNode as HTMLElement;
    this.app.renderer.resize(parent.clientWidth, parent.clientHeight-4);
    this.viewport.resize(this.app.screen.width, this.app.screen.height);
  }

  setOverlay = (name: string, posx: number, posy: number) => {
    let prefix = '';
    if (name) {
      prefix = `${name} `
    }
    this.coordText.text = `${prefix}(${posx}, ${posy})`;
  }

  handleEntityChange = (change: IMapDidChange<number, Entity>) => {
    if (change.type === "add" || change.type === "update") {
      this.addEntity(change.name, change.newValue);
    } else if (change.type === "delete") {
      this.removeEntity(change.name);
    }
  }

  addEntity = (key: number, entity: Entity) => {
    if (!this.app) { return; }
    if (key in this.entitySprites) {
      this.removeEntity(key);
    }
    let sprite = this.entitySprites[key] = new MapEntity(
      entity,
      () => this.updateTelegraph(key, entity),
      this.props.streamStore.options,
    );
    sprite.on("pointerover", (e: any) => {
      this.hoverName = e.currentTarget.baseEntity.realName;
    });
    sprite.on("pointerout", (e: any) => {
      if (this.hoverName === e.currentTarget.baseEntity.realName) {
        this.hoverName = '';
      }
    });
    sprite.on("click", (e: any) => {
      this.props.streamStore.setSelectedEntityID(e.currentTarget.baseEntity.id);
    });
    this.entityContainer.addChild(sprite);
  }

  removeEntity = (key: number) => {
    this.removeTelegraph(key);
    if (key in this.entitySprites) {
      let sprite = this.entitySprites[key];
      this.entityContainer.removeChild(sprite);
      sprite.dispose();
      delete this.entitySprites[key];
    }
  }

  removeTelegraph = (key: number) => {
    if (key in this.telegraphSprites) {
      let telegraph = this.telegraphSprites[key];
      this.telegraphsContainer.removeChild(telegraph);
      telegraph.dispose();
      delete this.telegraphSprites[key];
    }
  }

  updateTelegraph = (key: number, entity: Entity) => {
    if (!this.app) { return; }

    this.removeTelegraph(key);

    let sprite = new MapTelegraph(entity, this.app.renderer);
    if (sprite.telegraphTexture) {
      this.telegraphSprites[key] = sprite;
      this.telegraphsContainer.addChild(sprite);
    }
  }

  updateMap = (mapInfo: MapInfo) => {
    if (!this.viewport) { return; }

    if (this.mapSprite) {
      this.mapContainer.removeChild(this.mapSprite);
      this.mapSprite.dispose();
    }
    this.mapSprite = undefined;

    this.mapSprite = new MapBackground(mapInfo, this.props.streamStore.apiURL);

    this.mapContainer.addChild(this.mapSprite);
    let height = this.mapSprite.height;
    let width = this.mapSprite.width;
    this.viewport.worldHeight = height;
    this.viewport.worldWidth = width;
    this.viewport.clampZoom({
      maxWidth: width,
      maxHeight: height,
    });

    let centerX = this.mapSprite.position.x;
    let centerY = this.mapSprite.position.y;
    this.viewport.moveCenter(centerX, centerY);

    let leftClamp = centerX - width/2;
    let rightClamp = centerX + width/2;
    let topClamp = centerY - height/2;
    let bottomClamp = centerY + height/2;
    this.viewport.clamp({
      left: leftClamp,
      top: topClamp,
      right: rightClamp,
      bottom: bottomClamp,
    })
  }

  updateEntitySelection = (oldSelection?: Entity, newSelection?: Entity) => {
    if (!this.viewport) { return; }
    let oldID = (oldSelection && oldSelection.id) || 0;
    let newID = (newSelection && newSelection.id) || 0;
    let oldSprite = this.entitySprites[oldID];
    let curSprite = this.entitySprites[newID];
    this.viewport.plugins.remove('follow');
    if (oldSprite) {
      oldSprite.unselect();
    }
    if (curSprite) {
      if (this.props.streamStore.options.followSelection) {
        this.viewport.follow(curSprite);
      }
      curSprite.select();
    }
  }

  updateOptions = (optionName: string | number | symbol, newValue: boolean) => {
    if (!this.viewport) { return; }
    if (optionName === "followSelection") {
      if (newValue) {
        let sprite = this.entitySprites[this.props.streamStore.selectedEntity!.id];
        if (sprite) {
          this.viewport.follow(sprite);
        }
      } else {
        this.viewport.plugins.remove('follow');
      }
    }
  }

  componentWillUnmount() {
    if (this.entityObserverDispose) { this.entityObserverDispose(); }
    if (this.mapObserverDispose) { this.mapObserverDispose(); }
    if (this.selectedEntityObserverDispose) { this.selectedEntityObserverDispose(); }
    if (this.optionsObserverDispose) { this.optionsObserverDispose(); }

    if (this.app) { this.app.destroy(); }
  }

  render() {
    return (
      <canvas ref={(c) => { if (c) { this._canvas = c; } }} />
    )
  }
}