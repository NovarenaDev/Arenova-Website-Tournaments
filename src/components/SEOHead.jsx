import { useEffect } from 'react';

const SITE_URL = 'https://getarenova.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const SEO_CONFIGS = {
  home: {
    title: 'Arenova | Sports Tournament Registration & Venue Booking Platform',
    description: 'Arenova (getarenova.com by Novarena) connects players, tournament organizers, and sports venues. Discover badminton & pickleball tournaments, book courts, and track live scores.',
    keywords: 'Arenova, getarenova, getarenova.com, Novarena, badminton tournament registration, sports venue booking, pickleball tournaments, sports tournament portal Hyderabad',
    path: '/',
    noIndex: false,
    breadcrumbs: [
      { name: 'Home', item: `${SITE_URL}/` }
    ]
  },
  tournaments: {
    title: 'Live Tournaments, Brackets & Registrations | Arenova',
    description: 'Explore live and upcoming badminton and pickleball tournaments. View event schedules, prize pools, register teams online, and follow live match results on Arenova.',
    keywords: 'Arenova tournaments, getarenova tournaments, badminton tournaments near me, pickleball tournament registration, open championship sports Hyderabad, live draws',
    path: '/tournaments',
    noIndex: false,
    breadcrumbs: [
      { name: 'Home', item: `${SITE_URL}/` },
      { name: 'Tournaments', item: `${SITE_URL}/tournaments` }
    ]
  },
  venues: {
    title: 'Sports Venues & Court Operations | Arenova',
    description: 'Transform sports venue operations. Manage courts, bookable time slots, customer records, and instant online payments for badminton and pickleball facilities.',
    keywords: 'Arenova venues, sports facility booking, badminton court booking, pickleball court management, venue operations software, stadium bookings',
    path: '/venues',
    noIndex: false,
    breadcrumbs: [
      { name: 'Home', item: `${SITE_URL}/` },
      { name: 'Venues', item: `${SITE_URL}/venues` }
    ]
  },
  solutions: {
    title: 'Platform Solutions for Players, Organizers & Venues | Arenova',
    description: 'Discover Arenova digital solutions: tournament organizer tools, player profiles, automated brackets, venue management, and sports community networks.',
    keywords: 'tournament management software, sports event organizer platform, sports technology solutions, badminton tournament bracket generator',
    path: '/solutions',
    noIndex: false,
    breadcrumbs: [
      { name: 'Home', item: `${SITE_URL}/` },
      { name: 'Solutions', item: `${SITE_URL}/solutions` }
    ]
  },
  about: {
    title: 'About Arenova & Novarena | Building the Future of Sports',
    description: 'Learn about Arenova, developed by Novarena Technologies LLP in Hyderabad, India. Dedicated to making sports participation and tournament management seamless.',
    keywords: 'About Arenova, Novarena Technologies LLP, sports technology Hyderabad, sports platform mission',
    path: '/about',
    noIndex: false,
    breadcrumbs: [
      { name: 'Home', item: `${SITE_URL}/` },
      { name: 'About', item: `${SITE_URL}/about` }
    ]
  },
  contact: {
    title: 'Contact Arenova Support & Partnerships | getarenova.com',
    description: 'Contact Arenova support, venue onboarding, and tournament partnerships. Reach our Hyderabad team via phone (+91 7793934108), email, or WhatsApp.',
    keywords: 'Arenova contact, Novarena contact, sports tournament support Hyderabad, getarenova support',
    path: '/contact',
    noIndex: false,
    breadcrumbs: [
      { name: 'Home', item: `${SITE_URL}/` },
      { name: 'Contact', item: `${SITE_URL}/contact` }
    ]
  },
  legal_terms: {
    title: 'Terms & Conditions | Arenova & Novarena',
    description: 'Review the terms and conditions for using Arenova sports tournament registration, payment services, and venue booking platform.',
    path: '/terms-and-conditions',
    noIndex: false,
    breadcrumbs: [
      { name: 'Home', item: `${SITE_URL}/` },
      { name: 'Terms and Conditions', item: `${SITE_URL}/terms-and-conditions` }
    ]
  },
  legal_privacy: {
    title: 'Privacy Policy | Arenova & Novarena',
    description: 'Arenova privacy policy. Learn how Novarena Technologies LLP collects, protects, and handles personal data and tournament information.',
    path: '/privacy-policy',
    noIndex: false,
    breadcrumbs: [
      { name: 'Home', item: `${SITE_URL}/` },
      { name: 'Privacy Policy', item: `${SITE_URL}/privacy-policy` }
    ]
  },
  legal_refund: {
    title: 'Refund & Cancellation Policy | Arenova',
    description: 'Arenova policy on tournament registrations, venue booking cancellations, and payment refunds.',
    path: '/refund-cancellation-policy',
    noIndex: false,
    breadcrumbs: [
      { name: 'Home', item: `${SITE_URL}/` },
      { name: 'Refund Policy', item: `${SITE_URL}/refund-cancellation-policy` }
    ]
  },
  dashboard: {
    title: 'My Profile & Tournament Bookings | Arenova',
    description: 'View your tournament registrations, tickets, payment receipts, and profile settings on Arenova.',
    path: '/dashboard',
    noIndex: true, // Do not index private user dashboard
    breadcrumbs: []
  }
};

export default function SEOHead({ activePage, legalDocType = 'terms' }) {
  useEffect(() => {
    let configKey = activePage;
    if (activePage === 'legal') {
      if (legalDocType === 'privacy') configKey = 'legal_privacy';
      else if (legalDocType === 'refund') configKey = 'legal_refund';
      else configKey = 'legal_terms';
    }

    const config = SEO_CONFIGS[configKey] || SEO_CONFIGS.home;
    const fullUrl = `${SITE_URL}${config.path === '/' ? '' : config.path}`;

    // 1. Update Title
    document.title = config.title;

    // Helper to safely set meta tag attributes
    const setMetaTag = (attribute, attrValue, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attribute}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attribute, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', config.description);
    if (config.keywords) {
      setMetaTag('name', 'keywords', config.keywords);
    }
    setMetaTag('name', 'robots', config.noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('name', 'googlebot', config.noIndex ? 'noindex, nofollow' : 'index, follow');

    // 3. Canonical Tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // 4. Open Graph Tags
    setMetaTag('property', 'og:title', config.title);
    setMetaTag('property', 'og:description', config.description);
    setMetaTag('property', 'og:url', fullUrl);
    setMetaTag('property', 'og:image', DEFAULT_IMAGE);

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:title', config.title);
    setMetaTag('name', 'twitter:description', config.description);
    setMetaTag('name', 'twitter:url', fullUrl);
    setMetaTag('name', 'twitter:image', DEFAULT_IMAGE);

    // 6. Dynamic Breadcrumbs Structured Data (JSON-LD)
    const existingBreadcrumb = document.getElementById('schema-breadcrumbs');
    if (existingBreadcrumb) {
      existingBreadcrumb.remove();
    }

    if (config.breadcrumbs && config.breadcrumbs.length > 0) {
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': config.breadcrumbs.map((crumb, idx) => ({
          '@type': 'ListItem',
          'position': idx + 1,
          'name': crumb.name,
          'item': crumb.item
        }))
      };

      const script = document.createElement('script');
      script.id = 'schema-breadcrumbs';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(breadcrumbSchema);
      document.head.appendChild(script);
    }
  }, [activePage, legalDocType]);

  return null;
}
