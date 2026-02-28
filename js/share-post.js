/**
 * Share Post — frontend module
 * Opens the Indiekit share form in a popup window for creating posts
 * from blogroll, podroll, and news page items.
 * Only active when user is logged in (body[data-indiekit-auth="true"]).
 */
(function () {
  function isLoggedIn() {
    return document.body.getAttribute('data-indiekit-auth') === 'true';
  }

  function openSharePopup(button) {
    var url = button.dataset.shareUrl;
    var title = button.dataset.shareTitle || '';
    var type = button.dataset.shareType || 'note';
    if (!url) return;

    var shareUrl = '/share/bookmarklet'
      + '?name=' + encodeURIComponent(title)
      + '&url=' + encodeURIComponent(url)
      + '&type=' + encodeURIComponent(type);

    window.open(
      shareUrl,
      'Sharer',
      'resizable,scrollbars,status=0,toolbar=0,menubar=0,titlebar=0,width=578,height=720,location=0'
    );
  }

  document.addEventListener('click', function (e) {
    if (!isLoggedIn()) return;
    var button = e.target.closest('.share-post-btn');
    if (button) {
      e.preventDefault();
      openSharePopup(button);
    }
  });
})();
