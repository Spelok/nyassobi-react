import { useEffect, useMemo, useState } from "react";
import { wpquery } from "../api/wordPressQuery";

const ATELIERS_QUERY = `
  query GetAteliers($first: Int) {
    ateliers(first: $first, where: { orderby: { field: DATE, order: DESC } }) {
      nodes {
        id
        slug
        title
        content
        excerpt
        date
        modified
        attachmentUrl
        videoUrl
        atelierTypes {
          nodes {
            slug
            name
          }
        }
      }
    }
  }
`;

const ATELIER_BY_SLUG_QUERY = `
  query GetAtelier($slug: ID!) {
    atelier(id: $slug, idType: SLUG) {
      id
      slug
      title
      content
      excerpt
      date
      modified
      attachmentUrl
      videoUrl
      atelierTypes {
        nodes {
          slug
          name
        }
      }
    }
  }
`;

type RawAtelier = {
  id: string;
  slug: string;
  title?: string | null;
  content?: string | null;
  excerpt?: string | null;
  date?: string | null;
  modified?: string | null;
  attachmentUrl?: string | null;
  videoUrl?: string | null;
  atelierTypes?: {
    nodes?: Array<{
      slug?: string | null;
      name?: string | null;
    } | null>;
  } | null;
};

export type Atelier = {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  date: string | null;
  modified: string | null;
  attachmentUrl: string | null;
  videoUrl: string | null;
  atelierTypes: Array<{
    slug: string;
    name: string;
  }>;
};

type UseAteliersState = {
  loading: boolean;
  error: Error | null;
  items: Atelier[];
};

type UseAtelierState = {
  loading: boolean;
  error: Error | null;
  item: Atelier | null;
};

type UseAteliersOptions = {
  first?: number;
};

const normaliseAtelier = (raw: RawAtelier): Atelier => ({
  id: raw.id,
  slug: raw.slug,
  title: raw.title ?? "",
  content: raw.content ?? "",
  excerpt: raw.excerpt ?? "",
  date: raw.date ?? null,
  modified: raw.modified ?? null,
  attachmentUrl: raw.attachmentUrl ?? null,
  videoUrl: raw.videoUrl ?? null,
  atelierTypes:
    raw.atelierTypes?.nodes
      ?.filter((node): node is { slug?: string | null; name?: string | null } => Boolean(node?.slug))
      .map((node) => ({
        slug: node.slug ?? "",
        name: node.name ?? node.slug ?? "",
      })) ?? [],
});

export const useAteliers = (options: UseAteliersOptions = {}): UseAteliersState => {
  const [state, setState] = useState<UseAteliersState>({
    loading: true,
    error: null,
    items: [],
  });

  const variables = useMemo(() => {
    if (typeof options.first === "number") {
      return { first: options.first };
    }
    return {};
  }, [options.first]);

  const variablesKey = useMemo(() => JSON.stringify(variables), [variables]);

  useEffect(() => {
    let isMounted = true;

    async function fetchAteliers() {
      setState((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }));

      try {
        const data = await wpquery<Record<"ateliers", { nodes?: RawAtelier[] }> | null>({
          query: ATELIERS_QUERY,
          variables,
        });

        if (!isMounted) {
          return;
        }

        const rawNodes = data?.ateliers?.nodes ?? [];
        const items = rawNodes.map(normaliseAtelier);

        setState({
          loading: false,
          error: null,
          items,
        });
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setState({
          loading: false,
          error: err instanceof Error ? err : new Error("Erreur inattendue."),
          items: [],
        });
      }
    }

    fetchAteliers();

    return () => {
      isMounted = false;
    };
  }, [variablesKey]);

  return state;
};

export const useAtelier = (slug: string | undefined): UseAtelierState => {
  const [state, setState] = useState<UseAtelierState>({
    loading: true,
    error: null,
    item: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchAtelier() {
      if (!slug) {
        setState({
          loading: false,
          error: new Error("Atelier introuvable."),
          item: null,
        });
        return;
      }

      setState((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }));

      try {
        const data = await wpquery<Record<"atelier", RawAtelier | null>>({
          query: ATELIER_BY_SLUG_QUERY,
          variables: { slug },
        });

        if (!isMounted) {
          return;
        }

        const rawAtelier = data?.atelier ?? null;

        if (!rawAtelier) {
          setState({
            loading: false,
            error: new Error("Atelier introuvable."),
            item: null,
          });
          return;
        }

        setState({
          loading: false,
          error: null,
          item: normaliseAtelier(rawAtelier),
        });
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setState({
          loading: false,
          error: err instanceof Error ? err : new Error("Erreur inattendue."),
          item: null,
        });
      }
    }

    fetchAtelier();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return state;
};

export { ATELIERS_QUERY, ATELIER_BY_SLUG_QUERY };
