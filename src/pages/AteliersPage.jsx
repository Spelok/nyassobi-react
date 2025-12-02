import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { wordpressBaseUrl } from "../api/wordPressQuery";
import Footer from "../Footer";
import TitleNyasso from "../TitleNyasso";
import Loader from "../components/Loader";
import { useAteliers } from "../hooks/useAteliers";
import { useNyassobiSettings } from "../hooks/useNyassobiSettings";

import layoutStyles from "./HomePage.module.scss";
import newsStyles from "./BlogIndex.module.scss";
import styles from "./AteliersPage.module.scss";

const PAGE_SIZE = 5;

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

function AteliersPage() {
  const { items: ateliers, loading, error } = useAteliers({ first: 50 });
  const { settings } = useNyassobiSettings();
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const loginUrl = wordpressBaseUrl ? `${wordpressBaseUrl}/wp-login.php` : null;

  const allTypes = useMemo(() => {
    const map = new Map();

    ateliers.forEach((atelier) => {
      (atelier.atelierTypes ?? []).forEach((type) => {
        if (type.slug && !map.has(type.slug)) {
          map.set(type.slug, {
            slug: type.slug,
            name: type.name || type.slug,
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "fr-FR"));
  }, [ateliers]);

  const toggleType = useCallback((slug) => {
    setSelectedTypes((current) => {
      if (current.includes(slug)) {
        return current.filter((item) => item !== slug);
      }
      return [...current, slug];
    });
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedTypes([]);
    setCurrentPage(1);
  }, []);

  const filteredAteliers = useMemo(() => {
    if (selectedTypes.length === 0) {
      return ateliers;
    }

    return ateliers.filter((atelier) =>
      selectedTypes.every((slug) => atelier.atelierTypes.some((type) => type.slug === slug)),
    );
  }, [ateliers, selectedTypes]);

  const totalPages = Math.max(1, Math.ceil(filteredAteliers.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [ateliers.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedAteliers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAteliers.slice(start, start + PAGE_SIZE);
  }, [filteredAteliers, currentPage]);

  const handlePageChange = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        setCurrentPage(page);
      }
    },
    [totalPages, currentPage],
  );

  if (loading) {
    return <Loader label="Chargement des ateliers..." />;
  }

  if (error) {
    const routedError = Object.assign(new Error("Impossible de récupérer les ateliers."), {
      status: 500,
      statusText: "Erreur de chargement des ateliers",
    });

    throw routedError;
  }

  if (!ateliers.length) {
    const routedError = Object.assign(new Error("Aucun atelier trouvé."), {
      status: 404,
      statusText: "Aucun atelier pour le moment",
    });

    throw routedError;
  }

  return (
    <>
      <div className={layoutStyles.mainContent}>
        <div className={layoutStyles.mainContent}>
          <div className={layoutStyles.homePage}>
            <section>
              <TitleNyasso title="Ateliers" subtitle="Les ateliers Nyassobi" />

              {allTypes.length > 0 ? (
                <div className={newsStyles.filters}>
                  {allTypes.map((type) => {
                    const isSelected = selectedTypes.includes(type.slug);
                    const isDimmed = selectedTypes.length > 0 && !isSelected;

                    const buttonClasses = [
                      newsStyles.filterButton,
                      isSelected ? newsStyles.filterButtonSelected : "",
                      isDimmed ? newsStyles.filterButtonDimmed : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <button
                        key={type.slug}
                        type="button"
                        onClick={() => toggleType(type.slug)}
                        className={buttonClasses}
                      >
                        {type.name}
                      </button>
                    );
                  })}
                  {selectedTypes.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className={`${newsStyles.filterButton} ${newsStyles.filterButtonReset}`}
                    >
                      Réinitialiser
                    </button>
                  ) : null}
                </div>
              ) : null}

              {filteredAteliers.length === 0 ? (
                <p>Aucun atelier ne correspond à ces filtres pour le moment.</p>
              ) : (
                <>
                  <ul className={newsStyles.postList}>
                    {paginatedAteliers.map((atelier, index) => {
                      const detailUrl = `/ateliers/${atelier.slug}`;
                      const publicationDate = formatDate(atelier.date);
                      const isLastItem = index === paginatedAteliers.length - 1;
                      const isPaid = atelier.atelierTypes.some((type) => type.slug === "payant");
                      const hasUnlockedMedia = Boolean(atelier.attachmentUrl || atelier.videoUrl);
                      const showExcerpt = isPaid && !hasUnlockedMedia;
                      const htmlPreview = showExcerpt
                        ? atelier.excerpt || atelier.content
                        : atelier.content || atelier.excerpt;

                      return (
                        <li key={atelier.id} className={newsStyles.postItem}>
                          <div>
                            <h2>
                              <Link to={detailUrl}>
                                <TitleNyasso subtitle={atelier.title} />
                              </Link>
                            </h2>
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
                          </div>

                          {isPaid && !hasUnlockedMedia ? (
                            <div className={styles.lockedNotice}>
                              <p className={styles.lockedTitle}>Contenu réservé aux adhérents</p>
                              <p className={styles.lockedText}>
                                Adhérez à Nyassobi ou connectez-vous pour débloquer la vidéo et les
                                supports de l'atelier.
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

                          {htmlPreview ? (
                            <div
                              className={newsStyles.postExcerpt}
                              dangerouslySetInnerHTML={{ __html: htmlPreview }}
                            />
                          ) : null}

                          {hasUnlockedMedia ? (
                            <div className={styles.resourceGroup}>
                              {atelier.attachmentUrl ? (
                                <a
                                  className={styles.resourceLink}
                                  href={atelier.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                >
                                  <span aria-hidden="true">📄</span>
                                  <span>Télécharger le support</span>
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
                                    <span>Voir la vidéo</span>
                                  </a>
                                )
                              ) : null}
                            </div>
                          ) : null}

                          <Link to={detailUrl} className={newsStyles.readMore}>
                            Découvrir l'atelier →
                          </Link>
                          {!isLastItem ? <div className={newsStyles.divider} aria-hidden="true" /> : null}
                        </li>
                      );
                    })}
                  </ul>

                  {totalPages > 1 ? (
                    <div className={newsStyles.pagination}>
                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`${newsStyles.paginationButton} ${
                          currentPage === 1 ? newsStyles.paginationButtonDisabled : ""
                        }`.trim()}
                      >
                        Précédent
                      </button>
                      {Array.from({ length: totalPages }).map((_, index) => {
                        const pageNumber = index + 1;
                        const isActive = pageNumber === currentPage;

                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() => handlePageChange(pageNumber)}
                            className={`${newsStyles.paginationButton} ${
                              isActive ? newsStyles.paginationButtonActive : ""
                            }`.trim()}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`${newsStyles.paginationButton} ${
                          currentPage === totalPages ? newsStyles.paginationButtonDisabled : ""
                        }`.trim()}
                      >
                        Suivant
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AteliersPage;
