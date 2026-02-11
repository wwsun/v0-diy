import './globals.css';

export const metadata = {
  title: 'AI Chat Playground',
  description: 'A clean chat interface built with Next.js and AI SDK.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
