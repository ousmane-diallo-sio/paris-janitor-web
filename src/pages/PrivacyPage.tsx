import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrivacyPage() {
  const handleGoBack = () => {
    window.history.back()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleGoBack}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-primary">Privacy Policy</h1>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              At Paris Janitor (PJ) we take the protection of your personal data seriously.
              This privacy policy explains what data we collect, how we use and store it,
              and the choices you have when using our web application for managing
              properties, bookings and service requests.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By using Paris Janitor, you agree to the practices described in this privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Collection</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect the information necessary to provide and improve the Paris
              Janitor service (account details, booking/service information, and
              payment-related records). We also collect technical data to operate
              and secure the platform. We retain only the data needed for these
              purposes and to meet legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Usage</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use your personal data to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Operate and maintain the Paris Janitor platform (properties, services, bookings)</li>
              <li>Process payments and subscriptions</li>
              <li>Manage service requests, assign providers and track interventions</li>
              <li>Communicate with you about your account, bookings and service requests</li>
              <li>Provide receipts, invoices and financial summaries</li>
              <li>Improve our services and develop new features</li>
              <li>Ensure platform security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our data retention policies are designed to meet legal obligations and to support
              the operation of the platform. We retain personal data only as long as necessary
              for the purposes described in this policy or as required by law.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may request deletion of your personal data. Deleting an account may remove
              access to services and historical records. In some cases (for example, tax or
              accounting obligations) we may retain certain records for a longer, legally
              required period.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Payment and billing information processed via Stripe is retained according to
              Stripe's policies and to comply with accounting requirements.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We also store property images and documents to facilitate property management.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not sell, trade or rent your personal data to third parties. We may share
              your information in limited circumstances, for example:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>With your explicit consent (for example when sharing with third-party service providers)</li>
              <li>To comply with legal obligations or respond to lawful requests from authorities</li>
              <li>With service providers (Stripe, Supabase, email providers) who help us operate the platform</li>
              <li>In connection with a merger, acquisition or sale of assets, subject to confidentiality protections</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational security measures 
              to protect your personal data against unauthorized access, alteration, 
              disclosure or destruction. However, no method of transmission over the Internet 
              or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              In accordance with GDPR, you have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Right of access:</strong> obtain a copy of your personal data</li>
              <li><strong>Right of rectification:</strong> correct inaccurate data</li>
              <li><strong>Right to erasure:</strong> request deletion of your data</li>
              <li><strong>Right to portability:</strong> receive your data in a structured format</li>
              <li><strong>Right to object:</strong> object to the processing of your data</li>
              <li><strong>Right to restriction:</strong> restrict the processing of your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Third-party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our application may contain links to third-party websites or use 
              third-party services (such as Google for authentication). We are not 
              responsible for the privacy practices of these third parties. We encourage 
              you to read their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have any questions about this privacy policy or wish to exercise your rights,
              please contact Paris Janitor at:
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-muted-foreground">
                <strong>Email:</strong> aladdine.dev@gmail.com<br />
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPage
