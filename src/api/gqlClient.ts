import gql from './gql';

import { ApolloLink, execute, makePromise, GraphQLRequest } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { onError } from "apollo-link-error";

const errHandlerLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.map(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  if (networkError) console.log(`[Network error]: ${networkError}`);
});

const executeOperation = (httpLink: ApolloLink, operation: GraphQLRequest) => {
  // Funnel errors into a single promise rejection
  return new Promise<{ [key: string]: any }>((resolve, reject) => {
    makePromise(execute(httpLink, operation))
      .then((result) => {
        if (result.data) {
          resolve(result.data);
        } else {
          reject(result.errors);
        }
      })
      .catch((error) => reject(error));
  })
};

export default class GQLClient {
  private httpLink: ApolloLink;
  private wsLink: ApolloLink;

  constructor(apiURL: string, apiToken?: string) {
    let httpOpts = (apiToken) ? {
      headers: {
        Authorization: apiToken,
      }
    } : {};
    let wsConnectionParams = (apiToken) ? () => ({
      authorization: apiToken,
    }) : undefined;

    this.httpLink = ApolloLink.from([
      errHandlerLink,
      new HttpLink({ uri: apiURL, ...httpOpts }),
    ]);
    this.wsLink = ApolloLink.from([
      errHandlerLink,
      new WebSocketLink({
        uri: apiURL.replace('http://', 'ws://'),
        options: {
          reconnect: true,
          connectionParams: wsConnectionParams,
        },
      }),
    ]);
  }

  public listStreams = async () => {
    const data = await executeOperation(
      this.httpLink, { query: gql.listStreamsQuery },
    );
    return data.streams;
  }

  public getStream = async (streamID: number) => {
    const variables = { streamID };
    const data = await executeOperation(
      this.httpLink, { query: gql.streamQuery, variables },
    )
    return data.stream;
  }

  public subscribeToStreamEvents = (
    streamID: number, handleStreamEvent: (type: string, data: any) => void
  ) =>
    execute(this.wsLink, { query: gql.streamSubscription })
      .subscribe({
        next: ( subscriptionData ) => {
          if (!subscriptionData.data) { return; }
          let streamEvent = subscriptionData.data.streamEvent;
          if (streamEvent.streamID !== streamID) { return; }
          let { __typename, ...eventData } = streamEvent.type;
          handleStreamEvent(__typename, eventData);
        },
      });

  public subscribeToEntityEvents = (
    streamID: number, handleEntityEvent: (entityID: number, type: string, data: any) => void
  ) =>
    execute(this.wsLink, { query: gql.entitySubscription })
      .subscribe({
        next: ( subscriptionData ) => {
          if (!subscriptionData.data) { return; }
          let entityEvent = subscriptionData.data.entityEvent;
          if (entityEvent.streamID !== streamID) { return; }

          let { entityID } = entityEvent;
          let { __typename, ...eventData } = entityEvent.type;
          handleEntityEvent(entityID, __typename, eventData);
        },
      });
}