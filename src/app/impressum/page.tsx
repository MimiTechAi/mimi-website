"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Mail, Phone, Scale, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export default function ImpressumPage() {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-background z-0" />
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-brand-cyan/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[800px] h-[800px] bg-nvidia-green/10 rounded-full blur-[120px] pointer-events-none" />

      <Navigation />

      <div className="relative z-10 flex-1">
        <Breadcrumb items={[{ label: "Impressum" }]} />

        <section className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">Impressum</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Angaben gemäß § 5 TMG
              </p>
            </motion.div>

            <motion.div
              className="space-y-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                  }}
                >
                  <Card className="glass-panel border-white/10 h-full hover:shadow-[0_0_30px_rgba(0,240,255,0.1)] transition-all duration-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl text-white">
                        <div className="p-2 rounded-lg bg-brand-cyan/10 text-brand-cyan">
                          <Building2 size={24} />
                        </div>
                        Anbieter
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-gray-300">
                      <p className="font-semibold text-lg text-white">MiMi Tech Ai UG (haftungsbeschränkt)</p>
                      <p className="leading-relaxed">
                        Lindenplatz 23<br />
                        75378 Bad Liebenzell<br />
                        Deutschland
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                  }}
                >
                  <Card className="glass-panel border-white/10 h-full hover:shadow-[0_0_30px_rgba(0,240,255,0.1)] transition-all duration-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl text-white">
                        <div className="p-2 rounded-lg bg-nvidia-green/10 text-nvidia-green">
                          <Mail size={24} />
                        </div>
                        Kontakt
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-gray-300">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <a href="mailto:info@mimitechai.com" className="text-brand-cyan hover:text-brand-cyan-light transition-colors">
                          info@mimitechai.com
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <a href="tel:+4915758805737" className="text-brand-cyan hover:text-brand-cyan-light transition-colors">
                          +49 1575 8805737
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <a href="https://www.mimitechai.com" className="text-brand-cyan hover:text-brand-cyan-light transition-colors">
                          www.mimitechai.com
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                }}
              >
                <Card className="glass-panel border-white/10 hover:shadow-[0_0_30px_rgba(0,240,255,0.1)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl text-white">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Scale size={24} />
                      </div>
                      Rechtliche Angaben
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-8 text-gray-300">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Vertretungsberechtigte Person</p>
                      <p className="text-white text-lg">Michael Bemler</p>
                      <p className="text-sm text-gray-300">(Geschäftsführer)</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Verantwortlich für den Inhalt</p>
                      <p className="text-white text-lg">Michael Bemler</p>
                      <p className="text-gray-300">
                        Lindenplatz 23<br />
                        75378 Bad Liebenzell
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                }}
              >
                <Card className="glass-panel border-white/10">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Haftungsausschluss</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 text-sm text-gray-300 leading-relaxed">
                    <div>
                      <h3 className="font-semibold text-white text-base mb-2">Haftung für Inhalte</h3>
                      <p>
                        Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                      </p>
                      <p className="mt-2">
                        Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white text-base mb-2">Haftung für Links</h3>
                      <p>
                        Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
                      </p>
                      <p className="mt-2">
                        Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white text-base mb-2">Urheberrecht</h3>
                      <p>
                        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
                      </p>
                      <p className="mt-2">
                        Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}