import { ApolloClient, InMemoryCache, gql, HttpLink } from "@apollo/client";

const DEFAULT_WORDPRESS_GRAPHQL_ENDPOINT = "http://react-nyassobi.local/graphql";

export const graphQLEndpoint =
  import.meta.env.VITE_WORDPRESS_GRAPHQL_URL ?? DEFAULT_WORDPRESS_GRAPHQL_ENDPOINT;

const deriveWordPressBaseUrl = (endpoint: string): string | null => {
  try {
    const parsed = new URL(endpoint);
    const pathnameWithoutGraphql = parsed.pathname.replace(/\/graphql\/?$/, "/");
    const trimmedPath = pathnameWithoutGraphql.replace(/\/+$/, "");
    const basePath = trimmedPath === "" ? "" : trimmedPath;
    return `${parsed.protocol}//${parsed.host}${basePath}`;
  } catch {
    return null;
  }
};

export const wordpressBaseUrl = deriveWordPressBaseUrl(graphQLEndpoint);

const isBrowser = typeof window !== "undefined";

const shouldSendCredentials = (() => {
  if (!isBrowser || !wordpressBaseUrl) {
    return false;
  }

  try {
    const wpUrl = new URL(wordpressBaseUrl);
    return wpUrl.host === window.location.host;
  } catch {
    return false;
  }
})();

const client = new ApolloClient({
  link: new HttpLink({
    uri: graphQLEndpoint,
    credentials: shouldSendCredentials ? "include" : "omit",
  }),
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
