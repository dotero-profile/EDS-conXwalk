import { moveInstrumentation } from '../../scripts/scripts.js';

const SOCIAL_NETWORKS = [
  { name: 'Facebook', className: 'facebook', icon: '/icons/footer-facebook.svg' },
  { name: 'LinkedIn', className: 'linkedin', icon: '/icons/footer-linkedin.svg' },
  { name: 'X', className: 'twitter', icon: '/icons/footer-x.svg' },
  {
    name: 'Copiar enlace', className: 'copy-link', icon: '/icons/footer-copy-link.svg', copy: true,
  },
];

function makeShareUrl(network) {
  const pageUrl = encodeURIComponent(window.location.href);
  const endpoints = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${pageUrl}`,
  };
  return endpoints[network];
}

function getRowColumns(row) {
  return row ? [...row.querySelectorAll(':scope > div > div')] : [];
}

function buildSocialNav(socialColumn) {
  const nav = document.createElement('nav');
  nav.className = 'social vertical';
  nav.setAttribute('aria-label', 'Redes sociales');

  const authoredLinks = socialColumn ? [...socialColumn.querySelectorAll('a')] : [];
  const list = document.createElement('ul');

  SOCIAL_NETWORKS.forEach((network, index) => {
    const item = document.createElement('li');
    const link = authoredLinks[index] || document.createElement('a');
    link.className = network.className;
    link.title = network.name;
    link.setAttribute('aria-label', network.name);

    if (network.copy) {
      link.href = '#copy-url';
      link.setAttribute('role', 'button');
      link.addEventListener('click', (event) => {
        event.preventDefault();
        if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
      });
    } else {
      link.href = makeShareUrl(network.className);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }

    const icon = document.createElement('img');
    icon.src = network.icon;
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    link.replaceChildren(icon);
    item.append(link);
    list.append(item);
  });

  nav.append(list);
  return nav;
}

function buildLogoLink(column, { company = false } = {}) {
  const link = document.createElement('a');
  link.className = company ? 'company-logo' : 'logo';
  link.href = company ? 'https://www.mutua.es/' : '/';

  if (company) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = 'Se abre en nueva pestaña';
  } else {
    link.rel = 'home';
  }
  if (column) moveInstrumentation(column, link);

  const authoredImages = column ? [...column.querySelectorAll('img')] : [];
  const desktopImage = authoredImages[0] || document.createElement('img');
  const desktopSource = desktopImage.getAttribute('src');
  if (!desktopSource || desktopSource.includes('about:error')) {
    desktopImage.src = company ? '/icons/mutua-madrilena-logo.svg' : '/icons/mutua-blog-logo.svg';
  }
  desktopImage.alt = company ? 'Logotipo Mutua Madrileña' : 'Logotipo ON';

  if (company) desktopImage.classList.add('only-desktop');
  link.append(desktopImage);

  if (company) {
    const mobileImage = authoredImages[1] || document.createElement('img');
    const mobileSource = mobileImage.getAttribute('src');
    if (!mobileSource || mobileSource.includes('about:error')) mobileImage.src = '/icons/mutua-madrilena-mark.svg';
    mobileImage.alt = 'Logotipo Mutua Madrileña';
    mobileImage.classList.add('only-mobile');
    link.append(mobileImage);
  }

  return link;
}

function buildFooterMenu(row) {
  const columns = getRowColumns(row);
  const nav = document.createElement('nav');
  nav.className = 'footer-menu content';
  nav.setAttribute('aria-label', 'Menú secundario');

  const links = document.createElement('ul');
  links.className = 'lst-links';

  columns.slice(0, 3).forEach((column) => {
    const section = document.createElement('li');
    section.className = 'section';

    const heading = column.querySelector('strong, h2, h3, h4, :scope > p');
    const title = document.createElement('button');
    title.className = 'section-toggle';
    title.type = 'button';
    title.setAttribute('aria-expanded', 'false');
    title.textContent = heading?.textContent.trim() || '';

    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.setAttribute('aria-hidden', 'true');
    title.append(arrow);
    section.append(title);

    const list = column.querySelector('ul ul') || column.querySelector('ul');
    if (list) {
      moveInstrumentation(column, section);
      list.classList.add('section-links');
      section.append(list);
    }

    const mobileView = window.matchMedia('(max-width: 767px)');
    const setExpandedState = () => {
      const collapsed = mobileView.matches;
      title.setAttribute('aria-expanded', String(!collapsed));
      section.classList.toggle('is-open', !collapsed);
      if (list) {
        list.inert = collapsed;
        list.setAttribute('aria-hidden', String(collapsed));
        list.style.maxHeight = collapsed ? '0px' : '';
      }
    };
    setExpandedState();
    mobileView.addEventListener('change', setExpandedState);

    title.addEventListener('click', () => {
      if (!mobileView.matches) return;
      const expanded = title.getAttribute('aria-expanded') === 'true';
      title.setAttribute('aria-expanded', String(!expanded));
      section.classList.toggle('is-open', !expanded);
      if (list) {
        list.inert = expanded;
        list.setAttribute('aria-hidden', String(expanded));
        list.style.maxHeight = expanded ? '0px' : `${list.scrollHeight}px`;
      }
    });

    links.append(section);
  });

  nav.append(links);
  nav.append(buildSocialNav(columns[3]));
  return nav;
}

export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > .columns')];
  const paragraphRows = [...block.querySelectorAll(':scope > p')];
  const footer = document.createElement('footer');
  footer.id = 'footer-page';
  footer.setAttribute('role', 'contentinfo');

  const logoColumns = getRowColumns(rows[0]);
  if (rows[0]) {
    const logos = document.createElement('div');
    logos.className = 'content-logos';
    logos.append(buildLogoLink(logoColumns[0]));

    const claim = document.createElement('span');
    claim.className = 'claim';
    claim.textContent = logoColumns[1]?.textContent.trim() || 'Encendiendo el futuro de las personas';
    if (logoColumns[1]) moveInstrumentation(logoColumns[1], claim);
    logos.append(claim);
    logos.append(buildLogoLink(logoColumns[2], { company: true }));
    footer.append(logos);
  }

  const breadcrumb = document.createElement('nav');
  breadcrumb.className = 'breadcrumb';
  breadcrumb.setAttribute('aria-label', 'Enlaces de ayuda a la navegación');
  const breadcrumbText = document.createElement('span');
  breadcrumbText.className = 'sr-only';
  breadcrumbText.textContent = 'Estás en:';
  const breadcrumbList = document.createElement('ul');
  breadcrumbList.className = 'content';
  const breadcrumbItem = document.createElement('li');
  breadcrumbItem.textContent = paragraphRows[0]?.textContent.trim() || 'Inicio';
  if (paragraphRows[0]) moveInstrumentation(paragraphRows[0], breadcrumbItem);
  breadcrumbList.append(breadcrumbItem);
  breadcrumb.append(breadcrumbText, breadcrumbList);
  footer.append(breadcrumb);

  if (rows[1]) footer.append(buildFooterMenu(rows[1]));

  const copyright = document.createElement('div');
  copyright.className = 'copyright';
  if (rows[2]) {
    const legalNav = document.createElement('nav');
    legalNav.className = 'legales';
    legalNav.setAttribute('aria-label', 'Enlaces legales');
    const legalList = document.createElement('ul');
    rows[2].querySelectorAll('a').forEach((link) => {
      const item = document.createElement('li');
      item.append(link);
      legalList.append(item);
    });
    legalNav.append(legalList);
    copyright.append(legalNav);
  }

  const authoredCopyright = paragraphRows[1];
  if (authoredCopyright) {
    const text = document.createElement('p');
    const copyrightValue = authoredCopyright.textContent.trim();
    const accessibleLabel = document.createElement('span');
    accessibleLabel.className = 'sr-only';
    accessibleLabel.lang = 'en';
    accessibleLabel.textContent = 'Copyright';
    const copyrightMark = document.createElement('abbr');
    copyrightMark.title = 'Copyright';
    copyrightMark.lang = 'en';
    copyrightMark.textContent = '©';
    text.append(accessibleLabel, ' ', copyrightMark, ' ', copyrightValue.replace(/^©\s*/, ''));
    moveInstrumentation(authoredCopyright, text);
    copyright.append(text);
  }
  footer.append(copyright);
  block.replaceChildren(footer);
}
