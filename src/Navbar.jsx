import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useMenu } from "./hooks/createWPMenu";
import styles from "./Navbar.module.scss";

function Navbar() {
  const { menuItems, loading, error } = useMenu();
  const topLevelItems = useMemo(() => menuItems ?? [], [menuItems]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  const toggleMenu = () => {
    setIsMenuOpen((previous) => !previous);
  };

  const renderMenuLink = (item, keySuffix = "", onNavigate) => {
    const isExternal = item.path.startsWith("http") || item.path.startsWith("mailto:");

    const handleClick = () => {
      if (onNavigate) {
        onNavigate();
      }
    };

    if (isExternal) {
      const isMailto = item.path.startsWith("mailto:");

      return (
        <div key={`${item.id}${keySuffix}`} className={styles.item}>
          <a
            href={item.path}
            target={isMailto ? undefined : "_blank"}
            rel={isMailto ? undefined : "noreferrer noopener"}
            onClick={handleClick}
          >
            {item.label}
          </a>
        </div>
      );
    }

    return (
      <NavLink
        key={`${item.id}${keySuffix}`}
        className={(navData) => (navData.isActive ? styles.active : "")}
        to={item.path}
        onClick={handleClick}
      >
        <div className={styles.item}>{item.label}</div>
      </NavLink>
    );
  };

  const renderDesktopMenuItem = (item) => {
    if (item.children.length > 0) {
      return (
        <div key={item.id} className={styles.menuDropdown}>
          {renderMenuLink(item, "-parent")}
          <div className={styles.dropdownContent}>
            {item.children.map((child) => renderMenuLink(child, "-child"))}
          </div>
        </div>
      );
    }

    return renderMenuLink(item);
  };

  const renderMobileMenuItem = (item) => (
    <div key={`${item.id}-mobile`} className={styles.menuMobileItem}>
      {renderMenuLink(item, "-mobile", closeMenu)}
      {item.children.length > 0 ? (
        <div className={styles.menuMobileChildren}>
          {item.children.map((child) => renderMenuLink(child, "-mobile-child", closeMenu))}
        </div>
      ) : null}
    </div>
  );

  const interleaveSeparators = (items) => {
    const result = [];

    items.forEach((item, index) => {
      result.push(renderDesktopMenuItem(item));

      if (index < items.length - 1) {
        result.push(
          <div key={`separator-${index}`} className={styles.separator}>
            |
          </div>,
        );
      }
    });

    return result;
  };

  const mobileMenuId = "navbar-mobile-menu";

  return (
    <header className={styles.navContainer}>
      <nav className={styles.nav} aria-label="Navigation principale">
        <div className={styles.menuDesktop}>
          {loading && <div className={styles.item}>Chargement...</div>}
          {error && !loading && <div className={styles.item}>Impossible de charger le menu</div>}
          {!loading && !error && interleaveSeparators(topLevelItems)}
        </div>

        <button
          type="button"
          className={`${styles.menuToggle} ${isMenuOpen ? styles.menuToggleOpen : ""}`}
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-controls={mobileMenuId}
          aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <span className={`${styles.menuToggleLine} ${styles.menuToggleLineTop}`} />
          <span className={`${styles.menuToggleLine} ${styles.menuToggleLineMiddle}`} />
          <span className={`${styles.menuToggleLine} ${styles.menuToggleLineBottom}`} />
        </button>
      </nav>

      <div
        id={mobileMenuId}
        className={`${styles.menuMobilePanel} ${isMenuOpen ? styles.menuMobilePanelOpen : ""}`}
        hidden={!isMenuOpen}
      >
        {loading && <div className={styles.item}>Chargement...</div>}
        {error && !loading && <div className={styles.item}>Impossible de charger le menu</div>}
        {!loading && !error && topLevelItems.map((item) => renderMobileMenuItem(item))}
      </div>
    </header>
  );
}

export default Navbar;
