/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Datacom site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html
 * (source: https://datacom.com/au/en/insights/articles/why-technology-supply-chains-remain-under-pressure).
 *
 * Keeps authorable content: article cover (read time, h1, description,
 * author byline + avatar), cover image, article body, related tags, Discover more gallery.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / widgets that could interfere with block parsing.
    WebImporter.DOMUtils.remove(element, [
      // OneTrust cookie consent: <div id="onetrust-consent-sdk">
      '#onetrust-consent-sdk',
      // Sticky header tabs bar (duplicate title + Marketo "Connect with an expert" modal):
      // <div class="sticky-header tabs panelcontainer ...">
      '.sticky-header',
      // Reading progress bar: <div class="page-scroll-indicator ...">
      '.page-scroll-indicator',
      // Social share / clap widgets: <div class="article-cover__social-media-ctn">,
      // <div class="article-body__social-media-ctn"> (both wrap .social-shares-claps__ctn)
      '.article-cover__social-media-ctn',
      '.article-body__social-media-ctn',
      '.social-shares-claps__ctn',
      // Marketo / reCAPTCHA leftovers at body root
      'form.mktoForm',
      '#mktoStyleLoaded',
      '.grecaptcha-badge',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Header + mega nav + site-update alert banner:
      // <div class="header-mega ..."><header class="cmp-header-mega">
      //   <div class="datacom cmp-header-mega__alert-banner">...
      '.header-mega',
      'header.cmp-header-mega',
      '.cmp-header-mega-overlay',
      '.cmp-alert-banner__ctn',
      // Footer: <footer class="footer aem-GridColumn ...">
      'footer.footer',
      // Empty embedded video placeholder: <div class="embedded-video ..."> </div>
      '.embedded-video',
      // Empty spacer: <div class="ghost aem-GridColumn ...">
      '.ghost',
      // Decorative clock icon before read time: <i class="fal fa-clock">
      '.article-cover__top-row i.fa-clock',
      // Tracking / cross-domain iframes
      '#destination_publishing_iframe_datacom_0',
      '#MktoForms2XDIframe',
      '[id^="batBeacon"]',
      // Twitter/X ad pixels (consent-gated 1x1 imgs): <img height="1" width="1" data-src="https://t.co/i/adsct...">
      'img[height="1"][width="1"]',
      'img[src*="/i/adsct"]',
      // Safe generic removals
      'iframe',
      'link',
      'noscript',
      'script',
      'style',
      'source',
    ]);
  }
}
