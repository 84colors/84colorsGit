jQuery(document).ready(function ($) {
    let windowWidth = $(window).width();

    //Get model-viewer with ID of model
    const mv = document.querySelector("#model");
    const mvJ = $("#model");

    //Set initial camera view
    const camTargetInit =
        "0.10275006294250488m -0.01528758555650711m 0.000018998980522155762m";
    const camOrbitInit = "-30deg 70deg 120%";
    const camOrbitPCB = "-30deg 70deg 70%";

    //Get html elements
    const hotspotsInit = $(".hotspot-init");
    const hotspotsPcb = $(".hotspot-pcb");
    const hotspotShowPcb = $(".hotspot-show-pcb");
    const hotspotZoom = $(".btn-zoom");
    const textBox = $(".text-box");
    const textBoxTitle = $(".text-header");
    const textBoxText = $(".text-body");

    let resetCam = true;
    let zoomedInPCB = true;

    $(".Hotspot").hide();
    hotspotZoom.hide();

    // --------------------
    // Change camera target on click
    // --------------------
    hotspotsInit.on("click", function () {
        let camOrbit = this.dataset.orbit;
        let camTarget = this.dataset.target;
        let pointText = this.dataset.text;
        let pointHeader = $(this).find(".HotspotAnnotation").text();

        //Set different orbit on mobile
        const mobileOrbit = $(this).attr("data-orbitmobile");
        if (windowWidth < 700 && mobileOrbit) {
            camOrbit = mobileOrbit;
        }

        //If camera is reset, then update it with hotspot info
        if (resetCam == true) {
            mvJ.attr("interpolation-decay", "300");
            mvJ.attr("camera-controls", "false");

            mv.cameraTarget = camTarget;
            mv.cameraOrbit = camOrbit;
            resetCam = false;

            //Hide hotspots except active
            hotspotsInit.hide();
            $(this).show();
        } else {
            mvJ.attr("interpolation-decay", "200");
            mvJ.attr("camera-controls", "true");

            mv.cameraTarget = camTargetInit;
            mv.cameraOrbit = camOrbitInit;
            resetCam = true;

            //Show hotspots
            hotspotsInit.show();
        }
        //Toggle class of dot
        $(this).toggleClass("is-active");

        if (!$(this).hasClass("hotspot-show-pcb")) {
            textBoxTitle.text(pointHeader);
            textBoxText.text(pointText);
            textBox.toggleClass("is-active");
        }
    });

    //For PCB ones
    hotspotsPcb.on("click", function () {
        let camOrbit = this.dataset.orbit;
        let camTarget = this.dataset.target;
        let pointText = this.dataset.text;
        let pointHeader = $(this).find(".HotspotAnnotation").text();

        //Set different orbit on mobile
        const mobileOrbit = $(this).attr("data-orbitmobile");
        if (windowWidth < 700 && mobileOrbit) {
            camOrbit = mobileOrbit;
        }

        //If camera is reset, then update it with hotspot info
        if (zoomedInPCB == true) {
            mvJ.attr("interpolation-decay", "300");
            mvJ.attr("camera-controls", "false");

            mv.cameraTarget = camTarget;
            mv.cameraOrbit = camOrbit;
            zoomedInPCB = false;

            //Hide hotspots except active
            hotspotsPcb.hide();
            $(this).show();
        } else {
            mvJ.attr("interpolation-decay", "200");
            mvJ.attr("camera-controls", "true");

            mv.cameraTarget = camTargetInit;
            mv.cameraOrbit = camOrbitPCB;
            zoomedInPCB = true;

            //Show hotspots
            hotspotsPcb.show();

            //Hide text box
        }
        //Toggle class of dot
        $(this).toggleClass("is-active");
        textBoxTitle.text(pointHeader);
        textBoxText.text(pointText);
        textBox.toggleClass("is-active");
    });

    // --------------------
    // Hide case on click
    // --------------------
    mv.addEventListener("load", (e) => {
        //Pause animation
        mv.pause();
        mv.currentTime = 0;

        // Hide case on click
        let isOpaque = true;
        // console.log(mv.model);
        const ball = mv.model.getMaterialByName("MergedBakeCase_Baked");
        const logo = mv.model.getMaterialByName("SVGMat.001");

        $(".hotspot-zoom").on("click", function () {
            if (isOpaque) {
                ball.setAlphaMode("BLEND");
                logo.setAlphaMode("BLEND");
                ball.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 0.0]);
                logo.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 0.0]);
                isOpaque = false;
                hotspotsInit.hide();
                hotspotsPcb.show();
                hotspotZoom.show();
                mvJ.attr("interpolation-decay", "300");
            } else {
                ball.setAlphaMode("OPAQUE");
                ball.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1]);
                logo.setAlphaMode("OPAQUE");
                logo.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1]);
                isOpaque = true;

                hotspotsInit.show();
                hotspotsPcb.hide();
                hotspotZoom.hide();
                hotspotsPcb.removeClass("is-active");
                hotspotShowPcb.removeClass("is-active");

                mvJ.attr("interpolation-decay", "200");

                zoomedInPCB = true;

                //Reset camera
                mv.cameraTarget = camTargetInit;
                mv.cameraOrbit = camOrbitInit;
                resetCam = true;

                //Hide text info
                textBox.removeClass("is-active");
            }
        });
    });

    // --------------------
    // Spin on load then play animation
    // --------------------
    const spinMv = () => {
        //Animation
        const playAnim = () => {
            if (mv.paused) {
                mv.play({ animationName: "Animation", repetitions: 1 });
            } else {
                mv.pause();
            }
        };

        //GSAP initial animation
        const tlSpin = gsap.timeline();

        tlSpin.to(mv, {
            duration: 3,
            ease: Power2.easeInOut,
            attr: {
                ["camera-orbit"]: "-30deg 70deg 120%",
            },
            onStart: function () {
                playAnim();
            },
            onComplete: function () {
                $(".hotspot-init").show();
            },
        });
    };

    //Intersection observer
    mv.addEventListener("load", (e) => {
        const mvObserverOptions = {
            rootMargin: "0px",
            threshold: 0.75, //percent in view
        };

        const mvObserver = new IntersectionObserver(function (
            entries,
            observer
        ) {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // console.log("in view");
                    observer.unobserve(entry.target);
                    spinMv();
                }
            });
        },
        mvObserverOptions);
        mvObserver.observe(mv);
    });
});
