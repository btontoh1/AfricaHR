import { LegalPageLayout } from './legal-page-layout';

export function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="26 August 2026">
      <p>
        This Privacy Policy explains how Baffour &amp; Egyir Ringlife LTD (&quot;ParotHR&quot;,
        &quot;we&quot;, &quot;us&quot;), a company registered in Ghana with its registered address at 10
        Benin St. GC-000-6098, Ghana, collects, uses, and protects personal data through the ParotHR
        platform.
      </p>
      <p>
        ParotHR is used by businesses (&quot;Customers&quot;) to manage their own employees, candidates,
        and HR records. In most cases, your employer or a business you have applied to is the data
        controller for the personal data processed about you in ParotHR, and we act as the data processor
        on their behalf. If you are a Customer&apos;s employee, job candidate, or contact with a question
        about your personal data, please contact that business directly in the first instance.
      </p>

      <section>
        <h2>1. Information we collect</h2>
        <p>Depending on how ParotHR is used, we process:</p>
        <ul>
          <li>
            <strong className="text-foreground">Account &amp; user data</strong> - name, email, role, and
            login activity for people who use ParotHR.
          </li>
          <li>
            <strong className="text-foreground">Employee &amp; payroll data</strong> - employee profiles,
            employment details, leave and attendance records, performance data, and payroll information
            including the bank account or mobile money account details needed to pay salaries, depending
            on how each employee chooses to be paid.
          </li>
          <li>
            <strong className="text-foreground">Recruitment data</strong> - job applications, resumes, and
            identity documents submitted by candidates through a Customer&apos;s public job listing.
          </li>
          <li>
            <strong className="text-foreground">Customer invoicing data</strong> - where a Customer uses
            ParotHR to invoice its own customers, the business contact details of those customers and the
            invoices generated on the Customer&apos;s behalf.
          </li>
          <li>
            <strong className="text-foreground">Usage &amp; technical data</strong> - log data such as IP
            address, browser information, and activity within the platform, used for security, audit
            trails, and troubleshooting.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. How we use this information</h2>
        <ul>
          <li>to provide and operate the ParotHR platform for the Customer that engaged us;</li>
          <li>to process payroll and disburse payments through our payment partner;</li>
          <li>to send transactional and account-related emails (such as leave approvals or payslips);</li>
          <li>to maintain audit logs of actions taken within the platform for security and compliance;</li>
          <li>to detect, investigate, and prevent fraud, abuse, or unauthorized access;</li>
          <li>to comply with legal obligations.</li>
        </ul>
        <p>We do not sell personal data.</p>
      </section>

      <section>
        <h2>3. Who we share information with</h2>
        <p>
          We share personal data only as needed to operate the service, with the following categories of
          service providers acting as sub-processors:
        </p>
        <ul>
          <li>
            <strong className="text-foreground">Paystack</strong> - to process payroll disbursements and
            payments;
          </li>
          <li>
            <strong className="text-foreground">Twilio SendGrid</strong> - to deliver transactional and
            notification emails;
          </li>
          <li>
            <strong className="text-foreground">Cloud infrastructure and object storage providers</strong>{' '}
            - to host the platform and store uploaded documents (such as resumes, identity documents, and
            company logos) securely.
          </li>
        </ul>
        <p>
          We do not share Customer Data across tenants. Every Customer&apos;s data is isolated at the
          database level and is not accessible to other Customers.
        </p>
      </section>

      <section>
        <h2>4. Data security</h2>
        <p>ParotHR is built with security controls including:</p>
        <ul>
          <li>row-level tenant isolation at the database layer, not just application-level filtering;</li>
          <li>role-based access control, so users only see and act on what their role permits;</li>
          <li>optional multi-factor authentication on every account;</li>
          <li>an audit trail recording sensitive actions taken within the platform.</li>
        </ul>
        <p>
          No system is completely secure, and we cannot guarantee absolute security, but we take reasonable
          technical and organizational measures to protect personal data against unauthorized access, loss,
          or misuse.
        </p>
      </section>

      <section>
        <h2>5. Data retention</h2>
        <p>
          We retain personal data for as long as the Customer&apos;s account remains active, and for a
          reasonable period afterward as required for legal, tax, or statutory record-keeping obligations
          (for example, payroll records), after which it is deleted or anonymized in accordance with our
          data retention practices.
        </p>
      </section>

      <section>
        <h2>6. Your rights</h2>
        <p>
          Depending on applicable data protection law, you may have rights to access, correct, or request
          deletion of your personal data. If your data is held in ParotHR on behalf of an employer or
          business you applied to, please contact that business first, as they control the data. Where we
          act as the controller (for example, for our own Customer account holders), you can reach us at{' '}
          <a href="mailto:support@parothr.com" className="text-primary hover:underline">
            support@parothr.com
          </a>{' '}
          to exercise these rights.
        </p>
      </section>

      <section>
        <h2>7. Cookies</h2>
        <p>
          We use essential cookies required for authentication and session management. We do not use
          cookies for third-party advertising.
        </p>
      </section>

      <section>
        <h2>8. International data transfers</h2>
        <p>
          Where personal data is processed or stored outside your country, we take steps to ensure it
          continues to receive an appropriate level of protection, including through contractual
          safeguards with our service providers.
        </p>
      </section>

      <section>
        <h2>9. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes will be communicated
          through the platform or by email before they take effect.
        </p>
      </section>

      <section>
        <h2>10. Contact us</h2>
        <p>
          Questions about this Privacy Policy can be sent to{' '}
          <a href="mailto:support@parothr.com" className="text-primary hover:underline">
            support@parothr.com
          </a>{' '}
          or by post to Baffour &amp; Egyir Ringlife LTD, 10 Benin St. GC-000-6098, Ghana.
        </p>
      </section>
    </LegalPageLayout>
  );
}
