import { galleryImages } from '../data/siteContent.js'

function Gallery() {
  return (
    <section id="gallery" className="bg-cafe-oat/70">
      <div className="section-shell">
        <p className="eyebrow">Gallery</p>
        <h2 className="section-title">A visual-first layout for real food businesses.</h2>
        <p className="section-copy">
          The gallery is built to make food, drinks, and ambience visible immediately on mobile and desktop.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-4 md:grid-rows-2">
          {galleryImages.map((image, index) => (
            <figure
              key={image.src}
              className={`overflow-hidden rounded-lg bg-stone-200 shadow-sm ${
                index === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="h-full min-h-64 w-full object-cover transition duration-500 hover:scale-105"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Gallery
