import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // Load the authored footer fragment.
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  if (!fragment) return;

  // Keep the fragment content inside the footer block.
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);
  block.append(footer);

  // Social buttons should link to the share endpoint; this adds the current page URL.
  const pageURL = new URL(window.location.href);
  pageURL.hash = '';
  const shareEndpoints = [
    { host: 'facebook.com', path: '/sharer/sharer.php', parameter: 'u' },
    { host: 'linkedin.com', path: '/sharing/share-offsite/', parameter: 'url' },
    { host: 'twitter.com', path: '/intent/tweet', parameter: 'url' },
    { host: 'x.com', path: '/intent/post', parameter: 'url' },
  ];

  block.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');

    if (href === '#copy-url') {
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

        try {
          await navigator.clipboard.writeText(pageURL.href);
          status.textContent = 'Enlace copiado';
      } catch {
          status.textContent = 'No se pudo copiar el enlace';
        }
      });
      return;
    }

    try {
      const shareURL = new URL(href, window.location.href);
      const endpoint = shareEndpoints.find(({ host, path }) => (
        (shareURL.hostname === host || shareURL.hostname.endsWith(`.${host}`))
        && shareURL.pathname === path
      ));

      if (endpoint) {
        shareURL.searchParams.set(endpoint.parameter, pageURL.href);
        link.href = shareURL.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    } catch {
      // Ignore non-URL links and leave them as authored.
    }
  });
}
