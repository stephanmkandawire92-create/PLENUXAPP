import Link from 'next/link';
import styles from './terms.module.css';

export default function TermsPage() {
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Plenux Terms & Privacy Update</h1>
      <p className={styles.meta}>Last Updated: July 16, 2026</p>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Highlights of the Update</h2>
        <h3 className={styles.subtitle}>Updated Terms of Use</h3>
        <ul className={styles.list}>
          <li>
            <strong>Eligibility</strong>
            <p>
              You must be at least <strong>13 years old</strong>, or the minimum
              age required by the laws of your country, to use Plenux.
            </p>
          </li>
          <li>
            <strong>Your Content</strong>
            <p>
              You keep ownership of the photos, videos, messages, posts, and
              other content you create or that your AI tools generate for you.
              By posting content on Plenux, you give us permission to host,
              process, display, and distribute it only as needed to operate,
              improve, and promote the platform.
            </p>
          </li>
          <li>
            <strong>AI Features</strong>
            <p>
              If you use AI assistants, AI creators, or automated tools within
              Plenux, you are responsible for how they are configured and the
              content they generate. AI-generated content must follow our
              Community Guidelines.
            </p>
          </li>
          <li>
            <strong>Community Standards</strong>
            <p>
              Plenux is committed to providing a safe and respectful
              environment. Content involving harassment, hate speech, scams,
              violence, illegal activity, impersonation, child exploitation,
              malware, or other harmful material is prohibited and may result
              in content removal or account suspension.
            </p>
          </li>
          <li>
            <strong>Account Security</strong>
            <p>
              You are responsible for keeping your login credentials secure and
              for all activity that occurs under your account.
            </p>
          </li>
          <li>
            <strong>Platform Improvements</strong>
            <p>
              We may add, update, or remove features to improve Plenux. Some
              features may be available only in selected regions or subscription
              plans.
            </p>
          </li>
          <li>
            <strong>Dispute Resolution</strong>
            <p>
              Any legal disputes will be handled according to the applicable
              laws and courts of the country where Plenux is registered, unless
              local consumer protection laws require otherwise.
            </p>
          </li>
        </ul>
        <h3 className={styles.subtitle}>Updated Privacy Policy</h3>
        <ul className={styles.list}>
          <li>
            <strong>Information We Collect</strong>
            <p>
              We may collect:
            </p>
            <ul className={styles.nestedList}>
              <li>Account and profile information</li>
              <li>Posts, comments, messages, and uploads</li>
              <li>AI interaction history</li>
              <li>Device and browser information</li>
              <li>Usage analytics</li>
              <li>Security and diagnostic information</li>
            </ul>
          </li>
          <li>
            <strong>How We Use Your Information</strong>
            <p>
              Your information helps us:
            </p>
            <ul className={styles.nestedList}>
              <li>Operate and improve Plenux</li>
              <li>Personalize your experience</li>
              <li>Enhance AI-powered features</li>
              <li>Protect users from spam, fraud, and abuse</li>
              <li>Provide customer support</li>
              <li>Comply with legal obligations</li>
            </ul>
          </li>
          <li>
            <strong>Your Privacy Choices</strong>
            <p>
              You can:
            </p>
            <ul className={styles.nestedList}>
              <li>Access your personal information</li>
              <li>Update your profile</li>
              <li>Download your data (where available)</li>
              <li>Delete your account</li>
              <li>Manage notification and privacy settings</li>
            </ul>
          </li>
          <li>
            <strong>Security</strong>
            <p>
              We use industry-standard technical and organizational safeguards
              to protect your information. While we work hard to keep your data
              secure, no online service can guarantee absolute security.
            </p>
          </li>
          <li>
            <strong>International Users</strong>
            <p>
              Where required, Plenux complies with applicable privacy laws and
              respects users' rights regarding access, correction, deletion, and
              data portability.
            </p>
          </li>
        </ul>
        <div className={styles.acknowledgement}>
          <p>
            By continuing to use <strong>Plenux</strong>, you acknowledge these
            updates and agree to the latest <strong>Terms of Use</strong> and
            <strong>Privacy Policy</strong>.
          </p>
        </div>
      </section>
      <div className={styles.actions}>
        <Link href="/" className={styles.button}>
          Continue to Plenux
        </Link>
      </div>
    </main>
  );
}