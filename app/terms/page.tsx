export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-gold">Terms of Service</h1>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gold">Acceptance of Terms</h2>
              <p>
                By accessing and using this website, you accept and agree to be bound by the terms and provision of this
                agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gold">Reservations</h2>
              <p>
                Reservations are subject to availability. We reserve the right to cancel or modify reservations as
                necessary.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gold">Orders and Payments</h2>
              <p>
                All orders are subject to acceptance and availability. Payment is required at the time of order
                placement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gold">Contact Information</h2>
              <p>For any questions regarding these terms, please contact us at our restaurant location.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
