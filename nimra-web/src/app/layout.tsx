import type { Metadata } from 'next';
import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CartProvider } from '../components/CartProvider';
import { fetchCMSData } from '../utils/api';

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
    <html lang="en">
      <body>
        <CartProvider>
          <Header companyInfo={data.companyInfo} />
          <main style={{ flex: '1', paddingTop: '80px' }}>
            {children}
          </main>
          <Footer companyInfo={data.companyInfo} />
        </CartProvider>
      </body>
    </html>
  );
}
