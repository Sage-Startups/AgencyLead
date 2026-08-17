import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Privacy Policy — AgencyLead Radar',
  description: 'How AgencyLead Radar collects, uses, and protects personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Nav />
      <main className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-500 text-sm mb-8">Last updated: [DATE]</p>

          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 mb-10">
            <p className="text-amber-200 text-sm">
              <strong>Template notice.</strong> This policy is a starting template provided with the
              software. Before operating this site commercially, replace every [BRACKETED] value and
              have the final text reviewed by qualified legal counsel for your jurisdiction.
            </p>
          </div>

          <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-white font-semibold text-lg mb-2">Who we are</h2>
              <p>
                AgencyLead Radar (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is operated by [LEGAL ENTITY NAME],
                [ADDRESS]. For any privacy question, contact us at [CONTACT EMAIL].
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">Information we collect</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Waitlist submissions.</strong> If you join our waitlist we collect the name,
                  email address, and any company name, role, service description, or message you choose
                  to provide.
                </li>
                <li>
                  <strong>Account information.</strong> If you hold an account we store your email
                  address, a securely hashed password, and optional profile details.
                </li>
                <li>
                  <strong>Content you enter.</strong> Business records you add or import into the
                  product, including any notes you write.
                </li>
                <li>
                  <strong>Activity records.</strong> Basic events such as sign-ins, imports, exports,
                  and AI generations, used to operate and troubleshoot the service.
                </li>
              </ul>
              <p className="mt-3">
                We do not knowingly collect information from children, and we do not collect payment
                card details through this site.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">How we use information</h2>
              <p>
                We use the information above to provide and secure the service, to respond to you, and
                to notify waitlist subscribers about availability. We do not sell personal information.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">Service providers</h2>
              <p>
                We rely on third parties to run the service, and information may be processed by them:
                [HOSTING PROVIDER] for hosting, [DATABASE PROVIDER] for data storage, and
                [AI PROVIDER] to generate audit and outreach text when you request it. Each processes
                data under its own terms.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">Retention</h2>
              <p>
                We keep personal information for as long as needed to provide the service or as
                required by law, then delete or anonymize it.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">Your rights</h2>
              <p>
                Depending on where you live, you may have the right to access, correct, delete, or
                export your personal information, or to object to certain processing. California
                residents may have additional rights under the CCPA/CPRA, including the right not to
                be discriminated against for exercising them. To make a request, contact
                [CONTACT EMAIL]. We will verify your request before acting on it.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">Security</h2>
              <p>
                Passwords are stored using one-way hashing, sessions use signed, HTTP-only cookies, and
                access to administrative data requires an authenticated administrator account. No
                system is perfectly secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">Changes</h2>
              <p>
                We may update this policy. Material changes will be reflected by the &ldquo;last
                updated&rdquo; date above.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">Contact</h2>
              <p>Questions about this policy: [CONTACT EMAIL].</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
