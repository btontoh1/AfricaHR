import { LegalPageLayout } from './legal-page-layout';

export function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Refund & Cancellation Policy" lastUpdated="26 August 2026">
      <p>
        ParotHR is a software subscription, not a physical product, so this policy explains how billing,
        cancellation, and refunds work rather than delivery of goods. It applies to subscriptions to the
        ParotHR platform provided by Baffour &amp; Egyir Ringlife LTD.
      </p>

      <section>
        <h2>1. Subscription billing</h2>
        <p>
          ParotHR is billed in advance on a recurring basis (monthly or annually, depending on the plan you
          select at signup). Your subscription renews automatically at the end of each billing cycle unless
          you cancel before the renewal date.
        </p>
      </section>

      <section>
        <h2>2. Cancelling your subscription</h2>
        <p>
          You may cancel your subscription at any time by contacting{' '}
          <a href="mailto:support@parothr.com" className="text-primary hover:underline">
            support@parothr.com
          </a>
          , or through your account settings where self-service cancellation is available. Cancellation
          takes effect at the end of your current billing cycle - you retain access to ParotHR until that
          date, and you will not be charged for the following cycle.
        </p>
      </section>

      <section>
        <h2>3. Refunds</h2>
        <p>Because ParotHR provides ongoing access to a live software platform rather than a one-time delivered good, refunds are handled as follows:</p>
        <ul>
          <li>
            <strong className="text-foreground">Billing errors</strong> - if you were charged in error
            (for example, charged twice for the same cycle, or after a cancellation that should have taken
            effect), we will correct the charge and issue a full refund of the erroneous amount.
          </li>
          <li>
            <strong className="text-foreground">Service issues</strong> - if a sustained service outage or
            defect materially prevented you from using ParotHR during a paid period, contact support and we
            will assess the issue and may issue a partial or full refund or service credit at our
            discretion.
          </li>
          <li>
            <strong className="text-foreground">Change of mind</strong> - fees already paid for a current
            billing cycle are otherwise non-refundable, but you will not be charged again once your
            cancellation takes effect.
          </li>
        </ul>
        <p>Approved refunds are returned to the original payment method within a reasonable period, typically within 10 business days.</p>
      </section>

      <section>
        <h2>4. Payroll disbursements</h2>
        <p>
          This policy covers ParotHR&apos;s own subscription fees. It does not cover payroll funds you
          disburse to your employees through ParotHR - those transfers are between you and your employees
          via our payment partner, and any dispute about a specific payroll payment should be raised with
          our support team so we can help trace and resolve it.
        </p>
      </section>

      <section>
        <h2>5. Data after cancellation</h2>
        <p>
          After cancellation, we retain your Customer Data for a reasonable period in case you wish to
          reactivate your account, and thereafter in line with our data retention practices described in
          our{' '}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          . You can request export or earlier deletion of your data by contacting support.
        </p>
      </section>

      <section>
        <h2>6. Contact</h2>
        <p>
          For billing questions, cancellations, or refund requests, contact{' '}
          <a href="mailto:support@parothr.com" className="text-primary hover:underline">
            support@parothr.com
          </a>
          .
        </p>
      </section>
    </LegalPageLayout>
  );
}
