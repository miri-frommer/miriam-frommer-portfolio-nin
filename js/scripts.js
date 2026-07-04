// ─── Intro Overlay ───
const introOverlay = document.getElementById('intro-overlay');

if (introOverlay) {
  const showIntroOverlay = () => {
    introOverlay.classList.add('visible');
    introOverlay.setAttribute('aria-hidden', 'false');
  };

  const hideIntroOverlay = () => {
    introOverlay.classList.remove('visible');
    introOverlay.setAttribute('aria-hidden', 'true');
  };

  window.addEventListener('load', () => {
    setTimeout(showIntroOverlay, 1450);
  });

  introOverlay.addEventListener('click', hideIntroOverlay);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && introOverlay.classList.contains('visible')) {
      hideIntroOverlay();
    }
  });
}

// ─── Custom Cursor ───
const cursor = document.getElementById('cursor');
const trail  = document.getElementById('cursor-trail');
let mx = 0, my = 0, tx = 0, ty = 0;
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.transform = `translate(${mx - 6}px, ${my - 6}px)`;
});
setInterval(() => {
  tx += (mx - tx) * 1;
  ty += (my - ty) * 1;
  trail.style.transform = `translate(${tx - 16}px, ${ty - 16}px)`;
}, 16);
document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => { cursor.style.transform += ' scale(1.8)'; cursor.style.background = '#d4c5e8'; });
  el.addEventListener('mouseleave', () => { cursor.style.background = 'var(--blush)'; });
});

// ─── Smooth scroll without hash in URL ───
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ─── Scroll reveal ┌─────────────────────────────────────────
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      e.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.width;
      });
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ─── Lightbox ───
const lightbox   = document.getElementById('lightbox');
const lbThumb    = document.getElementById('lightbox-thumb');
const lbPanorama = document.getElementById('lightbox-panorama');
const lbHint     = document.getElementById('panorama-hint');
const lbCat      = document.getElementById('lightbox-cat');
const lbTitle    = document.getElementById('lightbox-title');
const lbDesc     = document.getElementById('lightbox-desc');
const lbClose    = document.getElementById('lightbox-close');
const lbBackdrop = document.getElementById('lightbox-backdrop');
let pannellumViewer = null;

// Galerie-Parser: "row:3|Bild1,Bild2,Bild3|row:1|Bild4|pano:360.jpg"
let galleryPanoCounter = 0;
function buildGallery(galleryData) {
  const gallery = document.getElementById('lightbox-gallery');
  gallery.innerHTML = '';
  if (!galleryData) return;

  const segments = galleryData.split('|');
  let currentCols = 3;
  let i = 0;
  while (i < segments.length) {
    const seg = segments[i].trim();
    if (seg.startsWith('row:')) {
      currentCols = parseInt(seg.replace('row:', '')) || 3;
      i++;
    } else if (seg.startsWith('text:')) {
      const text = seg.replace('text:', '').trim();
      const p = document.createElement('p');
      p.className = 'gallery-text';
      p.textContent = text;
      gallery.appendChild(p);
      i++;
    } else if (seg.startsWith('pano:')) {
      const src = seg.replace('pano:', '').trim();
      const viewerId = 'gallery-pano-' + (galleryPanoCounter++);
      const wrapper = document.createElement('div');
      wrapper.className = 'gallery-panorama-row';
      wrapper.id = viewerId;
      gallery.appendChild(wrapper);
      const hint = document.createElement('p');
      hint.className = 'gallery-panorama-hint';
      try {
        const langNow = (document.documentElement.lang && document.documentElement.lang.startsWith('en')) ? 'en' : 'de';
        hint.textContent = translations.panorama_hint ? translations.panorama_hint[langNow] : '🖱 Ziehen zum Umsehen · Scrollen zum Zoomen';
      } catch (e) {
        hint.textContent = '🖱 Ziehen zum Umsehen · Scrollen zum Zoomen';
      }
      gallery.appendChild(hint);
      setTimeout(() => {
        pannellum.viewer(viewerId, {
          type: 'equirectangular',
          panorama: src,
          autoLoad: true,
          autoRotate: -2,
          compass: false,
          showControls: true,
          mouseZoom: true,
        });
      }, 150);
      i++;
    } else if (seg.startsWith('video:')) {
      const src = seg.replace('video:', '').trim();
      const wrapper = document.createElement('div');
      wrapper.className = 'gallery-video-row';
      const video = document.createElement('video');
      video.className = 'gallery-video';
      video.controls = true;
      video.preload = 'metadata';
      video.playsInline = true;
      const source = document.createElement('source');
      source.src = src;
      source.type = 'video/mp4';
      video.appendChild(source);
      wrapper.appendChild(video);
      gallery.appendChild(wrapper);
      i++;
    } else {
      const images = seg.split(',').map(s => s.trim()).filter(Boolean);
      if (images.length) {
        const row = document.createElement('div');
        row.className = `gallery-row cols-${currentCols}`;
        images.forEach(src => {
          const img = document.createElement('img');
          img.src = src;
          img.alt = '';
          row.appendChild(img);
        });
        gallery.appendChild(row);
      }
      i++;
    }
  }
}

document.querySelectorAll('.project-thumb').forEach(thumb => {
  thumb.addEventListener('click', () => {
    const videoSrc = thumb.dataset.video;
    const panoramaSrc = thumb.dataset.panorama;

    if (videoSrc) {
      lbThumb.style.display = 'flex';
      lbThumb.innerHTML = `
        <video controls preload="metadata" playsinline poster="${thumb.dataset.img || ''}" class="lightbox-video">
          <source src="${videoSrc}" type="video/mp4">
          Dein Browser unterstützt keine Videowiedergabe.
        </video>`;
      lbPanorama.classList.remove('active');
      lbHint.style.display = 'none';
    } else if (panoramaSrc) {
      lbThumb.style.display = 'none';
      lbPanorama.classList.add('active');
      lbHint.style.display = 'flex';
      if (pannellumViewer) { pannellumViewer.destroy(); }
      pannellumViewer = pannellum.viewer('panorama-viewer', {
        type: 'equirectangular',
        panorama: panoramaSrc,
        autoLoad: true,
        autoRotate: -2,
        compass: false,
        showControls: true,
        mouseZoom: true,
      });
    } else {
      lbThumb.style.display = 'flex';
      lbThumb.innerHTML = `<img src="${thumb.dataset.img}" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:12px;">`;
      lbPanorama.classList.remove('active');
      lbHint.style.display = 'none';
    }

    lbCat.textContent   = thumb.dataset.cat;
    lbTitle.textContent = thumb.dataset.title;
    const rawAttr = thumb.dataset.descFull || thumb.dataset.desc || thumb.getAttribute('data-desc-full') || thumb.getAttribute('data-desc') || '';
    const rawText = String(rawAttr).replace(/&#10;|&#13;|\r/g, '\n');
    lbDesc.innerHTML = rawText
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => `<p>${line}</p>`)
      .join('');

    buildGallery(thumb.dataset.gallery);

    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

function stopActiveMedia() {
  lightbox.querySelectorAll('video').forEach(video => {
    try {
      video.pause();
      video.currentTime = 0;
      if (video.removeAttribute) video.removeAttribute('src');
      if (video.load) video.load();
    } catch (e) {}
  });

  if (pannellumViewer) {
    pannellumViewer.destroy();
    pannellumViewer = null;
  }

  const gallery = document.getElementById('lightbox-gallery');
  if (gallery) gallery.innerHTML = '';
  lbThumb.innerHTML = '';
}

function closeLightbox() {
  stopActiveMedia();
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  lbPanorama.classList.remove('active');
  lbHint.style.display = 'none';
  lbThumb.style.display = 'flex';
}
lbClose.addEventListener('click', closeLightbox);
lbBackdrop.addEventListener('click', closeLightbox);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ─── Language Toggle (DE / EN) ───
const langToggle = document.getElementById('lang-toggle');
const translations = {
  hero_h1: { de: 'Design,\ndas vermittelt.', en: 'Design that\ncommunicates.' },
  hero_sub: { de: 'Ich bin eine Designerin & Illustratorin mit einer Leidenschaft für E‑Learning, Character Design und visuelle Konzepte, die wirken.', en: 'I am a designer & illustrator, passionate about e‑learning, character design, and visual concepts that accomplish.' },
  cta_portfolio: { de: 'Meine Arbeiten →', en: 'My Work →' },
  about_label: { de: 'Über mich', en: 'About me' },
  about: { de: 'Über mich', en: 'About' },
  about_heading_prefix: { de: 'Hallo, ich bin', en: 'Hi, I am' },
  about_role: { de: 'Designerin · Illustratorin · Storytellerin', en: 'Designer · Illustrator · Storyteller' },
  about_p1: { de: 'Ich bringe Ideen visuell zum Leben – von verspielten Charakteren bis hin zu durchdachten Lernkonzepten. Meine Arbeit verbindet Ästhetik mit Funktion.', en: 'I bring ideas to life visually — from playful characters to well-considered learning concepts. My work combines aesthetics with function.' },
  about_p2: { de: 'Mit Erfahrung in Grafik, Illustration und Instructional Design helfe ich Unternehmen und Kreativen, ihre Geschichten auf einzigartige Weise zu erzählen.', en: 'With experience in graphic design, illustration and instructional design, I help companies and creatives tell their stories in unique ways.' },
  portfolio_label: { de: 'Ausgewählte Arbeiten', en: 'Selected Works' },
  portfolio: { de: 'Projekte', en: 'Portfolio' },
  portfolio_h2: { de: 'Projekte', en: 'Projects' },
  proj1_cat: { de: 'Instructional Design', en: 'Instructional Design' },
  proj1_title: { de: 'Screendesigns', en: 'Screen Designs' },
  proj1_desc: { de: 'E-Learning Screendesigns für Firmen und Themen aller Art. Ein kurzer Überblick über meine beruflichen Schwerpunkte der letzten Jahre.', en: 'E-learning screen designs for companies and various topics. A brief overview of my main focuses in recent years.' },
  proj2_cat: { de: 'Illustrationen', en: 'Illustrations' },
  proj2_title: { de: 'Character Design und Fanart', en: 'Character Design & Fan Art' },
  proj2_desc: { de: 'Ob im E-Learning-Kontext oder privat ist egal – Charaktere gestalten macht immer Spaß. Vom Menschen über Tiere bis zum Koffer ist alles dabei.', en: 'Whether in e-learning or private projects — designing characters is always fun. From people to animals and even inanimate objects.' },
  proj3_cat: { de: 'Print', en: 'Print' },
  proj3_title: { de: 'Druckpublikationen', en: 'Print Publications' },
  proj3_desc: { de: 'Ein paar klebrige Sticker, ein frisch gedrucktes Magazin, oder eine drei Meter hohe Messewand – Einfach schön, etwas Gestaltetes anfassen zu können.', en: 'Sticky stickers, a freshly printed magazine, or a three-meter exhibition wall — it’s lovely to hold a designed object in your hands.' },
  proj4_cat: { de: 'Soziales Engagement', en: 'Social Engagement' },
  proj4_title: { de: 'Mutismus Selbsthilfe Deutschland e.V.', en: 'Mutism Self-Help Germany' },
  proj4_desc: { de: 'Hier unterstütze ich in der Kommunikation durch Grafiken und als Setzerin für Prints wie Broschüren und Messewände.', en: 'I support communication through graphics and layout for printed materials like brochures and exhibition displays.' },
  proj5_cat: { de: 'Bewegtbild', en: 'Moving Images' },
  proj5_title: { de: 'Animationen & Videos', en: 'Animations & Videos' },
  proj5_desc: { de: 'Social Media Motion Designs und Erklärvideos in After Effects, Keyframe Animationen in Photoshop und KI-generierte Videos online und in Premiere: Das Thema Bewegtbild macht einfach Spaß und erweckt Inhalte zum Leben.', en: 'Social media motion graphics and educational videos in After Effects, keyframe animations in Photoshop, and AI-generated videos online and in Premiere: Working with moving images is just plain fun and brings content to life.' },
  proj6_cat: { de: 'Miscellaneous', en: 'Miscellaneous' },
  proj6_title: { de: 'Dies und Das aus dem Studium', en: 'Bits and Pieces from University' },
  proj6_desc: { de: 'Auch wenn es schon länger als fünf Jahre her ist, möchte ich hier trotzdem Projekte aus meiner Studienzeit zeigen, auf die ich heute noch ein bisschen Stolz bin.', en: 'Even though it’s been more than five years, I still want to show some university projects I’m proud of.' },
  skills_label: { de: 'Was ich mitbringe', en: 'What I Bring' },
  skills: { de: 'Skills', en: 'Skills' },
  skills_h2: { de: 'Skills & Tools', en: 'Skills & Tools' },
  skills_word_1: { de: 'Illustrieren', en: 'Illustration' },
  skills_word_2: { de: 'HTML & CSS', en: 'HTML & CSS' },
  skills_word_3: { de: 'Kreativität', en: 'Creativity' },
  skills_word_4: { de: 'Adobe Photoshop', en: 'Adobe Photoshop' },
  skills_word_5: { de: 'Design', en: 'Design' },
  skills_word_6: { de: 'Claude AI', en: 'Claude AI' },
  skills_word_7: { de: 'Barrierefreiheit', en: 'Accessibility' },
  skills_word_8: { de: 'Adobe Illustrator', en: 'Adobe Illustrator' },
  skills_word_9: { de: 'Teamplay', en: 'Teamwork' },
  skills_word_10: { de: 'Typesetting', en: 'Typesetting' },
  skills_word_11: { de: 'Firefly AI', en: 'Firefly AI' },
  skills_word_12: { de: 'Adobe After Effects', en: 'Adobe After Effects' },
  skills_word_13: { de: 'Problemlösungen', en: 'Problem solving' },
  skills_word_14: { de: 'HeyGen AI', en: 'HeyGen AI' },
  skills_word_15: { de: 'Adobe InDesign', en: 'Adobe InDesign' },
  skills_word_16: { de: 'ChatGPT AI', en: 'ChatGPT AI' },
  skills_word_17: { de: 'Durchblick', en: 'Clarity' },
  skills_word_18: { de: 'DE Muttersprache', en: 'Native German' },
  skills_word_19: { de: 'EN fließend', en: 'Fluent English' },
  contact_label: { de: 'Sag Hallo', en: 'Say Hello' },
  contact: { de: 'Kontakt', en: 'Contact' },
  contact_h2: { de: 'Lass uns etwas\nSchönes bauen.', en: 'Let’s build something\nbeautiful.' },
  contact_email: { de: 'E-Mail', en: 'Email' },
  contact_phone: { de: 'Telefon', en: 'Phone' },
  contact_address: { de: 'Adresse', en: 'Address' },
  contact_online: { de: 'Online', en: 'Online' },
  panorama_hint: { de: '🖱 Ziehen zum Umsehen · Scrollen zum Zoomen', en: '🖱 Drag to look · Scroll to zoom' },
  footer_text: { de: '© 2026 Miriam Frommer · Mit ♡ und Claude AI gestaltet · Alle Rechte vorbehalten.', en: '© 2026 Miriam Frommer · Designed with ♡ and AI · All rights reserved.' }
};

function applyLang(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const dict = translations[key];
    if (dict && dict[lang]) {
      if (el.tagName.toLowerCase() === 'h1' || el.tagName.toLowerCase() === 'h2') {
        el.innerHTML = dict[lang].replace(/\n/g, '<br>');
      } else {
        el.textContent = dict[lang];
      }
    }
  });

  document.querySelectorAll('.project-thumb').forEach(thumb => {
    if (!thumb.dataset.deCat) thumb.dataset.deCat = thumb.dataset.cat || '';
    if (!thumb.dataset.deTitle) thumb.dataset.deTitle = thumb.dataset.title || '';
    if (!thumb.dataset.deDescFull) thumb.dataset.deDescFull = thumb.dataset.descFull || thumb.dataset.desc || '';

    const useSuffix = lang === 'de' ? 'de' : 'en';
    const catKey = useSuffix + 'Cat';
    if (thumb.dataset[catKey]) thumb.dataset.cat = thumb.dataset[catKey];
    const titleKey = useSuffix + 'Title';
    if (thumb.dataset[titleKey]) thumb.dataset.title = thumb.dataset[titleKey];
    const descKey = useSuffix + 'DescFull';
    if (thumb.dataset[descKey]) thumb.dataset.descFull = thumb.dataset[descKey];
  });

  const hintLabel = document.querySelector('#panorama-hint');
  if (hintLabel && translations.panorama_hint) hintLabel.textContent = translations.panorama_hint[lang];

  if (langToggle) langToggle.textContent = lang === 'de' ? 'EN' : 'DE';
  try { localStorage.setItem('site-lang', lang); } catch (e) {}
  document.documentElement.lang = lang === 'de' ? 'de' : 'en';
}

if (langToggle) {
  langToggle.addEventListener('click', () => {
    const current = localStorage.getItem('site-lang') || 'de';
    const next = current === 'de' ? 'en' : 'de';
    applyLang(next);
  });
}

    (function() {
      const stored = localStorage.getItem('site-lang');
      // Default to German unless user explicitly chose otherwise
      applyLang(stored || 'de');
    })();
