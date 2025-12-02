import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";

export interface NyassobiSettings {
  contactEmail: string;
  signupFormUrl: string;
  parentalAgreementUrl: string;
  associationStatusUrl: string;
  internalRulesUrl: string;
  introTextNyassobi: string;
}

interface NyassobiSettingsQueryData {
  nyassobiSettings?: {
    contactEmail?: string | null;
    signupFormUrl?: string | null;
    parentalAgreementUrl?: string | null;
    associationStatusUrl?: string | null;
    internalRulesUrl?: string | null;
    introTextNyassobi?: string | null;
  } | null;
}

const GET_NYASSOBI_SETTINGS = gql`
  query GetNyassobiSettings {
    nyassobiSettings {
      contactEmail
      signupFormUrl
      parentalAgreementUrl
      associationStatusUrl
      internalRulesUrl
      introTextNyassobi
    }
  }
`;

const DEFAULT_NYASSOBI_SETTINGS: NyassobiSettings = {
  contactEmail: "nyassobi.association@gmail.com",
  signupFormUrl: "https://framaforms.org/adhesion-a-lassociation-nyassobi-1744015994",
  parentalAgreementUrl: "https://drive.google.com/file/d/1KJ-kZrnKLHoA9AM3qO4qKPcNdBudSwXJ/",
  associationStatusUrl: "https://drive.google.com/file/d/11PtZQckyWmOuyLgU2P0zW-4XhftSlCic/",
  internalRulesUrl: "https://docs.google.com/document/d/1IKJQm1VKrdHKaLktpq2G3O2L9XFkUd2t8zSlVJFrqEQ/",
  introTextNyassobi: "",
};

const toValidSettingValue = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normaliseSettings = (
  rawSettings: NyassobiSettingsQueryData["nyassobiSettings"],
): NyassobiSettings => ({
  contactEmail: toValidSettingValue(rawSettings?.contactEmail) ?? DEFAULT_NYASSOBI_SETTINGS.contactEmail,
  signupFormUrl:
    toValidSettingValue(rawSettings?.signupFormUrl) ?? DEFAULT_NYASSOBI_SETTINGS.signupFormUrl,
  parentalAgreementUrl:
    toValidSettingValue(rawSettings?.parentalAgreementUrl) ??
    DEFAULT_NYASSOBI_SETTINGS.parentalAgreementUrl,
  associationStatusUrl:
    toValidSettingValue(rawSettings?.associationStatusUrl) ??
    DEFAULT_NYASSOBI_SETTINGS.associationStatusUrl,
  internalRulesUrl:
    toValidSettingValue(rawSettings?.internalRulesUrl) ?? DEFAULT_NYASSOBI_SETTINGS.internalRulesUrl,
  introTextNyassobi:
    toValidSettingValue(rawSettings?.introTextNyassobi) ?? DEFAULT_NYASSOBI_SETTINGS.introTextNyassobi,
});

export const format_settings_for_graphql = normaliseSettings;

export interface UseNyassobiSettingsResult {
  settings: NyassobiSettings;
  loading: boolean;
  error: Error | undefined;
}

export const useNyassobiSettings = (): UseNyassobiSettingsResult => {
  const { data, loading, error } = useQuery<NyassobiSettingsQueryData>(GET_NYASSOBI_SETTINGS, {
    fetchPolicy: "cache-first",
  });

  const settings = useMemo(() => normaliseSettings(data?.nyassobiSettings), [data]);

  return {
    settings,
    loading,
    error,
  };
};

export { GET_NYASSOBI_SETTINGS, DEFAULT_NYASSOBI_SETTINGS };
