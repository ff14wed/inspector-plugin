import gql from 'graphql-tag';

export default new class {
  classJobFragment = gql`
    fragment classJob on ClassJob {
      id
      name
      abbreviation
    }
  `;

  resourcesFragment = gql`
    fragment resources on Resources {
      hp
      mp
      tp
      maxHP
      maxMP
      lastTick
    }
  `;

  locationFragment = gql`
    fragment location on Location {
      x
      y
      z
      orientation
      lastUpdated
    }
  `;

  actionFragment = gql`
    fragment action on Action {
      id
      name
      targetID
      useTime
    }
  `;

  statusFragment = gql`
    fragment status on Status {
      id
      param
      name
      description
      startedTime
      duration
      actorID
      lastTick
    }
  `;

  castingInfoFragment = gql`
    fragment castingInfo on CastingInfo {
      actionID
      actionName
      startTime
      castTime
      targetID
      location {
        ...location
      }

      castType
      effectRange
      xAxisModifier
      omen
    }
  `;

  placeFragment = gql`
    fragment place on Place {
      mapID
      territoryID
      maps {
        key
        id
        SizeFactor
        OffsetX
        OffsetY
        PlaceName
        PlaceNameSub
        TerritoryType
      }
    }
  `;

  enmityFragment = gql`
    fragment enmity on Enmity {
      targetHateRanking {
        actorID
        hate
      }
      nearbyEnemyHate {
        enemyID
        hatePercent
      }
    }
  `;

  entityFragment = gql`
    fragment entity on Entity {
      id
      index
      name
      targetID
      ownerID
      level
      classJob {
        ...classJob
      }
      isNPC
      isEnemy
      isPet
      bNPCInfo {
        nameID
        baseID
        modelID
        name
        size
        error
      }
      resources {
        ...resources
      }
      location {
        ...location
      }
      lastAction {
        ...action
      }
      statuses {
        ...status
      }
      lockonMarker
      castingInfo {
        ...castingInfo
      }
      rawSpawnJSONData
    }
    ${this.classJobFragment}
    ${this.resourcesFragment}
    ${this.locationFragment}
    ${this.actionFragment}
    ${this.statusFragment}
    ${this.castingInfoFragment}
  `;

  streamFragment = gql`
    fragment stream on Stream {
      id
      serverID
      characterID

      place {
        ...place
      }
      enmity {
        ...enmity
      }

      entities {
        ...entity
      }
    }
    ${this.placeFragment}
    ${this.enmityFragment}
    ${this.entityFragment}
  `;

  streamSubscription = gql`
    subscription Streams {
      streamEvent {
        streamID
        type {
          __typename
          ... on UpdateIDs {
            serverID
            characterID
          }
          ... on UpdateMap {
            place {
              ...place
            }
          }
        }
      }
    }
    ${this.placeFragment}
  `;

  entitySubscription = gql`
    subscription Entities {
      entityEvent {
        streamID
        entityID
        type {
          __typename
          ... on AddEntity {
            entity {
              ...entity
            }
          }
          ... on RemoveEntity {
            id
          }
          ... on SetEntities {
            entities {
              ...entity
            }
          }
          ... on UpdateTarget {
            targetID
          }
          ... on UpdateClass {
            classJob {
              ...classJob
            }
          }
          ... on UpdateLastAction {
            action {
              ...action
            }
          }
          ... on UpdateCastingInfo {
            castingInfo {
              ...castingInfo
            }
          }
          ... on UpsertStatus {
            index
            status {
              ...status
            }
          }
          ... on RemoveStatus {
            index
          }
          ... on UpdateLocation {
            location {
              ...location
            }
          }
          ... on UpdateResources {
            resources {
              ...resources
            }
          }
          ... on UpdateLockonMarker {
            lockonMarker
          }
        }
      }
    }
    ${this.entityFragment}
    ${this.actionFragment}
    ${this.castingInfoFragment}
    ${this.statusFragment}
    ${this.locationFragment}
    ${this.resourcesFragment}
    ${this.classJobFragment}
  `;

  versionQuery = gql`
    query Version {
      apiVersion
    }
  `;

  streamQuery = gql`
    query GetStream($streamID: Int!) {
      stream(streamID: $streamID) {
        ...stream
      }
    }
    ${this.streamFragment}
  `;

  listStreamsQuery = gql`
    query AllStreams {
      streams {
        id
      }
    }
  `;

  hookMutation = gql`
    mutation SendHookData($req: StreamRequest!) {
      sendStreamRequest(request: $req)
    }
  `;
}()
