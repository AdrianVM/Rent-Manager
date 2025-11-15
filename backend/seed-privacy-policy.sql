-- Seed initial privacy policy for Rent Manager
-- This creates version 1.0 of the privacy policy

INSERT INTO privacy_policy_versions (
    "Version",
    "ContentHtml",
    "ContentPlainText",
    "EffectiveDate",
    "IsCurrent",
    "RequiresReAcceptance",
    "ChangesSummary",
    "CreatedBy",
    "CreatedAt"
) VALUES (
    '1.0',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Privacy Policy - Rent Manager</title>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p><strong>Effective Date:</strong> November 15, 2025</p>
    <p><strong>Last Updated:</strong> November 15, 2025</p>

    <h2>1. Introduction</h2>
    <p>Welcome to Rent Manager. We are committed to protecting your personal data and respecting your privacy rights. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our property management platform.</p>
    <p>This policy complies with the General Data Protection Regulation (GDPR) and other applicable data protection laws.</p>

    <h2>2. Data Controller</h2>
    <p>Rent Manager operates as the data controller for the personal information we process. If you have any questions about this policy or our data practices, please contact us.</p>

    <h2>3. Information We Collect</h2>

    <h3>3.1 Personal Information You Provide</h3>
    <ul>
        <li><strong>Account Information:</strong> Name, email address, phone number, date of birth, nationality</li>
        <li><strong>Identification:</strong> ID numbers (for identity verification)</li>
        <li><strong>Financial Information:</strong> Payment details, rent amounts, deposit information, transaction history</li>
        <li><strong>Property Information:</strong> Lease agreements, property addresses, rental history</li>
        <li><strong>Communications:</strong> Messages, maintenance requests, support inquiries</li>
        <li><strong>Documents:</strong> Contracts, agreements, uploaded files</li>
    </ul>

    <h3>3.2 Information Collected Automatically</h3>
    <ul>
        <li><strong>Usage Data:</strong> IP address, browser type, device information, access times</li>
        <li><strong>Cookies:</strong> Session identifiers, preferences, analytics data (see our Cookie Policy)</li>
        <li><strong>Log Data:</strong> System logs, error reports, security events</li>
    </ul>

    <h2>4. How We Use Your Information</h2>

    <h3>4.1 Legal Basis for Processing</h3>
    <p>We process your personal data on the following legal bases:</p>
    <ul>
        <li><strong>Contract Performance:</strong> To provide property management services, process payments, and fulfill lease agreements</li>
        <li><strong>Legal Obligation:</strong> To comply with tax laws, financial regulations, and legal retention requirements</li>
        <li><strong>Legitimate Interest:</strong> To improve our services, prevent fraud, and ensure platform security</li>
        <li><strong>Consent:</strong> For marketing communications and optional features (you can withdraw consent at any time)</li>
    </ul>

    <h3>4.2 Specific Uses</h3>
    <ul>
        <li>Managing rental properties and tenant relationships</li>
        <li>Processing rent payments and financial transactions</li>
        <li>Handling maintenance requests and property issues</li>
        <li>Sending important notifications about your tenancy</li>
        <li>Providing customer support</li>
        <li>Detecting and preventing fraud or security issues</li>
        <li>Complying with legal and regulatory requirements</li>
        <li>Analyzing and improving our platform</li>
    </ul>

    <h2>5. Data Sharing and Disclosure</h2>

    <h3>5.1 We Share Your Data With:</h3>
    <ul>
        <li><strong>Property Owners and Tenants:</strong> We share relevant information between property owners and their tenants as necessary for the rental relationship</li>
        <li><strong>Service Providers:</strong> Cloud hosting, payment processors, email services (under strict data processing agreements)</li>
        <li><strong>Legal Authorities:</strong> When required by law, court order, or to protect our legal rights</li>
        <li><strong>Professional Advisors:</strong> Lawyers, accountants, auditors (under confidentiality obligations)</li>
    </ul>

    <h3>5.2 We Do NOT:</h3>
    <ul>
        <li>Sell your personal data to third parties</li>
        <li>Share your data for third-party marketing without your explicit consent</li>
        <li>Transfer data outside the EU/EEA without appropriate safeguards</li>
    </ul>

    <h2>6. Data Retention</h2>

    <h3>6.1 Retention Periods</h3>
    <ul>
        <li><strong>Financial Records:</strong> 7 years (tax and accounting law requirements)</li>
        <li><strong>Lease Agreements:</strong> 7 years after termination (legal requirement)</li>
        <li><strong>Consent Records:</strong> 2 years (GDPR Article 7)</li>
        <li><strong>Cookie Data:</strong> Up to 2 years based on your preferences</li>
        <li><strong>Account Data:</strong> Until you request deletion (subject to legal retention)</li>
        <li><strong>Marketing Data:</strong> Until you withdraw consent</li>
    </ul>

    <h3>6.2 Data Deletion</h3>
    <p>When retention periods expire, we securely delete or anonymize your personal data. Some data must be retained for legal compliance even after you request deletion.</p>

    <h2>7. Your Data Protection Rights (GDPR)</h2>

    <p>Under the GDPR, you have the following rights:</p>

    <h3>7.1 Right of Access (Article 15)</h3>
    <p>You can request a copy of all personal data we hold about you. <a href="/data-requests">Submit an Access Request</a></p>

    <h3>7.2 Right to Rectification (Article 16)</h3>
    <p>You can request correction of inaccurate or incomplete data. <a href="/data-requests">Submit a Rectification Request</a></p>

    <h3>7.3 Right to Erasure (Article 17)</h3>
    <p>You can request deletion of your personal data (subject to legal retention requirements). <a href="/data-requests">Submit a Deletion Request</a></p>

    <h3>7.4 Right to Restriction (Article 18)</h3>
    <p>You can request that we stop processing your data while maintaining it. <a href="/data-requests">Submit a Restriction Request</a></p>

    <h3>7.5 Right to Data Portability (Article 20)</h3>
    <p>You can receive your data in a machine-readable format or transfer it to another service. <a href="/data-requests">Submit a Portability Request</a></p>

    <h3>7.6 Right to Object (Article 21)</h3>
    <p>You can object to processing based on legitimate interests. <a href="/data-requests">Submit an Objection Request</a></p>

    <h3>7.7 Exercise Your Rights</h3>
    <p>To exercise any of these rights, visit our <a href="/data-requests">Data Subject Requests page</a>. We will respond within 30 days as required by GDPR.</p>

    <h2>8. Cookies and Tracking</h2>

    <p>We use cookies and similar technologies to enhance your experience. You can control cookie preferences at any time.</p>

    <h3>8.1 Cookie Categories</h3>
    <ul>
        <li><strong>Strictly Necessary:</strong> Essential for platform functionality (always enabled)</li>
        <li><strong>Functional:</strong> Remember your preferences and settings</li>
        <li><strong>Performance:</strong> Analyze usage to improve our services</li>
        <li><strong>Marketing:</strong> Deliver relevant communications (requires consent)</li>
    </ul>

    <p>For detailed information, see our <a href="/cookie-policy">Cookie Policy</a>.</p>

    <h2>9. Data Security</h2>

    <h3>9.1 Security Measures</h3>
    <ul>
        <li>Encryption in transit (TLS/SSL) and at rest</li>
        <li>Role-based access controls</li>
        <li>Regular security audits and penetration testing</li>
        <li>Secure authentication (password hashing, session management)</li>
        <li>Comprehensive audit logging</li>
        <li>Regular backups and disaster recovery procedures</li>
    </ul>

    <h3>9.2 Your Responsibility</h3>
    <ul>
        <li>Keep your password secure and confidential</li>
        <li>Use strong, unique passwords</li>
        <li>Log out after using shared devices</li>
        <li>Report suspicious activity immediately</li>
    </ul>

    <h2>10. Children''s Privacy</h2>

    <p>Our platform is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us immediately.</p>

    <h2>11. International Data Transfers</h2>

    <p>Your data is primarily processed within the European Economic Area (EEA). If we transfer data outside the EEA, we ensure appropriate safeguards are in place, such as:</p>
    <ul>
        <li>EU Standard Contractual Clauses</li>
        <li>Adequacy decisions by the European Commission</li>
        <li>Binding Corporate Rules</li>
    </ul>

    <h2>12. Automated Decision-Making</h2>

    <p>We do not use automated decision-making or profiling that produces legal effects or significantly affects you without human involvement.</p>

    <h2>13. Changes to This Policy</h2>

    <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. When we make material changes:</p>
    <ul>
        <li>We will update the "Last Updated" date</li>
        <li>We will notify you via email or platform notification</li>
        <li>We may require re-acceptance for significant changes</li>
        <li>Previous versions will be available in your account history</li>
    </ul>

    <h2>14. Your Right to Complain</h2>

    <p>If you believe we have not handled your personal data properly, you have the right to lodge a complaint with your national data protection authority:</p>
    <ul>
        <li><strong>EU Citizens:</strong> Contact your local Data Protection Authority</li>
        <li><strong>UK Citizens:</strong> Information Commissioner''s Office (ICO)</li>
        <li>Find your authority: <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank">EDPB Member List</a></li>
    </ul>

    <h2>15. Contact Us</h2>

    <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
    <ul>
        <li><strong>Email:</strong> privacy@rentmanager.example</li>
        <li><strong>Data Protection Officer:</strong> dpo@rentmanager.example</li>
        <li><strong>Data Subject Requests:</strong> <a href="/data-requests">Submit Online</a></li>
    </ul>

    <h2>16. Definitions</h2>

    <ul>
        <li><strong>Personal Data:</strong> Any information relating to an identified or identifiable person</li>
        <li><strong>Processing:</strong> Any operation performed on personal data (collection, storage, use, disclosure, deletion)</li>
        <li><strong>Data Controller:</strong> The entity determining the purposes and means of processing</li>
        <li><strong>Data Processor:</strong> The entity processing data on behalf of the controller</li>
        <li><strong>Data Subject:</strong> The individual to whom personal data relates</li>
    </ul>

    <hr>

    <p><em>This Privacy Policy is effective as of November 15, 2025 and applies to all users of the Rent Manager platform.</em></p>

</body>
</html>',
    'Privacy Policy - Rent Manager

Effective Date: November 15, 2025
Last Updated: November 15, 2025

1. INTRODUCTION
Welcome to Rent Manager. We are committed to protecting your personal data and respecting your privacy rights. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our property management platform.

2. INFORMATION WE COLLECT
- Account Information: Name, email, phone, date of birth
- Financial Information: Payment details, rent amounts, transactions
- Property Information: Lease agreements, addresses
- Communications: Messages, maintenance requests
- Usage Data: IP address, browser, device information
- Cookies: Session data, preferences, analytics

3. HOW WE USE YOUR INFORMATION
- Managing rental properties and tenant relationships
- Processing payments and financial transactions
- Handling maintenance requests
- Providing customer support
- Legal compliance and fraud prevention

4. YOUR RIGHTS (GDPR)
- Right of Access: Request a copy of your data
- Right to Rectification: Correct inaccurate data
- Right to Erasure: Request deletion of your data
- Right to Portability: Export your data
- Right to Object: Object to certain processing

Visit /data-requests to exercise your rights.

5. DATA RETENTION
- Financial Records: 7 years
- Lease Agreements: 7 years
- Consent Records: 2 years
- Cookie Data: Up to 2 years

6. CONTACT
Email: privacy@rentmanager.example
Data Protection Officer: dpo@rentmanager.example',
    NOW(),
    true,
    false,
    'Initial privacy policy version',
    'system',
    NOW()
)
ON CONFLICT ("Version") DO NOTHING;
