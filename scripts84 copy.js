//84Colors GSAP animations
gsap.registerPlugin(ScrollTrigger);

// ----------------------------
//Logo Spin
// ----------------------------

let navLogo = $(".nav-logo");
let logoSpin = gsap.to(navLogo, {
  rotation: 360,
  duration: 3,
  ease: "linear",
  repeat: -1
});

logoSpin.pause();

$(".logo-wrap").on("mouseenter", function () {
  logoSpin.play();
});

$(".logo-wrap").on("mouseleave", function () {
  logoSpin.pause();
});

// ----------------------------
//Navigation Hover text split
// ----------------------------

const navText = new SplitType("[hoverstagger='text']", { types: "char" });

$("[hoverstagger='link']").each(function (index) {
  let text1 = $(this).find("[hoverstagger='text']").eq(0);
  let text2 = $(this).find("[hoverstagger='text']").eq(1);

  let tl = gsap.timeline({ paused: true });

  tl.to(text1.find(".char"), {
    y: "-100%",
    duration: 0.3,
    stagger: { amount: 0.1 }
  });
  tl.from(
    text2.find(".char"),
    {
      y: "100%",
      duration: 0.3,
      stagger: { amount: 0.1 }
    },
    0
  );

  $(this).on("mouseenter", function () {
    tl.restart();
  });
  $(this).on("mouseleave", function () {
    tl.reverse();
  });
});

//Animate nav dot
$("[nav-dot]").each(function (index) {
  let tl = gsap.timeline({ paused: true });

  tl.to($(this), {
    y: -3,
    duration: 0.3,
    ease: "power3.out"
  });
  tl.to(
    $(this).find(".dot-nav"),
    {
      opacity: 1,
      y: -10,
      duration: 0.3,
      ease: "power3.out"
    },
    0
  );

  $(this).on("mouseenter", function () {
    tl.restart();
  });
  $(this).on("mouseleave", function () {
    tl.reverse();
  });
});

//Animate button arrow
$(".btn-arrow").each(function (index) {
  let tlArrow = gsap.timeline({ paused: true });
  tlArrow.to(
    $(this).find(".btn-text-wrap"),
    {
      x: 10,
      duration: 0.3,
      ease: "power2.out"
    },
    0
  );
  tlArrow.to(
    $(this).find(".btn-arrow-img"),
    {
      x: 15,
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    },
    0
  );

  $(this).on("mouseenter", function () {
    tlArrow.restart();
  });
  $(this).on("mouseleave", function () {
    tlArrow.reverse();
  });
});

// ----------------------------
//Spin Blade
// ----------------------------

function spinBlades() {
  gsap.to($(".blade-img"), {
    rotation: 360,
    duration: 20,
    ease: "linear",
    repeat: -1
  });
}
// spinBlades();

// ----------------------------
//Globe Pin
// ----------------------------

function stickyGlobe() {
  let triggerEl = $(".globe");
  let endTriggerEl = $(".blade");

  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: triggerEl,
      start: "center center",
      endTrigger: endTriggerEl,
      end: "center center",
      // markers: true,
      pin: true,
      pinSpacing: false,
      ease: "none",
      scrub: 0
    }
  });
}
// stickyGlobe();

// ----------------------------
//Mask Globe reveal
// ----------------------------

function maskGlobe() {
  let triggerEl = $(".s-showcase");

  let tl = gsap
    .timeline({
      scrollTrigger: {
        trigger: triggerEl,
        start: "top center+=225px",
        end: "top center-=225px",
        // markers: true,
        ease: "none",
        scrub: true
      }
    })
    .fromTo(
      ".mask",
      {
        "--clip": "0%"
      },
      {
        "--clip": "100%",
        ease: "linear",
        duration: 3
      }
    ); //from 0% to whatever it's set in CSS
}
// maskGlobe();

function maskBlades() {
  let triggerEl = $(".s-showcase");

  let tl = gsap
    .timeline({
      scrollTrigger: {
        trigger: triggerEl,
        start: "top center+=225px",
        end: "top center-=225px",
        // markers: true,
        ease: "none",
        scrub: true
      }
    })
    .fromTo(
      ".blade-mask",
      {
        "--clip": "100%"
      },
      {
        "--clipBlade": "0%",
        ease: "linear",
        duration: 3
      }
    ); //from 100% to whatever it's set in CSS
}
// maskBlades();

// ------------------------------
//Loading animations
// ------------------------------

// Split text into words and characters
const headerText = new SplitType("#s-header-h", { types: "words" });
const headerIntro = new SplitType(".s-header-subtitle", { types: "lines" });

let fadeUpSplit = new SplitType("[fade-up]", {
  types: "lines",
  tagName: "span"
});

// Animate characters into view with a stagger effect
function headerLoad() {
  let tl = gsap.timeline();
  //Show header init
  tl.to(".header-text", {
    opacity: 1,
    duration: 0.1
  });
  //Animate header lines
  tl.from($(".s-header-h").find(".word"), {
    y: "100%",
    opacity: 0,
    duration: 2,
    ease: "power3.out",
    stagger: {
      amount: 0.4
    }
  });

  //Animate header intro
  tl.from(
    $(".s-header-subtitle").find(".line"),
    {
      y: "100%",
      opacity: 0,
      duration: 0.75,
      ease: "power3.out",
      stagger: {
        amount: 0.15
      }
    },
    0.75
  );
  tl.from(
    ".s-header-arrow-block",
    {
      // opacity: 0,
      y: -20,
      duration: 0.5,
      ease: "power1.out"
    },
    0.5
  );
}
headerLoad();

// GSAP fade up on scroll
function fadeUp() {
  let tl = gsap.timeline();
  const targetUp = $("[fade-up]");
  const targetIn = $("[fade-in]");

  targetUp.each(function (index) {
    let triggerEl = $(this);
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerEl,
        start: "top 80%",
        end: "bottom top",
        toggleActions: "restart none none reverse"
        // markers: true
      }
    });
    tl.from(triggerEl.find(".line"), {
      y: "100%",
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: "power1.out"
    });
  });

  targetIn.each(function (index) {
    let triggerEl = $(this);
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerEl,
        start: "top 80%",
        end: "bottom top",
        toggleActions: "restart none none reverse"
        // markers: true
      }
    });
    tl.from(
      triggerEl,
      {
        y: "20",
        opacity: 0,
        duration: 0.5,
        // delay: 0.5,
        // stagger: 0.1,
        ease: "power1.out"
      },
      "<0.25"
    );
  });
}
fadeUp();

// ----------------------------
//Video showreel
// ----------------------------

function showreelScale() {
  let triggerEl = $(".showreel");
  let triggerText = $(".showreel-heading");
  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: triggerEl,
      start: "top 80%",
      end: "top 20%",
      toggleActions: "restart none none reverse",
      ease: "none",
      scrub: true
    }
  });
  tl.set(triggerEl, {
    scale: 0.8
  });
  tl.to(triggerEl, {
    scale: 1,
    borderRadius: 0,
    ease: "linear"
  });
  let tlText = gsap.timeline({
    scrollTrigger: {
      trigger: triggerEl,
      start: "top 30%",
      end: "top 0%",
      toggleActions: "restart none none reverse",
      // markers: true,
      scrub: 2
    }
  });
  tlText.fromTo(
    triggerText,
    { opacity: 0, y: "50%" },
    { opacity: 1, y: 0, duration: 2, delay: 2, ease: "power3.Out" }
  );
}
// showreelScale();

// ----------------------------
//Gallery bg and pin
// ----------------------------

function galleryBg() {
  let targetEl = $(".s-gallery, .s-showcase");
  let blade = $(".blade");
  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: blade,
      start: "bottom top",
      end: "600px top",
      toggleActions: "restart none none reverse",
      ease: "none",
      // markers: true,
      scrub: 0
    }
  });
  let tlGrid = gsap.timeline({
    scrollTrigger: {
      trigger: ".grid-product",
      start: "top 70%",
      end: "top 20%",
      toggleActions: "restart none none reverse",
      ease: "none",
      // markers: true,
      scrub: 0
    }
  });
  tl.to(targetEl, {
    backgroundColor: "#fff",
    color: "#161515"
  });
  tl.to(
    ".s-gallery-heading-wrap",
    {
      color: "#161515"
    },
    0
  );
  tlGrid.to(
    ".s-gallery-heading-wrap",
    {
      opacity: 0
    },
    0
  );
}
galleryBg();

// ----------------------------
//Gallery parallax
// ----------------------------
function galleryParallax() {
  $(".gallery-img-wrap:nth-child(3n+1)").each(function (index) {
    let targetEl = $(this);
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: targetEl,
        start: "top bottom",
        end: "bottom top",
        scrub: 2
      }
    });
    tl.to(targetEl, {
      yPercent: -30
    });
  });

  $(".gallery-img-wrap:nth-child(3n+2)").each(function (index) {
    let targetEl = $(this);
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: targetEl,
        start: "top bottom",
        end: "bottom top",
        scrub: 1
      }
    });
    tl.to(targetEl, {
      yPercent: -50
    });
  });

  $(".gallery-img-wrap:nth-child(3n+3)").each(function (index) {
    let targetEl = $(this);
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: targetEl,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.5
      }
    });
    tl.to(targetEl, {
      yPercent: -10
    });
  });
}
// galleryParallax();

/*----
Play video on click
-------*/

$(".video-play").on("click", function (event) {
  //event.preventDefault();
  var video = $("#video-play");

  // Detect play/pause state of video and toggle
  if (video.get(0).paused) {
    video.get(0).play();
  } else {
    video.get(0).pause();
  }
});

//Tringer only on desktop
// create
let mm = gsap.matchMedia();

// add a media query. When it matches, the associated function will run
mm.add("(min-width: 900px)", () => {
  stickyGlobe();
  maskGlobe();
  maskBlades();
  galleryParallax();
  showreelScale();
});

/*----
Adv box hover
-------*/
$(".box-adv").each(function (index) {
  let img = $(this).find(".adv-img").eq(0);
  let col = $(this).find(".col-adv").eq(0);
  let text = $(".adv-intro");

  let tl = gsap.timeline({ paused: true });

  tl.from(img, {
    y: "3%",
    opacity: 0,
    duration: 0.2,
    ease: "power1.in0ut"
  });
  tl.to(
    col,
    {
      borderColor: 'rgba("0,0,0, 1")',
      duration: 0.3,
      ease: "power1.out"
    },
    0
  );
  tl.to(
    text,
    {
      opacity: 0,
      // backgroundColor: "#000",
      duration: 0.3,
      ease: "power1.out"
    },
    0
  );

  $(this).on("mouseenter", function () {
    tl.restart();
  });
  $(this).on("mouseleave", function () {
    tl.reverse();
  });
});
