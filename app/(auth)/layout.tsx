import "@/styles/global.css";

export default function AuthRootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body className="h-screen w-screen p-6">{children}</body>
    </html>
  );
}
