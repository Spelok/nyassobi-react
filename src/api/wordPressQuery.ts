import { ApolloClient, InMemoryCache, gql, HttpLink } from "@apollo/client";

const defaultEndpoint = "http://react-nyassobi.local/graphql";
const graphQLEndpoint = import.meta.env.VITE_WORDPRESS_GRAPHQL_URL ?? defaultEndpoint;

const client = new ApolloClient({
  link: new HttpLink({ uri: graphQLEndpoint }),
  cache: new InMemoryCache(),
});

interface GqlParams<TVariables extends Record<string, unknown> = Record<string, unknown>> {
  query: string;
  variables?: TVariables;
}

export async function wpquery<TData = unknown, TVariables extends Record<string, unknown> = Record<string, unknown>>({
  query,
  variables = {} as TVariables,
}: GqlParams<TVariables>): Promise<TData> {
  try {
    const { data } = await client.query<TData, TVariables>({
      query: gql`${query}`,
      variables,
      fetchPolicy: "no-cache",
    });

    if (data === undefined || data === null) {
      throw new Error("WordPress GraphQL returned an empty payload.");
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export default client;
