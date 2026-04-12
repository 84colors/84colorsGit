//Cards slider
function initStackedCardsSlider() {
    document
        .querySelectorAll("[data-stacked-cards]")
        .forEach(function (container) {
            // animation presets
            let easeBeforeRelease = { duration: 0.2, ease: "Power2.easeOut" };
            let easeAfterRelease = { duration: 1, ease: "elastic.out(1,0.75)" };

            let activeDeg = 4;
            let inactiveDeg = -4;

            const list = container.querySelector("[data-stacked-cards-list]");
            if (!list) return;

            // check minimum cards
            const initialItems = Array.from(
                list.querySelectorAll(":scope > [data-stacked-cards-item]"),
            );
            if (initialItems.length < 3) {
                console.error(
                    "[StackedCards] Minimum of 3 cards required. Found:",
                    initialItems.length,
                    list,
                );
                return;
            }

            // Draggable instances & cached elements
            let dragFirst, dragSecond;
            let firstItem, secondItem, firstEl, secondEl;
            let full, t;

            function restack() {
                const items = Array.from(
                    list.querySelectorAll("[data-stacked-cards-item]"),
                );
                items.forEach(function (item) {
                    item.classList.remove("is--active", "is--second");
                });
                items[0].style.zIndex = 3;
                items[0].style.transform = `rotate(${activeDeg}deg)`;
                items[0].style.pointerEvents = "auto";
                items[0].classList.add("is--active");

                items[1].style.zIndex = 2;
                items[1].style.transform = `rotate(${inactiveDeg}deg)`;
                items[1].style.pointerEvents = "none";
                items[1].classList.add("is--second");

                items[2].style.zIndex = 1;
                items[2].style.transform = `rotate(${activeDeg}deg)`;

                items.slice(3).forEach(function (item) {
                    item.style.zIndex = 0;
                    item.style.transform = `rotate(${inactiveDeg}deg)`;
                });
            }

            function setupDraggables() {
                restack();

                // cache top two cards
                const items = Array.from(
                    list.querySelectorAll(":scope > [data-stacked-cards-item]"),
                );
                firstItem = items[0];
                secondItem = items[1];
                firstEl = firstItem.querySelector("[data-stacked-cards-card]");
                secondEl = secondItem.querySelector(
                    "[data-stacked-cards-card]",
                );

                // compute thresholds
                const width = firstEl.getBoundingClientRect().width;
                full = width * 1.15;
                t = width * 0.1;

                // kill old Draggables
                dragFirst?.kill();
                dragSecond?.kill();

                // --- First card draggable ---
                dragFirst = Draggable.create(firstEl, {
                    type: "x",
                    onPress() {
                        firstEl.classList.add("is--dragging");
                    },
                    onRelease() {
                        firstEl.classList.remove("is--dragging");
                    },
                    onDrag() {
                        let raw = this.x;
                        if (Math.abs(raw) > full) {
                            const over = Math.abs(raw) - full;
                            raw = (raw > 0 ? 1 : -1) * (full + over * 0.1);
                        }
                        gsap.set(firstEl, { x: raw, rotation: 0 });
                    },
                    onDragEnd() {
                        const x = this.x;
                        const dir = x > 0 ? "right" : "left";

                        // hand control to second card
                        this.disable?.();
                        dragSecond?.enable?.();
                        firstItem.style.pointerEvents = "none";
                        secondItem.style.pointerEvents = "auto";

                        if (Math.abs(x) <= t) {
                            // small drag: just snap back
                            gsap.to(firstEl, {
                                x: 0,
                                rotation: 0,
                                ...easeBeforeRelease,
                                onComplete: resetCycle,
                            });
                        } else if (Math.abs(x) <= full) {
                            flick(dir, false, x);
                        } else {
                            flick(dir, true);
                        }
                    },
                })[0];

                // --- Second card draggable ---
                dragSecond = Draggable.create(secondEl, {
                    type: "x",
                    onPress() {
                        secondEl.classList.add("is--dragging");
                    },
                    onRelease() {
                        secondEl.classList.remove("is--dragging");
                    },
                    onDrag() {
                        let raw = this.x;
                        if (Math.abs(raw) > full) {
                            const over = Math.abs(raw) - full;
                            raw = (raw > 0 ? 1 : -1) * (full + over * 0.2);
                        }
                        gsap.set(secondEl, { x: raw, rotation: 0 });
                    },
                    onDragEnd() {
                        gsap.to(secondEl, {
                            x: 0,
                            rotation: 0,
                            ...easeBeforeRelease,
                        });
                    },
                })[0];

                // start with first card active
                dragFirst?.enable?.();
                dragSecond?.disable?.();
                firstItem.style.pointerEvents = "auto";
                secondItem.style.pointerEvents = "none";
            }

            function flick(dir, skipHome = false, releaseX = 0) {
                if (!(dir === "left" || dir === "right")) {
                    dir = activeDeg > 0 ? "right" : "left";
                }
                dragFirst?.disable?.();

                const item = list.querySelector("[data-stacked-cards-item]");
                const card = item.querySelector("[data-stacked-cards-card]");
                const exitX = dir === "right" ? full : -full;

                if (skipHome) {
                    const visualX = gsap.getProperty(card, "x");
                    list.appendChild(item);
                    [activeDeg, inactiveDeg] = [inactiveDeg, activeDeg];
                    restack();
                    gsap.fromTo(
                        card,
                        { x: visualX, rotation: 0 },
                        {
                            x: 0,
                            rotation: 0,
                            ...easeAfterRelease,
                            onComplete: resetCycle,
                        },
                    );
                } else {
                    gsap.fromTo(
                        card,
                        { x: releaseX, rotation: 0 },
                        {
                            x: exitX,
                            ...easeBeforeRelease,
                            onComplete() {
                                gsap.set(card, { x: 0, rotation: 0 });
                                list.appendChild(item);
                                [activeDeg, inactiveDeg] = [
                                    inactiveDeg,
                                    activeDeg,
                                ];
                                resetCycle();
                                const newCard = item.querySelector(
                                    "[data-stacked-cards-card]",
                                );
                                gsap.fromTo(
                                    newCard,
                                    { x: exitX },
                                    {
                                        x: 0,
                                        ...easeAfterRelease,
                                        onComplete: resetCycle,
                                    },
                                );
                            },
                        },
                    );
                }
            }

            function resetCycle() {
                list.querySelectorAll(
                    "[data-stacked-cards-card].is--dragging",
                ).forEach(function (el) {
                    el.classList.remove("is--dragging");
                });
                setupDraggables();
            }

            setupDraggables();

            // “Next” button support
            container
                .querySelectorAll('[data-stacked-cards-control="next"]')
                .forEach(function (btn) {
                    btn.onclick = function () {
                        flick();
                    };
                });
        });
}

function initFlipOnScroll() {
    let wrapperElements = document.querySelectorAll(
        "[data-flip-element='wrapper']",
    );
    let targetEl = document.querySelector("[data-flip-element='target']");

    let tl;
    function flipTimeline() {
        if (tl) {
            tl.kill();
            gsap.set(targetEl, { clearProps: "all" });
        }

        // Use the first and last wrapper elements for the scroll trigger.
        tl = gsap.timeline({
            scrollTrigger: {
                trigger: wrapperElements[0],
                start: "center center",
                endTrigger: wrapperElements[wrapperElements.length - 1],
                end: "center center",
                scrub: 0.25,
            },
        });

        // Loop through each wrapper element.
        wrapperElements.forEach(function (element, index) {
            let nextIndex = index + 1;
            if (nextIndex < wrapperElements.length) {
                let nextWrapperEl = wrapperElements[nextIndex];
                // Calculate vertical center positions relative to the document.
                let nextRect = nextWrapperEl.getBoundingClientRect();
                let thisRect = element.getBoundingClientRect();
                let nextDistance =
                    nextRect.top +
                    window.pageYOffset +
                    nextWrapperEl.offsetHeight / 2;
                let thisDistance =
                    thisRect.top +
                    window.pageYOffset +
                    element.offsetHeight / 2;
                let offset = nextDistance - thisDistance;
                // Add the Flip.fit tween to the timeline.
                tl.add(
                    Flip.fit(targetEl, nextWrapperEl, {
                        duration: offset,
                        ease: "none",
                    }),
                );
            }
        });
    }

    flipTimeline();

    let resizeTimer;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            flipTimeline();
        }, 100);
    });
}

//Marque Scroll
function initMarqueeScrollDirection() {
    document
        .querySelectorAll("[data-marquee-scroll-direction-target]")
        .forEach((marquee) => {
            // Query marquee elements
            const marqueeContent = marquee.querySelector(
                "[data-marquee-collection-target]",
            );
            const marqueeScroll = marquee.querySelector(
                "[data-marquee-scroll-target]",
            );
            if (!marqueeContent || !marqueeScroll) return;

            // Get data attributes
            const {
                marqueeSpeed: speed,
                marqueeDirection: direction,
                marqueeDuplicate: duplicate,
                marqueeScrollSpeed: scrollSpeed,
            } = marquee.dataset;

            // Convert data attributes to usable types
            const marqueeSpeedAttr = parseFloat(speed);
            const marqueeDirectionAttr = direction === "right" ? 1 : -1; // 1 for right, -1 for left
            const duplicateAmount = parseInt(duplicate || 0);
            const scrollSpeedAttr = parseFloat(scrollSpeed);
            const speedMultiplier =
                window.innerWidth < 479
                    ? 0.25
                    : window.innerWidth < 991
                      ? 0.5
                      : 1;

            let marqueeSpeed =
                marqueeSpeedAttr *
                (marqueeContent.offsetWidth / window.innerWidth) *
                speedMultiplier;

            // Precompute styles for the scroll container
            marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
            marqueeScroll.style.width = `${scrollSpeedAttr * 2 + 100}%`;

            // Duplicate marquee content
            if (duplicateAmount > 0) {
                const fragment = document.createDocumentFragment();
                for (let i = 0; i < duplicateAmount; i++) {
                    fragment.appendChild(marqueeContent.cloneNode(true));
                }
                marqueeScroll.appendChild(fragment);
            }

            // GSAP animation for marquee content
            const marqueeItems = marquee.querySelectorAll(
                "[data-marquee-collection-target]",
            );
            const animation = gsap
                .to(marqueeItems, {
                    xPercent: -100, // Move completely out of view
                    repeat: -1,
                    duration: marqueeSpeed,
                    ease: "linear",
                })
                .totalProgress(0.5);

            // Initialize marquee in the correct direction
            gsap.set(marqueeItems, {
                xPercent: marqueeDirectionAttr === 1 ? 100 : -100,
            });
            animation.timeScale(marqueeDirectionAttr); // Set correct direction
            animation.play(); // Start animation immediately

            // Set initial marquee status
            marquee.setAttribute("data-marquee-status", "normal");

            // ScrollTrigger logic for direction inversion
            ScrollTrigger.create({
                trigger: marquee,
                start: "top bottom",
                end: "bottom top",
                onUpdate: (self) => {
                    const isInverted = self.direction === 1; // Scrolling down
                    const currentDirection = isInverted
                        ? -marqueeDirectionAttr
                        : marqueeDirectionAttr;

                    // Update animation direction and marquee status
                    animation.timeScale(currentDirection);
                    marquee.setAttribute(
                        "data-marquee-status",
                        isInverted ? "normal" : "inverted",
                    );
                },
            });

            // Extra speed effect on scroll
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: marquee,
                    start: "0% 100%",
                    end: "100% 0%",
                    scrub: 0,
                },
            });

            const scrollStart =
                marqueeDirectionAttr === -1
                    ? scrollSpeedAttr
                    : -scrollSpeedAttr;
            const scrollEnd = -scrollStart;

            tl.fromTo(
                marqueeScroll,
                { x: `${scrollStart}vw` },
                { x: `${scrollEnd}vw`, ease: "none" },
            );
        });
}

document.addEventListener("DOMContentLoaded", () => {
    initStackedCardsSlider();
    initFlipOnScroll();
    initMarqueeScrollDirection();
});
