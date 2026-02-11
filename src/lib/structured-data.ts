export const getStructuredData = () => {
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": "https://www.mimitechai.com/#organization",
                "name": "MiMi Tech AI",
                "url": "https://www.mimitechai.com",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png",
                    "width": "192",
                    "height": "192"
                },
                "description": "Experten für Schwarzwald KI-Beratung und Bad Liebenzell Digitalisierung. KI-Beratung, Mitarbeiterschulungen und Digitale Zwillinge",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Bad Liebenzell",
                    "addressRegion": "Schwarzwald",
                    "addressCountry": "DE"
                },
                "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": "+49-1575-8805737",
                    "contactType": "customer service",
                    "email": "info@mimitechai.com",
                    "availableLanguage": ["de", "en"]
                },
                "sameAs": [
                    "https://linkedin.com/company/mimitechai",
                    "https://www.instagram.com/mimi_tech_ai/"
                ]
            },
            {
                "@type": "ProfessionalService",
                "@id": "https://www.mimitechai.com/#service-ai-consulting",
                "name": "KI Beratung & Schulung",
                "provider": {
                    "@id": "https://www.mimitechai.com/#organization"
                },
                "serviceType": "Künstliche Intelligenz Beratung und Schulung",
                "description": "Maßgeschneiderte KI-Beratung und praxisnahe Schulungen für Unternehmer und Mitarbeiter",
                "areaServed": {
                    "@type": "Country",
                    "name": "Deutschland"
                },
                "hasOfferCatalog": {
                    "@type": "OfferCatalog",
                    "name": "KI Services",
                    "itemListElement": [
                        {
                            "@type": "Offer",
                            "itemOffered": {
                                "@type": "Service",
                                "name": "KI-Strategieberatung",
                                "description": "Individuelle Beratung für Ihre KI-Strategie"
                            }
                        },
                        {
                            "@type": "Offer",
                            "itemOffered": {
                                "@type": "Service",
                                "name": "KI-Schulungen",
                                "description": "Praxisnahe Schulungen für Ihr Team"
                            }
                        }
                    ]
                }
            },
            {
                "@type": "ProfessionalService",
                "@id": "https://www.mimitechai.com/#service-digital-twins",
                "name": "Digitale Zwillinge",
                "provider": {
                    "@id": "https://www.mimitechai.com/#organization"
                },
                "serviceType": "Digitale Zwillinge Entwicklung und Implementierung",
                "description": "Von Anlagen bis zu urbanen Infrastrukturen – digitale Abbilder für optimierte Prozesse",
                "areaServed": {
                    "@type": "Country",
                    "name": "Deutschland"
                }
            },
            {
                "@type": "WebSite",
                "@id": "https://www.mimitechai.com/#website",
                "url": "https://www.mimitechai.com",
                "name": "MiMi Tech AI",
                "publisher": {
                    "@id": "https://www.mimitechai.com/#organization"
                },
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://www.mimitechai.com/search?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                }
            },
            {
                "@type": "BreadcrumbList",
                "@id": "https://www.mimitechai.com/#breadcrumb",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": "https://www.mimitechai.com"
                    }
                ]
            },
            {
                "@type": "FAQPage",
                "@id": "https://www.mimitechai.com/#faq",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "Was ist ein Digitaler Zwilling?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Ein Digitaler Zwilling ist eine virtuelle Repräsentation eines physischen Objekts, Prozesses oder Systems. Von industriellen Anlagen bis zu urbanen Infrastrukturen können Digitale Zwillinge Prozesse simulieren, optimieren und überwachen."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Wie kann KI-Beratung mein Unternehmen unterstützen?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "KI-Beratung hilft Unternehmen, Potenziale von Künstlicher Intelligenz zu identifizieren, passende Lösungen zu entwickeln und erfolgreich zu implementieren. Von der Strategieentwicklung bis zur Mitarbeiterschulung begleiten wir Sie auf dem Weg zur digitalen Transformation."
                        }
                    }
                ]
            }
        ]
    };
};
