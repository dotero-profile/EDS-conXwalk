import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const socialLinks = [
  {
    name: 'Facebook',
    icon: 'footer-facebook.svg',
    host: 'facebook.com',
    path: '/sharer/sharer.php',
    parameter: 'u',
  },
  {
    name: 'LinkedIn',
    icon: 'footer-linkedin.svg',
    host: 'linkedin.com',
    path: '/sharing/share-offsite/',
    parameter: 'url',
  },
  {
    name: 'X',
    icon: 'footer-x.svg',
    host: 'twitter.com',
    path: '/intent/tweet',
    parameter: 'url',
  },
  {
    name: 'Copiar enlace',
    icon: 'footer-copy-link.svg',
    copy: true,
  },
];

function codePath(path) {
  return `${window.hlx.codeBasePath || ''}${path}`;
}

function configureLogos(block) {
  const logos = block.querySelector('.columns-3-cols');
  if (!logos) return;

  const [blogLogo, , companyLogo] = logos.querySelectorAll('img');
  [[blogLogo, 'mutua-blog-logo.svg', 'ON Blog Mutua'], [companyLogo, 'mutua-madrilena-logo.svg', 'Mutua Madrileña']]
    .forEach(([image, file, alt]) => {
      if (!image) return;
      if (!image.getAttribute('src')) image.src = codePath(`/icons/${file}`);
      if (!image.alt) image.alt = alt;
    });

  const claim = logos.querySelector('p');
  if (claim) claim.classList.add('footer-claim');
}

function configureBreadcrumb(block) {
  const breadcrumb = [...block.querySelectorAll('.default-content-wrapper')]
    .find((element) => element.textContent.trim().toLowerCase() === 'breadcrumb');
  if (!breadcrumb) return;

  const link = document.createElement('a');
  link.href = '/blog/';
  link.textContent = 'Inicio';
  breadcrumb.replaceChildren(link);
  breadcrumb.classList.add('footer-breadcrumb');
}

function configureSocial(block) {
  const columns = block.querySelector('.columns-4-cols');
  const column = columns?.lastElementChild?.lastElementChild;
  if (!column) return;

  column.classList.add('footer-social');
  const links = [...column.querySelectorAll('a')];
  links.forEach((link, index) => {
    const item = socialLinks[index];
    if (!item) return;

    link.setAttribute('aria-label', item.name);
    link.title = item.name;
    link.replaceChildren(Object.assign(document.createElement('img'), {
      src: codePath(`/icons/${item.icon}`),
      alt: '',
      'aria-hidden': 'true',
    }));

    if (item.copy) {
      link.href = '#copy-url';
      link.addEventListener('click', async (event) => {
        event.preventDefault();
        let status = block.querySelector('.footer-copy-status');
        if (!status) {
          status = document.createElement('span');
          status.className = 'footer-copy-status';
          status.setAttribute('role', 'status');
          status.setAttribute('aria-live', 'polite');
          link.insertAdjacentElement('afterend', status);
        }

        const pageURL = new URL(window.location.href);
        pageURL.hash = '';
        try {
          await navigator.clipboard.writeText(pageURL.href);
          status.textContent = 'Enlace copiado';
        } catch {
          status.textContent = 'No se pudo copiar el enlace';
        }
      });
      return;
    }

    const shareURL = new URL(`https://${item.host}${item.path}`);
    const pageURL = new URL(window.location.href);
    pageURL.hash = '';
    shareURL.searchParams.set(item.parameter, pageURL.href);
    link.href = shareURL.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
}

/** Load and decorate the authored footer fragment.
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;

  block.textContent = '';
  const content = document.createElement('div');
  while (fragment.firstElementChild) content.append(fragment.firstElementChild);
  block.append(content);

  // Remove temporary text left in the footer fragment during local authoring.
  [...block.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).forEach((node) => {
    if (/^(hello world!|hola mundo!)$/i.test(node.textContent.trim())) node.remove();
  });

  configureLogos(block);
  configureBreadcrumb(block);
  configureSocial(block);
}
