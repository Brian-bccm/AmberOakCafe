import About from './components/About.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import Gallery from './components/Gallery.jsx'
import Hero from './components/Hero.jsx'
import Location from './components/Location.jsx'
import Menu from './components/Menu.jsx'
import Navbar from './components/Navbar.jsx'
import Promotion from './components/Promotion.jsx'
import WhatsAppButton from './components/WhatsAppButton.jsx'
import { cafe } from './data/siteContent.js'

function App() {
  return (
    <div className="min-h-screen bg-cafe-cream text-cafe-ink">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Menu />
        <Gallery />
        <Promotion />
        <Location />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton href={cafe.whatsappLink} />
    </div>
  )
}

export default App
