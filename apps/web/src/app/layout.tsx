import './global.css';
import { Providers } from './providers';

export const metadata = {
  title: 'AfricaHR',
  description: 'Enterprise multi-tenant HR & Payroll platform for Africa',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
