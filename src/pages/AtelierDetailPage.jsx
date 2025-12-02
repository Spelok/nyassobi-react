import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { wordpressBaseUrl } from "../api/wordPressQuery";
import Footer from "../Footer";
import TitleNyasso from "../TitleNyasso";
import Loader from "../components/Loader";
import { useAtelier } from "../hooks/useAteliers";
import { useNyassobiSettings } from "../hooks/useNyassobiSettings";

import newsStyles from "./BlogIndex.module.scss";
import wpStyles from "./WordPressPage.module.scss";
import styles from "./AteliersPage.module.scss";

const isYouTubeUrl = (url = "") => /youtu\.be\/|youtube\.com/i.test(url);

const toYouTubeEmbed = (url = "") => {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${videoId}`;
    }

    const videoId = parsed.searchParams.get("v");
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return url;
  } catch {
    return url;
  }
};

const formatDate = (value) => {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

function AtelierDetailPage() {
  const { slug } = useParams();
  const { item: atelier, loading, error } = useAtelier(slug);
  const { settings } = useNyassobiSettings();
  const loginUrl = wordpressBaseUrl ? `${wordpressBaseUrl}/wp-login.php` : null;

  const isPaid = useMemo(
    () => atelier?.atelierTypes.some((type) => type.slug === "payant") ?? false,
    [atelier],
  );
  const hasUnlockedMedia = useMemo(
    () => Boolean(atelier?.attachmentUrl || atelier?.videoUrl),
    [atelier?.attachmentUrl, atelier?.videoUrl],
  );
  const showLockedNotice = isPaid && !hasUnlockedMedia;

  if (loading) {
    return <Loader label="Chargement de l'atelier..." />;
  }

  if (error || !atelier) {
    const status = error?.message === "Atelier introuvable." || !atelier ? 404 : 500;
    const statusText = status === 404 ? "Atelier introuvable" : "Erreur de chargement de l'atelier";
    const routedError = Object.assign(error ?? new Error("Atelier introuvable."), {
      status,
      statusText,
    });

    throw routedError;
  }

  const publicationDate = formatDate(atelier.date);
  const htmlContent = showLockedNotice
    ? atelier.excerpt || atelier.content
    : atelier.content || atelier.excerpt;

  return (
    <>
      <div className={wpStyles.pageViewport}>
        <article className={wpStyles.articleCard}>
          <header className={wpStyles.articleHeader}>
            <TitleNyasso title={atelier.title} />
            <div className={newsStyles.metaRow}>
              {publicationDate ? (
                <p className={styles.metaDate}>Mis en ligne le {publicationDate}</p>
              ) : null}
              {atelier.atelierTypes.length > 0 ? (
                <div className={newsStyles.tagList}>
                  {atelier.atelierTypes.map((type) => (
                    <span
                      key={`${atelier.id}-${type.slug}`}
                      className={`${newsStyles.tag} ${
                        type.slug === "payant" ? styles.tagPaid : ""
                      }`.trim()}
                    >
                      {type.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </header>

          {showLockedNotice ? (
            <div className={styles.lockedNotice}>
              <p className={styles.lockedTitle}>Contenu réservé aux adhérents</p>
              <p className={styles.lockedText}>
                Connectez-vous ou adhérez pour consulter l'intégralité de cet atelier.
              </p>
              <div className={styles.lockedActions}>
                {loginUrl ? (
                  <a
                    className={`${styles.actionButton} ${styles.actionGhost}`.trim()}
                    href={loginUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Se connecter
                  </a>
                ) : null}
                <a
                  className={`${styles.actionButton} ${styles.actionPrimary}`.trim()}
                  href={settings.signupFormUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Adhérer à Nyassobi
                </a>
              </div>
            </div>
          ) : null}

          {htmlContent ? (
            <div className={`${wpStyles.articleContent} ${styles.detailContent}`.trim()}>
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          ) : null}

          {hasUnlockedMedia ? (
            <div className={styles.detailResourceBlock}>
              {atelier.attachmentUrl ? (
                <a
                  className={styles.resourceLink}
                  href={atelier.attachmentUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <span aria-hidden="true">📄</span>
                  <div>
                    <p className={styles.resourceTitle}>Télécharger le support</p>
                    <small>PDF / PPT / ressources fournies</small>
                  </div>
                </a>
              ) : null}
              {atelier.videoUrl ? (
                isYouTubeUrl(atelier.videoUrl) ? (
                  <div className={styles.videoWrapper}>
                    <iframe
                      src={toYouTubeEmbed(atelier.videoUrl)}
                      title={`Vidéo ${atelier.title}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a
                    className={styles.resourceLink}
                    href={atelier.videoUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <span aria-hidden="true">🎬</span>
                    <div>
                      <p className={styles.resourceTitle}>Voir la vidéo</p>
                      <small>Ouvrir le lien fourni</small>
                    </div>
                  </a>
                )
              ) : null}
            </div>
          ) : null}

          <div className={styles.detailActions}>
            <Link to="/ateliers" className={styles.backLink}>
              ← Retour aux ateliers
            </Link>
          </div>
        </article>
      </div>
      <Footer />
    </>
  );
}

export default AtelierDetailPage;
