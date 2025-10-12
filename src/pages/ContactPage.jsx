import { useCallback, useMemo, useState } from "react";
import FooterSocialWidget from "../components/FooterSocialWidget";
import styles from "./ContactPage.module.scss";
import layoutStyles from "./HomePage.module.scss";
import TitleNyasso from "../TitleNyasso";

const CONTACT_EMAIL = "nyassobi.association@gmail.com";

const initialFormState = {
  fullname: "",
  email: "",
  subject: "",
  message: "",
};

function ContactPage() {
  const [formValues, setFormValues] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: null, message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }, []);

  const validate = useCallback((values) => {
    const nextErrors = {};

    if (!values.fullname.trim()) {
      nextErrors.fullname = "Merci d'indiquer votre nom.";
    }

    if (!values.email.trim()) {
      nextErrors.email = "Merci d'indiquer votre adresse e-mail.";
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i.test(values.email.trim())) {
      nextErrors.email = "Cette adresse e-mail ne semble pas valide.";
    }

    if (!values.subject.trim()) {
      nextErrors.subject = "Merci d'indiquer l'objet de votre message.";
    }

    if (!values.message.trim()) {
      nextErrors.message = "Votre message est vide.";
    }

    return nextErrors;
  }, []);

  const mailtoHref = useMemo(() => {
    const params = new URLSearchParams({
      subject: formValues.subject || "Contact Nyassobi",
      body: [`Nom: ${formValues.fullname}`, `E-mail: ${formValues.email}`, "", formValues.message].join("\n"),
    });

    return `mailto:${CONTACT_EMAIL}?${params.toString()}`;
  }, [formValues]);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      setStatus({ type: null, message: "" });

      const validationErrors = validate(formValues);

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setStatus({
          type: "error",
          message: "Le formulaire est incomplet. Merci de vérifier les informations.",
        });
        return;
      }

      setSubmitting(true);

      // Fallback mailto redirection
      window.location.href = mailtoHref;

      setStatus({
        type: "success",
        message: "Merci ! Votre client mail va s'ouvrir pour finaliser l'envoi.",
      });

      setSubmitting(false);
    },
    [formValues, mailtoHref, validate],
  );

  return (
    <div className={layoutStyles.mainContent}>
      <div className={layoutStyles.mainContent}>
        <div className={layoutStyles.homePage}>
          <div className={styles.contactPage}>
            <section className={styles.contactIntro}>
              <TitleNyasso title="Contact"/>
              <p>
                Une question, une proposition de collaboration, ou simplement envie de nous laisser un mot ?
                Utilisez le formulaire ci-dessous ou contactez-nous directement via nos réseaux.
              </p>
            </section>

            <section className={styles.contactContent}>
              <form className={styles.contactForm} onSubmit={handleSubmit} noValidate>
                <div className={styles.formField}>
                  <label htmlFor="fullname" className={styles.label}>
                    Nom et prénom
                  </label>
                  <input
                    id="fullname"
                    name="fullname"
                    type="text"
                    className={styles.input}
                    value={formValues.fullname}
                    onChange={handleChange}
                    placeholder="Nyasso Bichon"
                    autoComplete="name"
                  />
                  {errors.fullname ? <span className={styles.error}>{errors.fullname}</span> : null}
                </div>

                <div className={styles.formField}>
                  <label htmlFor="email" className={styles.label}>
                    Adresse e-mail
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={styles.input}
                    value={formValues.email}
                    onChange={handleChange}
                    placeholder="vous@example.com"
                    autoComplete="email"
                    required
                  />
                  {errors.email ? <span className={styles.error}>{errors.email}</span> : null}
                </div>

                <div className={styles.formField}>
                  <label htmlFor="subject" className={styles.label}>
                    Objet
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    className={styles.input}
                    value={formValues.subject}
                    onChange={handleChange}
                    placeholder="Une demande, une proposition..."
                  />
                  {errors.subject ? <span className={styles.error}>{errors.subject}</span> : null}
                </div>

                <div className={styles.formField}>
                  <label htmlFor="message" className={styles.label}>
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    className={styles.textarea}
                    value={formValues.message}
                    onChange={handleChange}
                    placeholder="Donnez-nous le maximum de détails, Nyasso adore ça !"
                    rows={6}
                  />
                  {errors.message ? <span className={styles.error}>{errors.message}</span> : null}
                </div>

                <button type="submit" className={styles.submitButton} disabled={submitting}>
                  Envoyer
                </button>

                {status.message ? (
                  <p
                    className={`${styles.statusMessage} ${
                      status.type === "success" ? styles.statusSuccess : styles.statusError
                    }`}
                  >
                    {status.message}
                  </p>
                ) : null}
              </form>

              <aside className={styles.socialCard}>
                <h2>Retrouvez Nyassobi</h2>
                <p>
                  Nous partageons toutes nos actualités en ligne. Suivez-nous pour ne rien manquer ou envoyez-nous un message privé.
                </p>
                <FooterSocialWidget />
                <p>
                  E-mail direct :{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#ED5E24", fontWeight: 600 }}>
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </aside>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
