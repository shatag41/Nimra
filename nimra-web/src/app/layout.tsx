import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import LayoutWrapper from '../components/LayoutWrapper';
import { CartProvider } from '../components/CartProvider';
import { fetchCMSData } from '../utils/api';
import StyledJsxRegistry from './registry';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchCMSData();
  const brand = data.companyInfo.BrandName || 'NIMRA';
  
  return {
    title: {
      default: `${brand} | Pure Packaged Drinking Water Pune`,
      template: `%s | ${brand}`
    },
    description: `NIMRA Packaged Drinking Water is Pune's premium source of clean, mineral-enriched hydration. Purified with advanced 10-step filtration and certified safe.`,
    keywords: ['NIMRA water', 'packaged drinking water', 'mineral water', '20L water jar Pune', 'drinking water delivery', 'Daund', 'Camp Pune', 'pure hydration', 'RUSH soda'],
    authors: [{ name: 'T.S. Enterprises' }],
    openGraph: {
      title: `${brand} Packaged Drinking Water`,
      description: 'Experience pure hydration with mineral-balanced packaged drinking water from NIMRA.',
      url: 'https://nimrawater.com',
      siteName: brand,
      locale: 'en_IN',
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    }
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await fetchCMSData();

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  if (!savedTheme) {
                    var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    savedTheme = systemTheme;
                  }
                  document.documentElement.setAttribute('data-theme', savedTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <StyledJsxRegistry>
          <CartProvider>
            <LayoutWrapper companyInfo={data.companyInfo}>
              {children}
            </LayoutWrapper>
          </CartProvider>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
