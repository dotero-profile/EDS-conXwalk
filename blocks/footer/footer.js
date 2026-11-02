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
    parameter: 'text',
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
      if (!image.getAttribute('src')) {
        image.src = codePath(`/icons/${file}`);
        if (image === companyLogo) {
          const mobileLogo = document.createElement('source');
          mobileLogo.media = '(max-width: 767px)';
          mobileLogo.srcset = codePath('/icons/mutua-madrilena-mark.svg');
          image.closest('picture')?.prepend(mobileLogo);
        }
      }
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

function configureCopyright(block) {
  const copyright = [...block.querySelectorAll('.default-content-wrapper')]
    .find((element) => element.textContent.trim().startsWith('©'));
  if (copyright) copyright.classList.add('footer-copyright');
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
          status.textContent = 'Enlace copiado al portapapeles';
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

function configureMobileGroups(block) {
  const mobileViewport = window.matchMedia('(max-width: 767px)');
  block.querySelectorAll('.columns-4-cols > div > div:not(.footer-social) > ul > li').forEach((group) => {
    const list = group.querySelector(':scope > ul');
    if (!list) return;

    group.classList.add('footer-link-group');
    const heading = [...group.children].find((child) => child.tagName !== 'UL');
    const toggle = document.createElement('button');
    toggle.className = 'footer-link-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', `Mostrar enlaces de ${heading?.textContent.trim() || 'esta sección'}`);

    const syncList = (expanded) => {
      if (!mobileViewport.matches) {
        list.style.maxHeight = '';
        list.style.marginTop = '';
        list.inert = false;
        list.removeAttribute('aria-hidden');
        return;
      }

      list.inert = !expanded;
      list.setAttribute('aria-hidden', String(!expanded));
      list.style.maxHeight = expanded ? `${list.scrollHeight + 30}px` : '0px';
      list.style.marginTop = expanded ? '20px' : '0';
    };

    toggle.addEventListener('click', () => {
      const expanded = group.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(expanded));
      syncList(expanded);
    });
    group.append(toggle);
    syncList(false);
    mobileViewport.addEventListener('change', () => syncList(group.classList.contains('is-open')));
    window.addEventListener('resize', () => {
      if (group.classList.contains('is-open')) syncList(true);
    });
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
  configureMobileGroups(block);
  configureCopyright(block);
}
