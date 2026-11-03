import { moveInstrumentation } from '../../scripts/scripts.js';

const SOCIAL_NETWORKS = [
  { name: 'Facebook', class: 'facebook', icon: '/icons/icoFacebook.svg' },
  { name: 'LinkedIn', class: 'linkedin', icon: '/icons/icoLinkedin.svg' },
  { name: 'X', class: 'twitter', icon: '/icons/icoX.svg' },
  {
    name: 'Copiar enlace', class: 'copyLink', icon: '/icons/icoLink.svg', copy: true,
  },
];

export default function decorate(block) {
  // Capturamos las secciones principales que vienen del .plain.html
  const columnsList = block.querySelectorAll(':scope > .columns');
  const logosRow = columnsList[0];
  const breadcrumbPara = block.querySelector(':scope > p');
  const mainContentRow = columnsList[1];
  const legalRow = columnsList[2];
  const copyrightPara = block.querySelectorAll(':scope > p')[1] || block.querySelector(':scope > p:last-child');

  // --- CONTENEDOR PRINCIPAL ---
  const footerNode = document.createElement('footer');
  footerNode.id = 'footer-page';
  footerNode.setAttribute('role', 'contentinfo');

  // --- 1. CABECERA: LOGOS Y CLAIM ---
  if (logosRow) {
    const contentLogos = document.createElement('div');
    contentLogos.className = 'content-logos';

    const [imgCol1, claimCol, imgCol2] = logosRow.querySelectorAll(':scope > div > div');

    // Logo ON
    const logoONLink = document.createElement('a');
    logoONLink.href = '/';
    logoONLink.className = 'logo';
    logoONLink.setAttribute('rel', 'home');
    const imgON = imgCol1?.querySelector('img');
    if (imgON) {
      if (!imgON.src || imgON.src.includes('about:error')) imgON.src = '/icons/logo.svg';
      imgON.alt = imgON.alt || 'Logotipo ON';
      logoONLink.append(imgON);
    }
    contentLogos.append(logoONLink);

    // Claim
    if (claimCol) {
      const claimSpan = document.createElement('span');
      claimSpan.className = 'claim';
      claimSpan.textContent = claimCol.textContent.trim();
      moveInstrumentation(claimCol, claimSpan);
      contentLogos.append(claimSpan);
    }

    // Logo Mutua Madrileña
    const logoMMLink = document.createElement('a');
    logoMMLink.href = 'https://www.mutua.es/';
    logoMMLink.target = '_blank';
    logoMMLink.rel = 'noopener noreferrer';
    logoMMLink.title = 'Se abre en nueva pestaña';
    const imgMM = imgCol2?.querySelector('img');
    if (imgMM) {
      if (!imgMM.src || imgMM.src.includes('about:error')) imgMM.src = '/icons/logoMM.svg';
      imgMM.alt = imgMM.alt || 'Logotipo Mutua Madrileña';
      logoMMLink.append(imgMM);
    }
    contentLogos.append(logoMMLink);

    footerNode.append(contentLogos);
  }

  // --- 2. BREADCRUMB ---
  const breadcrumbNav = document.createElement('nav');
  breadcrumbNav.className = 'breadcrumb';
  breadcrumbNav.setAttribute('role', 'navigation');
  breadcrumbNav.setAttribute('aria-label', 'Enlaces de ayuda a la navegación');

  const breadcrumbContent = document.createElement('ul');
  breadcrumbContent.className = 'content';
  const breadcrumbItem = document.createElement('li');
  breadcrumbItem.textContent = breadcrumbPara ? breadcrumbPara.textContent.trim() : 'Inicio';
  if (breadcrumbPara) moveInstrumentation(breadcrumbPara, breadcrumbItem);
  breadcrumbContent.append(breadcrumbItem);

  breadcrumbNav.innerHTML = '<span class="sr-only">Estás en:</span>';
  breadcrumbNav.append(breadcrumbContent);
  footerNode.append(breadcrumbNav);

  // --- 3. MENÚ PRINCIPAL Y REDES SOCIALES ---
  if (mainContentRow) {
    const footerMenu = document.createElement('nav');
    footerMenu.className = 'footer-menu content';
    footerMenu.setAttribute('role', 'navigation');
    footerMenu.setAttribute('aria-label', 'Menú secundario');

    const lstLinks = document.createElement('ul');
    lstLinks.className = 'lst-links';

    const columns = mainContentRow.querySelectorAll(':scope > div > div');

    // Procesamos las 3 columnas de listas (Categorías, Productos, Otras páginas)
    for (let i = 0; i < Math.min(3, columns.length); i += 1) {
      const col = columns[i];
      const sectionLi = document.createElement('li');
      sectionLi.className = 'section';

      const titleHeader = col.querySelector('strong')?.textContent.trim() || '';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'section-title';
      titleSpan.textContent = titleHeader;

      const arrowSpan = document.createElement('span');
      arrowSpan.className = 'arrow';

      sectionLi.append(titleSpan);
      sectionLi.append(arrowSpan);

      // Desplegable en móvil
      sectionLi.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sectionLi.classList.toggle('is-open');
        }
      });

      const innerUl = col.querySelector('ul ul') || col.querySelector('ul');
      if (innerUl) {
        moveInstrumentation(col, sectionLi);
        sectionLi.append(innerUl);
      }

      lstLinks.append(sectionLi);
    }

    footerMenu.append(lstLinks);

    // Columna 4: Redes Sociales
    const socialCol = columns[3];
    const socialNav = document.createElement('nav');
    socialNav.className = 'social vertical';
    socialNav.setAttribute('aria-label', 'Redes Sociales');
    socialNav.setAttribute('role', 'region');

    const socialUl = document.createElement('ul');
    const authoredLinks = socialCol ? [...socialCol.querySelectorAll('a')] : [];

    SOCIAL_NETWORKS.forEach((net, index) => {
      const li = document.createElement('li');
      const a = authoredLinks[index] || document.createElement('a');

      a.className = net.class;
      a.title = net.name;

      if (net.copy) {
        a.href = '#copy-url';
        a.addEventListener('click', (e) => {
          e.preventDefault();
          navigator.clipboard.writeText(window.location.href);
        });
      } else {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }

      const iconImg = document.createElement('img');
      iconImg.src = net.icon;
      iconImg.alt = net.name;
      a.replaceChildren(iconImg);

      li.append(a);
      socialUl.append(li);
    });

    socialNav.append(socialUl);
    footerMenu.append(socialNav);
    footerNode.append(footerMenu);
  }

  // --- 4. COPYRIGHT Y LEGALES ---
  const copyrightDiv = document.createElement('div');
  copyrightDiv.className = 'copyright';

  if (legalRow) {
    const legalesNav = document.createElement('nav');
    legalesNav.className = 'legales';
    const legalUl = document.createElement('ul');

    const legalLinks = legalRow.querySelectorAll('a');
    legalLinks.forEach((link) => {
      const li = document.createElement('li');
      li.append(link);
      legalUl.append(li);
    });

    legalesNav.append(legalUl);
    copyrightDiv.append(legalesNav);
  }

  if (copyrightPara) {
    const copyP = document.createElement('p');
    copyP.textContent = copyrightPara.textContent.trim();
    moveInstrumentation(copyrightPara, copyP);
    copyrightDiv.append(copyP);
  }

  // Reemplazamos el contenedor del bloque manteniendo viva la autoría
  block.replaceChildren(footerNode);
}
