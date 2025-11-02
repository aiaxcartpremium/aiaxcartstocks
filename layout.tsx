import './globals.css';
import { ReactNode } from 'react';

export const metadata = { title: 'Admin Stock System' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{maxWidth:960, margin:'0 auto', padding:'24px'}}>
        <header style={{display:'flex', gap:12, alignItems:'center', marginBottom:16}}>
          <img src="/logo.svg" alt="logo" width={28} height={28}/>
          <b>Admin Stock Management</b>
        </header>
        {children}
      </body>
    </html>
  );
}