import '@/styles/global.css'
import TabBar from '@/components/TabBar/TabBar';

export default function DashboardRootLayout({children}) {
  return (
    <html lang="en">
      <head />
      <body className="h-screen w-screen layout-black">
        <div>
          {children}
          <TabBar />
        </div>
      </body>
    </html>
  )
}