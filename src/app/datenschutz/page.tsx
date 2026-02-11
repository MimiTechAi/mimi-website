"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, FileText, Cookie, Mail, Server } from "lucide-react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export default function DatenschutzPage() {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-background z-0" />
      <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] bg-brand-cyan/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[800px] h-[800px] bg-nvidia-green/10 rounded-full blur-[120px] pointer-events-none" />

      <Navigation />

      <Breadcrumb items={[{ label: "Datenschutz" }]} />

      <div className="relative z-10 flex-1">
        <section className="pt-24 md:pt-32 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">Datenschutz</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Informationen zum Schutz Ihrer personenbezogenen Daten gemäß DSGVO
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
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                }}
              >
                <Card className="glass-panel border-white/10 hover:shadow-[0_0_30px_rgba(0,240,255,0.1)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl text-white">
                      <div className="p-2 rounded-lg bg-brand-cyan/10 text-brand-cyan">
                        <Shield size={24} />
                      </div>
                      1. Datenschutz auf einen Blick
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 text-gray-300">
                    <div>
                      <h3 className="font-semibold text-white text-base mb-2">Allgemeine Hinweise</h3>
                      <p className="leading-relaxed">
                        Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white text-base mb-2">Datenerfassung auf dieser Website</h3>
                      <div className="space-y-4">
                        <div>
                          <strong className="text-white block mb-1">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong>
                          <p>Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.</p>
                        </div>
                        <div>
                          <strong className="text-white block mb-1">Wie erfassen wir Ihre Daten?</strong>
                          <p>Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben. Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z.B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.</p>
                        </div>
                        <div>
                          <strong className="text-white block mb-1">Wofür nutzen wir Ihre Daten?</strong>
                          <p>Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white text-base mb-2">Welche Rechte haben Sie bezüglich Ihrer Daten?</h3>
                      <p className="leading-relaxed">
                        Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
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
                <Card className="glass-panel border-white/10 hover:shadow-[0_0_30px_rgba(0,240,255,0.1)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl text-white">
                      <div className="p-2 rounded-lg bg-nvidia-green/10 text-nvidia-green">
                        <Server size={24} />
                      </div>
                      2. Hosting und Content Delivery Networks (CDN)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 text-gray-300">
                    <div>
                      <h3 className="font-semibold text-white text-base mb-2">Externes Hosting</h3>
                      <p className="leading-relaxed">
                        Diese Website wird bei einem externen Dienstleister gehostet (Hoster). Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es sich v.a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und sonstige Daten, die über eine Website generiert werden, handeln.
                      </p>
                      <p className="mt-2 leading-relaxed">
                        Der Einsatz des Hosters erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white text-base mb-2">Auftragsverarbeitung</h3>
                      <p className="leading-relaxed">
                        Wir haben einen Vertrag über Auftragsverarbeitung (AVV) mit dem oben genannten Anbieter geschlossen. Hierbei handelt es sich um einen datenschutzrechtlich vorgeschriebenen Vertrag, der gewährleistet, dass dieser die personenbezogenen Daten unserer Websitebesucher nur nach unseren Weisungen und unter Einhaltung der DSGVO verarbeitet.
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
                <Card className="glass-panel border-white/10 hover:shadow-[0_0_30px_rgba(0,240,255,0.1)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl text-white">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <FileText size={24} />
                      </div>
                      3. Allgemeine Hinweise und Pflichtinformationen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 text-gray-300">
                    <div>
                      <h3 className="font-semibold text-white text-base mb-2">Datenschutz</h3>
                      <p className="leading-relaxed">
                        Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
                      </p>
                      <p className="mt-2 leading-relaxed">
                        Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white text-base mb-2">Hinweis zur verantwortlichen Stelle</h3>
                      <p className="mb-2">Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
                      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <p className="text-white font-medium">MiMi Tech Ai UG (haftungsbeschränkt)</p>
                        <p>Michael Bemler</p>
                        <p>Lindenplatz 23</p>
                        <p>75378 Bad Liebenzell</p>
                        <p>Deutschland</p>
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p>E-Mail: <a href="mailto:info@mimitechai.com" className="text-brand-cyan hover:underline">info@mimitechai.com</a></p>
                          <p>Telefon: <a href="tel:+4915758805737" className="text-brand-cyan hover:underline">+49 1575 8805737</a></p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white text-base mb-2">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
                      <p className="leading-relaxed">
                        Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
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
                <Card className="glass-panel border-white/10 hover:shadow-[0_0_30px_rgba(0,240,255,0.1)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl text-white">
                      <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                        <Eye size={24} />
                      </div>
                      4. Datenerfassung auf dieser Website
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 text-gray-300">
                    <div>
                      <h3 className="font-semibold text-white text-base mb-2">Server-Log-Dateien</h3>
                      <p className="leading-relaxed mb-2">
                        Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-gray-300">
                        <li>Browsertyp und Browserversion</li>
                        <li>verwendetes Betriebssystem</li>
                        <li>Referrer URL</li>
                        <li>Hostname des zugreifenden Rechners</li>
                        <li>Uhrzeit der Serveranfrage</li>
                        <li>IP-Adresse</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white text-base mb-2">Kontaktformular</h3>
                      <p className="leading-relaxed">
                        Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
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
                <Card className="glass-panel border-white/10 bg-brand-cyan/5 hover:shadow-[0_0_30px_rgba(0,240,255,0.1)] transition-all duration-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-300">
                      <strong className="text-white">Hinweis:</strong> Diese Datenschutzerklärung wurde mit größter Sorgfalt erstellt. Bei Verwendung weiterer Dienste (z.B. Social Media Plugins, Newsletter-Tools) müssen entsprechende Abschnitte ergänzt werden. Wir empfehlen, einen Datenschutzbeauftragten oder Rechtsanwalt für eine abschließende Prüfung hinzuzuziehen.
                    </p>
                    <p className="text-sm text-gray-300 mt-2">
                      <strong className="text-white">Stand:</strong> 11. Februar 2026
                    </p>
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