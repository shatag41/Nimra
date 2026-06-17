import type { Metadata } from 'next';
import { AuthProvider } from '../context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './globals.css';
import LayoutWrapper from '../components/LayoutWrapper';
import { CartProvider } from '../components/CartProvider';
import { fetchCMSData } from '../utils/api';
import StyledJsxRegistry from './registry';
import { Toaster } from 'sonner';

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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700&display=swap"
          rel="stylesheet"
        />
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
      <body suppressHydrationWarning>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy_client_id'}>
          <AuthProvider>
            <StyledJsxRegistry>
              <CartProvider>
                <LayoutWrapper companyInfo={data.companyInfo}>
                  {children}
                </LayoutWrapper>
              </CartProvider>
            </StyledJsxRegistry>
          </AuthProvider>
        </GoogleOAuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
