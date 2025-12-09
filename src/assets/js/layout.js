$(function () {
  /**
   * ============================================
   * 導航
   * ============================================
   */
  // 下滾動態改變導航顏色
  const navTransparentFlag = Boolean($('#nav-transparent-flag')[0]);
  const $navbar = $('#navbar');
  const $mobileNav = $('#mobile-nav');

  if (navTransparentFlag) {
    $navbar.addClass('bg-transparent transition-colors');
    function onScroll() {
      if ($(window).scrollTop() > 10) {
        $navbar.addClass('bg-white shadow-md');
      } else {
        $navbar.removeClass('bg-white shadow-md');
      }
    }
    $(window).on('scroll', onScroll);
    onScroll();
  } else {
    $navbar.addClass('bg-white shadow-md');
  }

  // toggle 選單
  $('#toggle-nav-btn').on('click', function (e) {
    e.preventDefault();
    $navbar.addClass('bg-white');
    $mobileNav.toggleClass('grid-rows-[0fr] grid-rows-[1fr]');
    $mobileNav.toggleClass('shadow-md');

    if ($(window).scrollTop() < 10 && $mobileNav.hasClass('grid-rows-[0fr]')) {
      $navbar.removeClass('bg-white');
    }
  });
});
