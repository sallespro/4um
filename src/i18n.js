import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        debug: true,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        resources: {
            en: {
                translation: {
                    hero: {
                        title: "Expertise, tools and action",
                        subtitle: "We combine deep technical knowledge with cutting-edge AI tools to drive real business transformation.",
                        cta: "Enter Studio"
                    },
                    features: {
                        sectionTitle: "Professional Services",
                        consulting: {
                            title: "Strategic Consulting",
                            desc: "From roadmap to implementation, we guide your AI adoption journey."
                        },
                        development: {
                            title: "AI Development",
                            desc: "Custom AI agents, RAG systems, and integrations built for your specific needs."
                        },
                        training: {
                            title: "Workshops & Training",
                            desc: "Empower your team with the skills to leverage AI effectively."
                        }
                    },
                    about: {
                        title: "About Cloudpilot",
                        desc: "Cloudpilot is a premier AI consulting firm dedicated to helping businesses navigate the complex landscape of artificial intelligence."
                    },
                    whyUs: {
                        title: "Why Choose CloudPilot?",
                        items: [
                            { title: "Proven Expertise", desc: "Our team consists of industry veterans with a track record of successful AI deployments." },
                            { title: "Tailored Solutions", desc: "We don't believe in one-size-fits-all. Every solution is crafted to your unique business needs." },
                            { title: "Ethical AI", desc: "We prioritize responsible AI development, ensuring your systems are fair, transparent, and secure." }
                        ]
                    },
                    contact: {
                        title: "Get in Touch",
                        address: "MC Souza, 95 - Florianópolis-SC",
                        email: "hello@cloudpilot.com.br",
                        links: "Quick Links"
                    },
                    nav: {
                        login: "Login"
                    }
                }
            },
            pt: {
                translation: {
                    hero: {
                        title: "Expertise, ferramentas e ação",
                        subtitle: "Combinamos profundo conhecimento técnico com ferramentas de IA de ponta para impulsionar a transformação real dos negócios.",
                        cta: "Entrar no Studio"
                    },
                    features: {
                        sectionTitle: "Serviços Profissionais",
                        consulting: {
                            title: "Consultoria Estratégica",
                            desc: "Do roadmap à implementação, guiamos sua jornada de adoção de IA."
                        },
                        development: {
                            title: "Desenvolvimento de IA",
                            desc: "Agentes de IA personalizados, sistemas RAG e integrações criadas para suas necessidades específicas."
                        },
                        training: {
                            title: "Workshops e Treinamento",
                            desc: "Capacite sua equipe com as habilidades para alavancar a IA de forma eficaz."
                        }
                    },
                    about: {
                        title: "Sobre a Cloudpilot",
                        desc: "A Cloudpilot é uma consultoria de IA de ponta dedicada a ajudar empresas a navegar no complexo cenário da inteligência artificial."
                    },
                    whyUs: {
                        title: "Por que escolher a Cloudpilot?",
                        items: [
                            { title: "Expertise Comprovada", desc: "Nossa equipe é formada por veteranos da indústria com histórico de implantações de IA bem-sucedidas." },
                            { title: "Soluções Sob Medida", desc: "Não acreditamos em soluções únicas. Cada projeto é criado para atender às suas necessidades exclusivas." },
                            { title: "IA Ética", desc: "Priorizamos o desenvolvimento responsável de IA, garantindo que seus sistemas sejam justos, transparentes e seguros." }
                        ]
                    },
                    contact: {
                        title: "Entre em Contato",
                        address: "MC Souza, 95 - Florianópolis-SC",
                        email: "hello@cloudpilot.com.br",
                        links: "Links Rápidos"
                    },
                    nav: {
                        login: "Login"
                    }
                }
            }
        }
    });

export default i18n;
