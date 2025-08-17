export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-gold">Privacy Policy</h1>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gold">Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account, make a
                reservation, or contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gold">How We Use Your Information</h2>
              <p>
                We use the information we collect to provide, maintain, and improve our services, process transactions,
                and communicate with you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gold">Information Sharing</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal information to third parties without your
                consent, except as described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gold">Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at our restaurant.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
