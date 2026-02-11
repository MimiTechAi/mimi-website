"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SpotlightCard from "@/components/SpotlightCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Award, ArrowRight, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { RelatedServices } from "@/components/RelatedServices";

export default function AboutPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const values = [
    {
      title: "Innovation",
      description: "Als junges Unternehmen im Schwarzwald bleiben wir am Puls der Zeit und bringen die neuesten KI-Technologien direkt zu Unternehmen in Bad Liebenzell und der Region.",
    },
    {
      title: "Kundenorientierung",
      description: "Ihr Erfolg ist unser Erfolg. Wir entwickeln Lösungen, die auf Ihre spezifischen Bedürfnisse zugeschnitten sind.",
    },
    {
      title: "Exzellenz",
      description: "Höchste Qualität in Beratung, Schulung und Implementierung – unterstützt durch NVIDIA-Technologien.",
    },
  ];

  const expertise = [
    {
      area: "Künstliche Intelligenz",
      skills: ["Machine Learning", "Natural Language Processing", "Computer Vision", "Predictive Analytics"],
    },
    {
      area: "Digitale Zwillinge",
      skills: ["3D-Modellierung", "IoT-Integration", "Echtzeit-Simulation", "Data Analytics"],
    },
    {
      area: "Beratung & Training",
      skills: ["Strategieentwicklung", "Change Management", "Praxisworkshops", "E-Learning"],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-brand-cyan/30">
      <Navigation />

      <Breadcrumb items={[{ label: "Über uns" }]} />

      {/* Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-nvidia-green/20 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-cyan/20 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="flex items-center justify-center gap-2 mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2">
                <Award className="text-brand-cyan" size={16} />
                <span className="text-sm font-medium text-gray-300">Mitglied im NVIDIA Connect Programm</span>
              </div>
            </motion.div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-[1.1] tracking-tight text-glow">
              Über <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-nvidia-green">MiMi Tech AI</span>
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 mb-4 font-light leading-relaxed">
              Wir sind Michael und Michael – zwei KI-Enthusiasten aus dem Landkreis Calw.
              Mit unserem Sitz in Bad Liebenzell bieten wir professionelle Schwarzwald KI-Beratung und Bad Liebenzell Digitalisierung mit
              globaler Technologie-Expertise.
            </p>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-500 mb-8 font-light leading-relaxed">
              Der Name <span className="text-brand-cyan font-semibold">MiMi</span> steht für unsere beiden Gründer –
              zwei Michaels mit einer gemeinsamen Vision: KI-Technologie zugänglich und nutzbar für
              jedes Unternehmen im Schwarzwald zu machen.
            </p>
            <motion.div
              className="flex items-center justify-center gap-2 text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <MapPin className="text-nvidia-green" size={20} />
              <span>Bad Liebenzell, Landkreis Calw</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-white">Die Geschichte hinter MiMi</h2>
              <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 font-light leading-relaxed">
                Zwei Michaels, eine Vision
              </p>
            </div>

            <SpotlightCard className="glass-premium border-none overflow-hidden p-6 md:p-12 rounded-2xl group card-lift">
              <div className="card-gradient-overlay" />
              <div className="text-base md:text-lg leading-relaxed space-y-6 text-gray-300 relative z-10">
                <p>
                  Als zwei Michaels aus dem Landkreis Calw erkannten wir das enorme Potenzial,
                  das in der Künstlichen Intelligenz und Digitalen Zwillingen steckt. Gleichzeitig
                  sahen wir, dass viele Unternehmen im Schwarzwald – besonders im Mittelstand – noch zögern,
                  diese Technologien zu nutzen.
                </p>
                <p>
                  Aus dieser Beobachtung entstand <span className="text-brand-cyan font-semibold">MiMi Tech AI</span> –
                  ein Name, der für uns beide steht und gleichzeitig unseren Ansatz verkörpert:
                  Technologie mit menschlichem Gesicht, regional verwurzelt im Schwarzwald und global vernetzt.
                </p>
                <p>
                  Von unserem Standort in Bad Liebenzell aus unterstützen wir Unternehmen im Schwarzwald
                  dabei, die digitale Transformation erfolgreich zu meistern. Als Mitglied im NVIDIA Connect
                  Program haben wir Zugang zu modernen NVIDIA-Technologien, Trainings und Ressourcen, die wir
                  praxisnah und verständlich zu Ihnen bringen.
                </p>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </section>

      {/* Regional Engagement Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-white">Unsere Wurzeln im Schwarzwald</h2>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
              Regional verwurzelt, global vernetzt
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.2 }
              }
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -30 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
              }}
              className="h-full"
            >
              <SpotlightCard className="glass-premium border-none overflow-hidden p-8 rounded-2xl h-full group card-lift">
                <div className="card-gradient-overlay" />
                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white relative z-10">Inspiriert vom Schwarzwald</h3>
                <div className="text-lg md:text-xl leading-relaxed text-gray-300 space-y-4 relative z-10">
                  <p>
                    Der Schwarzwald mit seiner einzigartigen Natur und Kultur ist unsere ständige Inspirationsquelle.
                    Genau wie die vielfältigen Ökosysteme des Schwarzwalds bieten auch wir maßgeschneiderte Lösungen,
                    die sich individuell an die Bedürfnisse Ihres Unternehmens anpassen.
                  </p>
                  <p>
                    Die Tradition des Handwerks und der Präzision im Schwarzwald spiegelt sich in unserer Arbeitsweise wider.
                    Wir kombinieren technische Exzellenz mit handwerklichem Geschick.
                  </p>
                </div>
              </SpotlightCard>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, x: 30 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
              }}
              className="h-full"
            >
              <SpotlightCard className="glass-premium border-none overflow-hidden p-8 rounded-2xl h-full group card-lift">
                <div className="card-gradient-overlay" />
                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white relative z-10">Regionales Engagement</h3>
                <div className="text-lg md:text-xl leading-relaxed text-gray-300 relative z-10">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-nvidia-green mt-2.5 flex-shrink-0" />
                      <span><span className="font-semibold text-white">Kooperation:</span> Partnerschaften mit mittelständischen Betrieben im Landkreis Calw</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-nvidia-green mt-2.5 flex-shrink-0" />
                      <span><span className="font-semibold text-white">Wissensvermittlung:</span> Workshops und Schulungen für regionale Fachkräfte</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-nvidia-green mt-2.5 flex-shrink-0" />
                      <span><span className="font-semibold text-white">Innovationsförderung:</span> Unterstützung bei der Digitalisierung</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-nvidia-green mt-2.5 flex-shrink-0" />
                      <span><span className="font-semibold text-white">Netzwerkbildung:</span> Vernetzung regionaler Akteure</span>
                    </li>
                  </ul>
                </div>
              </SpotlightCard>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* NVIDIA Connect Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-white">NVIDIA Connect Programm</h2>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
              Wir sind Mitglied im NVIDIA Connect Programm – einem Programm für Softwareunternehmen und Service Provider,
              die Lösungen auf Basis von NVIDIA-Technologien entwickeln. So erhalten wir Zugang zu technischen Ressourcen,
              Trainings und ausgewählten Konditionen; unsere Kund:innen profitieren von aktuellen Best Practices und stabilen KI-Stacks.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {[
              { title: "Neueste Technologien", desc: "Zugang zu aktuellen NVIDIA SDKs und Tools für AI, Computer Vision und Deep Learning" },
              { title: "Technical Training", desc: "Kostenlose Self-Paced Kurse und rabattierte Workshops über NVIDIA Training" },
              { title: "Early Insight", desc: "Frühe Einblicke in neue Generative-AI- und Deep-Learning-Lösungen" },
              { title: "Program Benefits", desc: "Personalisierte SDK- und Content-Empfehlungen aus dem NVIDIA-Ökosystem" }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
                }}
              >
                <SpotlightCard className="glass-premium border-none overflow-hidden p-6 rounded-xl h-full group card-lift">
                  <div className="card-gradient-overlay" />
                  <div className="text-center relative z-10">
                    <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">{item.title}</h3>
                    <p className="text-base md:text-lg leading-relaxed text-gray-300">{item.desc}</p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.2 }
              }
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -30 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
              }}
            >
              <SpotlightCard className="glass-premium border-none overflow-hidden p-8 rounded-2xl h-full group card-lift">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white relative z-10">Unsere Mission</h3>
                <p className="text-lg md:text-xl leading-relaxed text-gray-300 relative z-10">
                  Wir demokratisieren den Zugang zu Künstlicher Intelligenz und Digitalen Zwillingen.
                  Jedes Unternehmen – unabhängig von Größe oder Branche – soll von den Möglichkeiten
                  modernster KI-Technologien profitieren können.
                </p>
              </SpotlightCard>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, x: 30 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
              }}
            >
              <SpotlightCard className="glass-premium border-none overflow-hidden p-8 rounded-2xl h-full group card-lift">
                <div className="absolute inset-0 bg-gradient-to-br from-nvidia-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white relative z-10">Unsere Vision</h3>
                <p className="text-lg md:text-xl leading-relaxed text-gray-300 relative z-10">
                  Wir sehen eine Zukunft, in der KI und Digitale Zwillinge selbstverständliche
                  Werkzeuge für jedes Unternehmen sind. MiMi Tech AI ist der Wegbereiter dieser Transformation –
                  mit Innovation und direktem Zugang zu NVIDIA-Technologien.
                </p>
              </SpotlightCard>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-white">Unsere Werte</h2>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
              Was uns antreibt und leitet
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.15 }
              }
            }}
          >
            {values.map((value) => (
              <motion.div
                key={value.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
                }}
              >
                <SpotlightCard className="glass-premium border-none overflow-hidden p-8 rounded-2xl h-full text-center group card-lift">
                  <div className="card-gradient-overlay" />
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white relative z-10">{value.title}</h3>
                  <p className="text-lg md:text-xl leading-relaxed text-gray-300 relative z-10">{value.description}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section >

      {/* Expertise Section */}
      < section className="py-20 px-4 sm:px-6 lg:px-8 z-10" >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-white">Unsere Expertise</h2>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
              Fundiertes Know-how kombiniert mit Zugang zu NVIDIA-Technologien
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.15 }
              }
            }}
          >
            {expertise.map((item) => (
              <motion.div
                key={item.area}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
                }}
              >
                <SpotlightCard className="glass-premium border-none overflow-hidden p-8 rounded-2xl h-full group card-lift">
                  <div className="card-gradient-overlay" />
                  <h3 className="text-2xl md:text-3xl font-bold mb-6 text-white relative z-10">{item.area}</h3>
                  <ul className="space-y-3 relative z-10">
                    {item.skills.map((skill, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-nvidia-green" />
                        <span className="text-gray-300 text-lg">{skill}</span>
                      </li>
                    ))}
                  </ul>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section >

      {/* CTA Section */}
      < section className="py-20 px-4 sm:px-6 lg:px-8 z-10" >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="glass-panel p-6 md:p-12 rounded-3xl text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 via-transparent to-nvidia-green/10 opacity-50" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 text-white">
                  Lassen Sie uns gemeinsam Ihre <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-nvidia-green">Zukunft</span> gestalten
                </h2>
                <p className="text-lg md:text-xl leading-relaxed mb-8 text-gray-300 max-w-2xl mx-auto">
                  Kontaktieren Sie uns für ein unverbindliches Erstgespräch und erfahren Sie,
                  wie wir mit modernsten NVIDIA-Technologien Ihr Unternehmen voranbringen können.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => router.push("/contact")}
                    size="lg"
                    className="bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-brand-cyan/90 hover:to-brand-blue/90 text-white border-0 shadow-lg shadow-brand-cyan/20"
                  >
                    Jetzt Kontakt aufnehmen
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                  <Button
                    onClick={() => router.push("/ki-beratung")}
                    size="lg"
                    variant="outline"
                    className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                  >
                    Unsere Services entdecken
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section >

      <RelatedServices currentSlug="about" />
      <Footer />
    </div >
  );
}