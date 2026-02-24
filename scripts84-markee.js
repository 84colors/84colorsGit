// MARQUEE POWER-UP
window.addEventListener("DOMContentLoaded", (event) => {
  // attribute value checker
  function attr(defaultVal, attrVal) {
    const defaultValType = typeof defaultVal;
    if (typeof attrVal !== "string" || attrVal.trim() === "") return defaultVal;
    if (attrVal === "true" && defaultValType === "boolean") return true;
    if (attrVal === "false" && defaultValType === "boolean") return false;
    if (isNaN(attrVal) && defaultValType === "string") return attrVal;
    if (!isNaN(attrVal) && defaultValType === "number") return +attrVal;
    return defaultVal;
  }
  // marquee component
  $("[tr-marquee-element='component']").each(function (index) {
    let componentEl = $(this),
      panelEl = componentEl.find("[tr-marquee-element='panel']"),
      triggerHoverEl = componentEl.find("[tr-marquee-element='triggerhover']"),
      triggerClickEl = componentEl.find("[tr-marquee-element='triggerclick']");
    let speedSetting = attr(100, componentEl.attr("tr-marquee-speed")),
      verticalSetting = attr(false, componentEl.attr("tr-marquee-vertical")),
      reverseSetting = attr(false, componentEl.attr("tr-marquee-reverse")),
      scrollDirectionSetting = attr(
        false,
        componentEl.attr("tr-marquee-scrolldirection")
      ),
      scrollScrubSetting = attr(
        false,
        componentEl.attr("tr-marquee-scrollscrub")
      ),
      moveDistanceSetting = -100,
      timeScaleSetting = 1,
      pausedStateSetting = false;
    if (reverseSetting) moveDistanceSetting = 100;
    let marqueeTimeline = gsap.timeline({
      repeat: -1,
      onReverseComplete: () => marqueeTimeline.progress(1)
    });
    if (verticalSetting) {
      speedSetting = panelEl.first().height() / speedSetting;
      marqueeTimeline.fromTo(
        panelEl,
        { yPercent: 0 },
        { yPercent: moveDistanceSetting, ease: "none", duration: speedSetting }
      );
    } else {
      speedSetting = panelEl.first().width() / speedSetting;
      marqueeTimeline.fromTo(
        panelEl,
        { xPercent: 0 },
        { xPercent: moveDistanceSetting, ease: "none", duration: speedSetting }
      );
    }
    let scrubObject = { value: 1 };
    ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (!pausedStateSetting) {
          if (scrollDirectionSetting && timeScaleSetting !== self.direction) {
            timeScaleSetting = self.direction;
            marqueeTimeline.timeScale(self.direction);
          }
          if (scrollScrubSetting) {
            let v = self.getVelocity() * 0.006;
            v = gsap.utils.clamp(-60, 60, v);
            let scrubTimeline = gsap.timeline({
              onUpdate: () => marqueeTimeline.timeScale(scrubObject.value)
            });
            scrubTimeline.fromTo(
              scrubObject,
              { value: v },
              { value: timeScaleSetting, duration: 0.5 }
            );
          }
        }
      }
    });
    function pauseMarquee(isPausing) {
      pausedStateSetting = isPausing;
      let pauseObject = { value: 1 };
      let pauseTimeline = gsap.timeline({
        onUpdate: () => marqueeTimeline.timeScale(pauseObject.value)
      });
      if (isPausing) {
        pauseTimeline.fromTo(
          pauseObject,
          { value: timeScaleSetting },
          { value: 0, duration: 0.5 }
        );
        triggerClickEl.addClass("is-paused");
      } else {
        pauseTimeline.fromTo(
          pauseObject,
          { value: 0 },
          { value: timeScaleSetting, duration: 0.5 }
        );
        triggerClickEl.removeClass("is-paused");
      }
    }
    if (window.matchMedia("(pointer: fine)").matches) {
      triggerHoverEl.on("mouseenter", () => pauseMarquee(true));
      triggerHoverEl.on("mouseleave", () => pauseMarquee(false));
    }
    triggerClickEl.on("click", function () {
      !$(this).hasClass("is-paused") ? pauseMarquee(true) : pauseMarquee(false);
    });
  });
});

//Lightbox
// AJAX MODAL POWER-UP
window.addEventListener("DOMContentLoaded", (event) => {
  // ajaxmodal component
  function adjaxModal() {
    let lightbox = $("[tr-ajaxmodal-element='lightbox']");
    let lightboxClose = $("[tr-ajaxmodal-element='lightbox-close']").attr(
      "aria-label",
      "Close Modal"
    );
    let lightboxModal = $("[tr-ajaxmodal-element='lightbox-modal']");
    let cmsLink = "[tr-ajaxmodal-element='cms-link']";
    let cmsPageContent = "[tr-ajaxmodal-element='cms-page-content']";
    let initialPageTitle = document.title;
    let initialPageUrl = window.location.href;
    let focusedLink;

    function updatePageInfo(newTitle, newUrl) {
      lightboxModal.empty();
      document.title = newTitle;
      window.history.replaceState({}, "", newUrl);
    }

    let tl = gsap.timeline({
      paused: true,
      onReverseComplete: () => {
        focusedLink.focus();
        updatePageInfo(initialPageTitle, initialPageUrl);
      },
      onComplete: () => {
        lightboxClose.focus();
      }
    });
    tl.set("body, html", { overflow: "hidden" });
    tl.set(lightbox, {
      display: "block",
      onComplete: () => lightboxModal.scrollTop(0)
    });
    tl.from(lightbox, { opacity: 0, duration: 0.2 });
    tl.from(lightboxModal, { y: "5em", duration: 0.2 }, "<");

    function keepFocusWithinLightbox() {
      let lastFocusableChild = lightbox
        .find(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        )
        .not(":disabled")
        .not("[aria-hidden=true]")
        .last();
      lastFocusableChild.on("focusout", function () {
        lightboxClose.focus();
      });
    }

    function lightboxReady() {
      // your code here
    }

    $(document).on("click", cmsLink, function (e) {
      focusedLink = $(this);
      initialPageUrl = window.location.href;
      e.preventDefault();
      let linkUrl = $(this).attr("href");
      $.ajax({
        url: linkUrl,
        success: function (response) {
          let cmsContent = $(response).find(cmsPageContent);
          let cmsTitle = $(response).filter("title").text();
          let cmsUrl = window.location.origin + linkUrl;
          updatePageInfo(cmsTitle, cmsUrl);
          lightboxModal.append(cmsContent);
          tl.play();
          keepFocusWithinLightbox();
          lightboxReady();
        }
      });
    });

    lightboxClose.on("click", function () {
      tl.reverse();
    });
    $(document).on("keydown", function (e) {
      if (e.key === "Escape") tl.reverse();
    });
    $(document).on("click", lightbox, function (e) {
      if (!$(e.target).is(lightbox.find("*"))) tl.reverse();
    });
  }
  adjaxModal();
});
