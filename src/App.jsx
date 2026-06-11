import { lazy, Suspense } from 'react'
import About from './components/About.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import Gallery from './components/Gallery.jsx'
import Hero from './components/Hero.jsx'
import Location from './components/Location.jsx'
import Menu from './components/Menu.jsx'
import Navbar from './components/Navbar.jsx'
import Order from './components/Order.jsx'
import Promotion from './components/Promotion.jsx'
import Reservation from './components/Reservation.jsx'
import WhatsAppButton from './components/WhatsAppButton.jsx'
import { cafe } from './data/siteContent.js'

const AdminApp = lazy(() => import('./components/admin/AdminApp.jsx'))

function App() {
  if (window.location.pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={<main className="min-h-screen bg-cafe-cream p-8">Loading admin dashboard...</main>}>
        <AdminApp />
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen bg-cafe-cream text-cafe-ink">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Menu />
        <Order />
        <Gallery />
        <Promotion />
        <Reservation />
        <Location />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton href={cafe.whatsappLink} />
    </div>
  )
}

export default App
