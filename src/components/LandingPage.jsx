import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn, Globe, ArrowRight, Brain, Code, GraduationCap, CheckCircle2, Mail, MapPin, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import MatrixBackground from './MatrixBackground';
import ThemeToggle from './ThemeToggle';

export default function LandingPage({ onLoginClick }) {
    const { t, i18n } = useTranslation();
    const [scrolled, setScrolled] = useState(false);

    // Detect theme for MatrixBackground
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const checkTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');
            setTheme(isDark ? 'dark' : 'light');
        };

        checkTheme();

        // Output observer to detect class changes on html element
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'pt' : 'en';
        i18n.changeLanguage(newLang);
    };

    const features = [
        {
            icon: Brain,
            title: t('features.consulting.title'),
            desc: t('features.consulting.desc'),
        },
        {
            icon: Code,
            title: t('features.development.title'),
            desc: t('features.development.desc'),
        },
        {
            icon: GraduationCap,
            title: t('features.training.title'),
            desc: t('features.training.desc'),
        }
    ];

    const whyUs = t('whyUs.items', { returnObjects: true });
    // Debug log
    // console.log('whyUs items:', whyUs); 

    return (
        <div className="min-h-screen bg-transparent text-slate-900 dark:text-gray-100 relative transition-colors duration-300">
            <MatrixBackground theme={theme} />

            {/* Navbar */}
            <nav className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                scrolled ? "bg-white/80 dark:bg-[#02040a]/80 backdrop-blur-md border-slate-200 dark:border-white/5 py-4" : "bg-transparent border-transparent py-6"
            )}>
                <div className="max-w-7xl mx-auto px-8 md:px-12 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            cloudpilot
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <Globe className="w-4 h-4" />
                            <span className="uppercase">{i18n.language}</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 px-4 relative z-10">
                <div className="max-w-7xl mx-auto px-8 md:px-12">
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 mb-48">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white max-w-4xl leading-tight">
                            {t('hero.title')}
                        </h1>

                        <p className="text-xl text-slate-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            {t('hero.subtitle')}
                        </p>
                    </div>

                    {/* Features Section Heading */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">{t('features.sectionTitle')}</h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
                    </div>

                    {/* Features Grid - Clean Overlay Style */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-48">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="group flex flex-col items-start text-left hover:scale-105 transition-transform duration-300"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <feature.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                                </div>
                                <p className="text-slate-600 dark:text-gray-400 leading-relaxed text-lg">{feature.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Why Choose Us */}
                    <div className="mb-48">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">{t('whyUs.title')}</h2>
                            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-24">
                            {Array.isArray(whyUs) && whyUs.map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center text-center">
                                    <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">{item.title}</h3>
                                    <p className="text-slate-600 dark:text-gray-400 leading-relaxed text-lg">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* About & Contact Footer */}
                    <footer className="grid grid-cols-1 md:grid-cols-2 gap-16 border-t border-slate-200 dark:border-white/10 pt-24 pb-12">
                        <div>
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase mb-4 block">
                                {t('about.title')}
                            </span>
                            <p className="text-lg text-slate-600 dark:text-gray-400 leading-relaxed mb-8">
                                {t('about.desc')}
                            </p>
                        </div>

                        <div>
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase mb-4 block">
                                {t('contact.title')}
                            </span>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-600 dark:text-gray-400">
                                    <MapPin className="w-5 h-5 flex-shrink-0" />
                                    <span>{t('contact.address')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-gray-400">
                                    <Mail className="w-5 h-5 flex-shrink-0" />
                                    <a href={`mailto:${t('contact.email')}`} className="hover:text-blue-500 transition-colors">
                                        {t('contact.email')}
                                    </a>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-gray-400 mt-6 pt-6 border-t border-slate-200 dark:border-white/5">
                                    <LinkIcon className="w-5 h-5 flex-shrink-0" />
                                    <div className="flex gap-4 text-sm font-medium">
                                        <a href="#" className="hover:text-blue-500 transition-colors">LinkedIn</a>
                                        <a href="#" className="hover:text-blue-500 transition-colors">Twitter</a>
                                        <a href="#" className="hover:text-blue-500 transition-colors">GitHub</a>
                                        <button
                                            onClick={onLoginClick}
                                            className="hover:text-blue-500 transition-colors cursor-pointer"
                                        >
                                            AI Studio
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </footer>

                    <div className="text-center text-slate-400 text-sm py-12">
                        &copy; {new Date().getFullYear()} CloudPilot. All rights reserved.
                    </div>
                </div>
            </main>
        </div>
    );
}
