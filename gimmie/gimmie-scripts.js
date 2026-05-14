(function () {
    "use strict";

    // ============================================================
    // Modal
    // ============================================================
    function initModalBasic() {
        const modalGroup = document.querySelector("[data-modal-group-status]");
        const modals = document.querySelectorAll("[data-modal-name]");
        const modalTargets = document.querySelectorAll("[data-modal-target]");
        if (!modalTargets.length) return;

        function stopVideo() {
            const videoWrapper = document.querySelector(".video");
            if (!videoWrapper) return;
            const iframe = videoWrapper.querySelector("iframe");
            // Clearing src stops playback completely (video + audio)
            if (iframe) iframe.src = "";
        }

        function closeAllModals() {
            stopVideo();
            modalTargets.forEach((t) =>
                t.setAttribute("data-modal-status", "not-active"),
            );
            modals.forEach((m) =>
                m.setAttribute("data-modal-status", "not-active"),
            );
            if (modalGroup) {
                modalGroup.setAttribute(
                    "data-modal-group-status",
                    "not-active",
                );
            }
        }

        modalTargets.forEach((modalTarget) => {
            modalTarget.addEventListener("click", function () {
                const name = this.getAttribute("data-modal-target");
                const target = document.querySelector(
                    `[data-modal-target="${name}"]`,
                );
                const modal = document.querySelector(
                    `[data-modal-name="${name}"]`,
                );
                if (target) target.setAttribute("data-modal-status", "active");
                if (modal) modal.setAttribute("data-modal-status", "active");
                if (modalGroup) {
                    modalGroup.setAttribute("data-modal-group-status", "active");
                }
            });
        });

        document.querySelectorAll("[data-modal-close]").forEach((btn) => {
            btn.addEventListener("click", closeAllModals);
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeAllModals();
        });
    }

    // ============================================================
    // Vimeo Thumbnail Player
    // ============================================================
    function initVimeoThumbs() {
        const thumbWraps = document.querySelectorAll(".thumb-wrap");
        if (!thumbWraps.length) return;

        thumbWraps.forEach((thumbWrap) => {
            thumbWrap.addEventListener("click", function (e) {
                e.preventDefault();

                const videoUrl = this.dataset.videoUrl;
                if (!videoUrl) {
                    console.warn(
                        "No data-video-url attribute found on .thumb-wrap",
                    );
                    return;
                }

                const match = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
                if (!match) {
                    console.warn(
                        "Could not extract Vimeo ID from URL:",
                        videoUrl,
                    );
                    return;
                }

                const embedUrl = `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
                const videoWrapper = document.querySelector(".video");
                if (!videoWrapper) {
                    console.warn("No .video element found");
                    return;
                }

                const existingIframe = videoWrapper.querySelector("iframe");
                if (existingIframe) {
                    existingIframe.src = embedUrl;
                } else {
                    videoWrapper.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>`;
                }

                const h2 =
                    videoWrapper.parentElement &&
                    videoWrapper.parentElement.querySelector("h2");
                if (!h2) return;

                fetch(
                    `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}`,
                )
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error(
                                `Vimeo oEmbed request failed: ${response.status}`,
                            );
                        }
                        return response.json();
                    })
                    .then((data) => {
                        h2.textContent = data.title;
                    })
                    .catch((error) => {
                        console.warn("Could not fetch Vimeo title:", error);
                    });
            });
        });
    }

    // ============================================================
    // Load More Thumbnails
    // ============================================================
    function initLoadMoreThumbs() {
        const INITIAL_COUNT = 8;
        const BATCH_SIZE = 4;

        const grid = document.querySelector(".thumbs-grid");
        const loadBtn = document.querySelector("#btn-load");
        if (!grid || !loadBtn) return;

        const thumbs = Array.from(grid.querySelectorAll(".thumb-wrap"));

        thumbs.forEach((thumb, i) => {
            if (i >= INITIAL_COUNT) thumb.style.display = "none";
        });

        if (thumbs.length <= INITIAL_COUNT) {
            loadBtn.style.display = "none";
            return;
        }

        let visibleCount = INITIAL_COUNT;

        loadBtn.addEventListener("click", (e) => {
            e.preventDefault();

            const nextBatch = thumbs.slice(
                visibleCount,
                visibleCount + BATCH_SIZE,
            );
            nextBatch.forEach((thumb) => {
                thumb.style.display = "";
            });

            gsap.from(nextBatch, {
                opacity: 0,
                y: 20,
                duration: 0.5,
                stagger: 0.08,
                ease: "power2.out",
            });

            visibleCount += BATCH_SIZE;
            if (visibleCount >= thumbs.length) loadBtn.style.display = "none";
        });
    }

    // ============================================================
    // Dropping Cards Stack
    // ============================================================
    function initDroppingCardsStack() {
        const stacks = document.querySelectorAll("[data-dropping-stack-init]");
        if (!stacks.length) return;

        if (
            typeof Draggable === "undefined" ||
            typeof CustomEase === "undefined"
        ) {
            console.warn(
                "Dropping cards stack requires GSAP Draggable and CustomEase plugins",
            );
            return;
        }

        gsap.registerPlugin(Draggable, CustomEase);
        if (!CustomEase.get("osmo")) {
            CustomEase.create("osmo", "0.625, 0.05, 0, 1");
        }

        // Settings
        const visibleCount = 4;
        const minTotalForLoop = 5;
        const duration = 0.75;
        const mainEase = "osmo";
        const dragThresholdPercent = 20;

        const getUnitValue = (val, depth) => {
            const num = parseFloat(val) || 0;
            const unit = String(val).replace(/[0-9.-]/g, "") || "px";
            return num * depth + unit;
        };

        stacks.forEach((stackEl) => {
            const nextBtn = stackEl.querySelector("[data-dropping-stack-next]");
            const prevBtn = stackEl.querySelector("[data-dropping-stack-prev]");

            const list = stackEl.querySelector(".dropping-stack__list");
            if (!list) return;

            let cards = Array.from(
                list.querySelectorAll("[data-dropping-stack-item]"),
            );
            if (cards.length < 3) return;

            const originalCount = cards.length;
            if (cards.length < minTotalForLoop) {
                const setsNeeded = Math.ceil(minTotalForLoop / originalCount);
                const clonesToAdd = setsNeeded * originalCount - originalCount;

                for (let i = 0; i < clonesToAdd; i++) {
                    const clone = cards[i % originalCount].cloneNode(true);
                    clone.setAttribute("aria-hidden", "true");
                    list.appendChild(clone);
                }

                cards = Array.from(
                    list.querySelectorAll("[data-dropping-stack-item]"),
                );
            }

            const total = cards.length;
            let activeIndex = 0;
            let isAnimating = false;

            let dragCard = null;
            let draggableInstance = null;

            let limitX = 1;
            let limitY = 1;

            let offsetX = "0em";
            let offsetY = "0em";

            let isActive = false;

            const mod = (n, m) => ((n % m) + m) % m;
            const cardAt = (offset) => cards[mod(activeIndex + offset, total)];

            function updateOffsetsFromPadding() {
                const collectionEl = stackEl.querySelector(
                    "[data-dropping-stack-collection]",
                );
                if (!collectionEl) return;

                const styles = getComputedStyle(collectionEl);

                const padRight = parseFloat(styles.paddingRight) || 0;
                const padLeft = parseFloat(styles.paddingLeft) || 0;
                const padBottom = parseFloat(styles.paddingBottom) || 0;
                const padTop = parseFloat(styles.paddingTop) || 0;

                const steps = Math.max(1, visibleCount - 1);

                const usePadX = Math.max(padRight, padLeft);
                const usePadY = Math.max(padBottom, padTop);

                const signX = padLeft > padRight ? -1 : 1;
                const signY = padTop > padBottom ? -1 : 1;

                offsetX = (usePadX / steps) * signX + "px";
                offsetY = (usePadY / steps) * signY + "px";
            }

            function updateDragLimits() {
                if (!dragCard) return;
                const cardRect = dragCard.getBoundingClientRect();
                limitX = cardRect.width || 1;
                limitY = cardRect.height || 1;
            }

            // Sets cards to their static stack positions
            function applyState() {
                updateOffsetsFromPadding();

                cards.forEach((card) => {
                    gsap.set(card, {
                        opacity: 0,
                        pointerEvents: "none",
                        zIndex: 0,
                        x: 0,
                        y: 0,
                        xPercent: 0,
                        yPercent: 0,
                    });
                });

                for (let depth = 0; depth < visibleCount; depth++) {
                    const card = cardAt(depth);
                    const xVal = getUnitValue(offsetX, depth);
                    const yVal = getUnitValue(offsetY, depth);

                    const state = {
                        opacity: 1,
                        zIndex: 999 - depth,
                        pointerEvents: depth === 0 ? "auto" : "none",
                    };

                    if (offsetX.includes("%"))
                        state.xPercent = parseFloat(xVal);
                    else state.x = xVal;
                    if (offsetY.includes("%"))
                        state.yPercent = parseFloat(yVal);
                    else state.y = yVal;

                    gsap.set(card, state);
                }

                dragCard = cardAt(0);
                gsap.set(dragCard, { touchAction: "none" });

                updateDragLimits();

                if (draggableInstance) {
                    draggableInstance.kill();
                    draggableInstance = null;
                }

                const magnetize = (raw, limit) => {
                    const sign = Math.sign(raw) || 1;
                    const abs = Math.abs(raw);
                    const out = limit * Math.tanh(abs / limit);
                    return sign * out;
                };

                draggableInstance = Draggable.create(dragCard, {
                    type: "x,y",
                    inertia: false,
                    onPress: function () {
                        if (isAnimating) return;
                        gsap.killTweensOf(dragCard);
                        gsap.set(dragCard, { zIndex: 2000, opacity: 1 });
                    },
                    onDrag: function () {
                        if (isAnimating) return;
                        const x = magnetize(this.x, limitX);
                        const y = magnetize(this.y, limitY);
                        gsap.set(dragCard, { x, y, opacity: 1 });
                    },
                    onRelease: function () {
                        if (isAnimating) return;

                        const currentX = gsap.getProperty(dragCard, "x");
                        const currentY = gsap.getProperty(dragCard, "y");

                        const movedXPercent =
                            (Math.abs(currentX) / limitX) * 100;
                        const movedYPercent =
                            (Math.abs(currentY) / limitY) * 100;
                        const movedPercent = Math.max(
                            movedXPercent,
                            movedYPercent,
                        );

                        if (movedPercent >= dragThresholdPercent) {
                            animateNext(true, currentX, currentY);
                            return;
                        }

                        // Snap back if threshold not reached
                        gsap.to(dragCard, {
                            x: 0,
                            y: 0,
                            opacity: 1,
                            duration: 1,
                            ease: "elastic.out(1, 0.7)",
                            onComplete: () => applyState(),
                        });
                    },
                })[0];
            }

            function animateNext(fromDrag = false, releaseX = 0, releaseY = 0) {
                if (isAnimating) return;
                isAnimating = true;

                const outgoing = cardAt(0);
                const incomingBack = cardAt(visibleCount);
                const tl = gsap.timeline({
                    defaults: { duration, ease: mainEase },
                    onComplete: () => {
                        activeIndex = mod(activeIndex + 1, total);
                        applyState();
                        isAnimating = false;
                    },
                });

                gsap.set(outgoing, { zIndex: 2000, opacity: 1 });
                if (fromDrag) gsap.set(outgoing, { x: releaseX, y: releaseY });

                // Top card falls down and fades out late
                tl.to(outgoing, { yPercent: 200 }, 0);
                tl.to(
                    outgoing,
                    { opacity: 0, duration: duration * 0.2, ease: "none" },
                    duration * 0.4,
                );

                // Shift existing stack cards forward
                for (let depth = 1; depth < visibleCount; depth++) {
                    const xVal = getUnitValue(offsetX, depth - 1);
                    const yVal = getUnitValue(offsetY, depth - 1);
                    const move = { zIndex: 999 - (depth - 1) };

                    if (offsetX.includes("%")) move.xPercent = parseFloat(xVal);
                    else move.x = xVal;
                    if (offsetY.includes("%")) move.yPercent = parseFloat(yVal);
                    else move.y = yVal;

                    tl.to(cardAt(depth), move, 0);
                }

                // Bring new card in from the hidden back slot
                const backX = getUnitValue(offsetX, visibleCount);
                const backY = getUnitValue(offsetY, visibleCount);
                const startX = getUnitValue(offsetX, visibleCount - 1);
                const startY = getUnitValue(offsetY, visibleCount - 1);

                const incomingSet = { opacity: 0, zIndex: 999 - visibleCount };
                if (offsetX.includes("%"))
                    incomingSet.xPercent = parseFloat(backX);
                else incomingSet.x = backX;
                if (offsetY.includes("%"))
                    incomingSet.yPercent = parseFloat(backY);
                else incomingSet.y = backY;
                gsap.set(incomingBack, incomingSet);

                const incomingTo = { opacity: 1 };
                if (offsetX.includes("%"))
                    incomingTo.xPercent = parseFloat(startX);
                else incomingTo.x = startX;
                if (offsetY.includes("%"))
                    incomingTo.yPercent = parseFloat(startY);
                else incomingTo.y = startY;
                tl.to(incomingBack, incomingTo, 0);
            }

            function animatePrev() {
                if (isAnimating) return;
                isAnimating = true;

                const incomingTop = cardAt(-1);
                const leavingBack = cardAt(visibleCount - 1);
                const tl = gsap.timeline({
                    defaults: { duration, ease: mainEase },
                    onComplete: () => {
                        activeIndex = mod(activeIndex - 1, total);
                        applyState();
                        isAnimating = false;
                    },
                });

                gsap.set(leavingBack, { zIndex: 1 });

                // Card returns from above into the active spot
                gsap.set(incomingTop, {
                    opacity: 0,
                    x: 0,
                    xPercent: 0,
                    yPercent: -200,
                    zIndex: 2000,
                });
                tl.to(incomingTop, { yPercent: 0 }, 0);
                tl.to(
                    incomingTop,
                    { opacity: 1, duration: duration * 0.2, ease: "none" },
                    duration * 0.3,
                );

                // Push current stack cards back one level
                for (let depth = 0; depth < visibleCount - 1; depth++) {
                    const xVal = getUnitValue(offsetX, depth + 1);
                    const yVal = getUnitValue(offsetY, depth + 1);
                    const move = { zIndex: 999 - (depth + 1) };

                    if (offsetX.includes("%")) move.xPercent = parseFloat(xVal);
                    else move.x = xVal;
                    if (offsetY.includes("%")) move.yPercent = parseFloat(yVal);
                    else move.y = yVal;

                    tl.to(cardAt(depth), move, 0);
                }

                // Slide the back-most card into the hidden slot
                const backX = getUnitValue(offsetX, visibleCount);
                const backY = getUnitValue(offsetY, visibleCount);
                const hideBack = { opacity: 0 };
                if (offsetX.includes("%"))
                    hideBack.xPercent = parseFloat(backX);
                else hideBack.x = backX;
                if (offsetY.includes("%"))
                    hideBack.yPercent = parseFloat(backY);
                else hideBack.y = backY;
                tl.to(leavingBack, hideBack, 0);
            }

            // Arrow keys only fire when the stack is on screen
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        isActive =
                            entry.isIntersecting &&
                            entry.intersectionRatio >= 0.6;
                    });
                },
                { threshold: [0, 0.6, 1] },
            );

            observer.observe(stackEl);

            const onKeyDown = (e) => {
                if (!isActive || isAnimating) return;

                const tag =
                    e.target && e.target.tagName
                        ? e.target.tagName.toLowerCase()
                        : "";
                const isTyping =
                    tag === "input" ||
                    tag === "textarea" ||
                    tag === "select" ||
                    (e.target && e.target.isContentEditable);
                if (isTyping) return;

                if (e.key === "ArrowRight") {
                    e.preventDefault();
                    animateNext(false);
                } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    animatePrev();
                }
            };

            window.addEventListener("keydown", onKeyDown);

            applyState();

            if (nextBtn) {
                nextBtn.addEventListener("click", () => animateNext(false));
            }
            if (prevBtn) prevBtn.addEventListener("click", animatePrev);

            window.addEventListener("resize", () => applyState());
        });
    }

    // ============================================================
    // Init
    // ============================================================
    function init() {
        initModalBasic();
        initVimeoThumbs();
        initLoadMoreThumbs();
        initDroppingCardsStack();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
