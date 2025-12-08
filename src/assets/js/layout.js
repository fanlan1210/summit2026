$(function () {
  /**
   * ============================================
   * 導航
   * ============================================
   */
  // 下滾動態改變導航顏色
  const navbarEl = $('#navbar');
  function onScroll() {
    $(window).scrollTop() > 10 ? navbarEl.addClass('bg-white') : navbarEl.removeClass('bg-white');
  }
  $(window).on('scroll', onScroll);
  onScroll();

  // toggle 選單
  $('#toggle-nav-btn').on('click', function (e) {
    e.preventDefault();
    $('#mobile-nav').toggleClass('grid-rows-[0fr] grid-rows-[1fr]');
  });
});
