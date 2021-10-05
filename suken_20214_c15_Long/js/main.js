/* eslint-disable no-await-in-loop */
/* eslint-disable no-loop-func */
/* eslint-disable no-case-declarations */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable no-shadow */
/* eslint-disable no-unused-expressions */
var g_buttonAnimateInterval = {};
var g_actionState;
var g_selectedButton;
var g_isPlaying = false;
var g_stepCount;
var g_isChanged = false;
var g_isDisabledBtn1 = true;
var g_isDisabledBtn2 = false;
var g_isDisabledBtn3 = true;
var g_isAnimatingButton = {};
var g_checkboxActive = true;
var g_latestMousePress = "";
var g_selectGraphId = "";
var g_interval;
var g_interval2;
var g_isRunning = false;
var duration = 10000;
var nFrame = 300;
var intialP = -624;
var intialQ = 760;
var middleP;
var middleQ;
var stepP = intialP / nFrame;
var stepQ = intialQ / nFrame;
var g_currentPosition = "middle";

var g_coordinateUnit = 1;

// ---------------------------------------------------------

window.addEventListener("mousemove", function (ev) {
    ev.preventDefault ? ev.preventDefault() : (ev.returnValue = false);
});

window.addEventListener(
    "touchmove",
    function (e) {
        e.preventDefault();
    },
    {
        passive: false,
    }
);

function init() {
    showElement("#divBody", true);
}

function showElement(element, visible) {
    $(element).css("visibility", visible ? "visible" : "hidden");
}

async function animateButtonEffect(id, isDown, cb, dy) {
    if (g_isAnimatingButton[id] && isDown) return;
    while (g_isAnimatingButton[id]) {
        await delay(50);
    }

    g_isAnimatingButton[id] = true;

    var self = $(id);
    var duration = 100;
    var nFrame = 10;
    var dy1 = isDown ? 0 : dy || 4;
    var dy2 = isDown ? dy || 4 : 0;
    var ddy = (dy2 - dy1) / nFrame;

    let count = 0;

    var itv = setInterval(() => {
        count += 1;
        dy1 += ddy;

        self.attr("transform", SVGLib.getStrMatrix(1, 0, 0, 1, 0, dy1));

        if (count >= nFrame) {
            clearInterval(itv);
            delete g_isAnimatingButton[id];
            if (cb) cb();
        }
    }, duration / nFrame);
}

let g_eventId = 0;
const animateDraw = async (totalStep, delayTime, fn) => {
    var eventId = g_eventId;
    for (let i = 0; i < totalStep; i++) {
        if (eventId != g_eventId) return;
        fn(i, totalStep);
        await delay(delayTime);
    }
};

let g_isMouseDown = false;
const groupStaticButton = (buttonName, showEl, width) => {
    const buttonWidth = buttonName == "reload" ? "146" : width || "146";
    $(`#btn-${buttonName}-group`)
        .prepend(`<g id="btn-${buttonName}-down">  <rect class="rect-button" width="${buttonWidth}" height="44" style="fill: transparent"></rect></g>`)
        .prepend(`<g id="btn-${buttonName}-active">  <rect class="rect-button" width="${buttonWidth}" height="44" style="fill: transparent"></rect></g>`)
        .prepend(`<g id="btn-${buttonName}-inactive">  <rect class="rect-button" width="${buttonWidth}" height="44" style="fill: transparent"></rect></g>`)
        .prepend(`<g id="btn-${buttonName}-disabled">  <rect class="rect-button" width="${buttonWidth}" height="44" style="fill: transparent"></rect></g>`);

    const hardCodeSufix = `<script type="text/javascript">
        //      <![CDATA[  <-- For SVG support
        //          ]]>
        </script></svg>`;

    const buttonStatus = ["down", "active", "inactive", "disabled"];
    const btnConfigKey = buttonName.replace(/-/g, "_");
    buttonStatus.forEach((status) => {
        if (CONFIG_SVG[`btn_${btnConfigKey}_${status}`]) {
            $(`#btn-${buttonName}-${status}`).prepend(CONFIG_SVG[`btn_${btnConfigKey}_${status}`].replace("</svg>", hardCodeSufix).replace(/clip-path:url\(#clip-path(-\d)*\)/g, ""));

            $(`#btn-${buttonName}-${status}`).find("svg").removeAttr("viewBox");
            $(`#btn-${buttonName}-${status}`).find("script").remove();
            // $(`#btn-${buttonName}-${status}`).find("defs").remove();
            $(`#btn-${buttonName}-${status}`).find("title").remove();

            if ($(`#btn-${buttonName}-${status}`).find("symbol").length) {
                var html = $(`#btn-${buttonName}-${status}`).find("symbol").html();
                if (html) {
                    $(`#btn-${buttonName}-${status} svg`).remove();
                    $(`#btn-${buttonName}-${status}`).prepend(html);
                }
            }
            if (status != showEl) showElement(`#btn-${buttonName}-${status}`, false);
        } else showElement(`#btn-${buttonName}-${status}`, false);
    });
};

const staticElement = (element, svg) => {
    const hardCodeSufix = `<script type="text/javascript">
          //      <![CDATA[  <-- For SVG support
          //          ]]>
          </script></svg>`;

    $(element).html((svg || "").replace("</svg>", hardCodeSufix).replace(/clip-path:url\(#clip-path(-\d)*\)/g, ""));

    $(element).find("svg").removeAttr("viewBox");
    $(element).find("script").remove();
    $(element).find("defs").remove();
    $(element).find("title").remove();
};
const urlParams = new URLSearchParams(window.location.search);
const myParam = urlParams.get("pattern");
if (myParam) CONFIG.selected_pattern = Number(myParam);
const config = () => {
    g_state.sigma = {
        0: 0,
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
    }[CONFIG.selected_pattern];
};

var itvKeepSVGNotMove;

var g_dragablePosition = { top: 0, left: 0 }; // store initial dragable area position
function keepDraggableSvgNotMove() {
    if (g_dragablePosition.top == undefined || g_dragablePosition.top === null) {
        g_dragablePosition.top = parseInt($("#scrollbar").css("top"), 10) || 0;
        g_dragablePosition.left = parseInt($("#scrollbar").css("left"), 10) || 0;
    } else {
        setTimeout(function () {
            $("#scrollbar").css("top", g_dragablePosition.top);
            $("#scrollbar").css("left", g_dragablePosition.left);
        }, 50);
    }

    if (!itvKeepSVGNotMove)
        itvKeepSVGNotMove = setInterval(() => {
            keepDraggableSvgNotMove();
        }, 200);
}

// ---------------------------------------------------------
var Draw = {
    setting: {
        svgDom: $("#svg"),
        grid: 100,
        lineStyle: {
            stroke: "black",
            "stroke-width": "2.5px",
        },
    },

    init: function () {
        this.shapeGroup = SVGLib.createTag(CONST.SVG.TAG.GROUP, {
            id: "svg_shape",
            transform: SVGLib.getStrMatrix(1, 0, 0, 1, 512, 324),
        });
        this.setting.svgDom.append(this.shapeGroup);

        this.rotateEvent(".draggable-zone");
    },

    rotateEvent: function (element) {
        var prevX = 0;
        var prevY = 0;

        $(element).draggable({
            start: function (event, ui) {
                prevX = event.clientX;
                prevY = event.clientY;

                if (!g_isRotated) {
                    g_isRotated = true;
                    g_numberOfFrames = g_totalFrames;
                    g_numberOfRotateFrames = 0;
                }

                // event.preventDefault();
                event.stopPropagation();
            },
            drag: function (event, ui) {
                var x = event.clientX;
                var y = event.clientY;

                var w = window.innerWidth;
                var h = window.innerHeight;

                w = Math.min(w, (h * g_layoutWidth) / g_layoutHeight);

                var dx = x - prevX;
                var dy = y - prevY;
                var ratio = (0.4 * g_layoutWidth) / w;

                g_shape.rotateY(-dx * ratio);
                g_shape.rotateX(dy * ratio);
                g_shape.render();
                keepDraggableSvgNotMove();

                prevX = x;
                prevY = y;

                // event.preventDefault();
                event.stopPropagation();
                writeLog();
            },
        });
    },

    appendToShapeGroup: function (childElement) {
        this.shapeGroup.append(childElement);

        return childElement;
    },

    appendToFloatingShapeGroup: function (childElement) {
        this.floatingShapeGroup.append(childElement);
    },
};

function isEnableClick(element) {
    var els = $(element).children();
    var visibleEls = [];
    for (let i = els.length - 1; i >= 0; i--) {
        const el = els[i];
        if ($(el).css("visibility") != "hidden") {
            visibleEls.push({
                id: $(el).attr("id"),
                el,
            });
        }
    }

    return visibleEls.length > 1 || (visibleEls.length && visibleEls[0].id.indexOf("disable") == -1);
}

const checkboxValue = {};
const graphColorValue = {
    black: true,
    red: false,
};



$(document).ready(function () {
    config();
    init();
    initDragEvent();
    Draw.init();
    C15.render();
    
    showElement(".btn-reload-element", true);
    showElement(".group-check", false);
    
 
    [
        ["start", ["inactive"]],
        ["reload", ["disabled"]],
    ].forEach((btn) => {
        btn[1].forEach((status) => {
            const btnId = `#btn-${btn[0]}-${status}`;
            showElement(btnId, true);
        });
    });


    [
        ["start", ["active", "disabled"]],
        ["reload", ["active", "inactive"]],
        ["back", ["active", "inactive", "disabled"]],
        ["pause", ["active", "inactive", "disabled"]],
        ["resume", ["active", "inactive", "disabled"]],
    ].forEach((btn) => {
        btn[1].forEach((status) => {
            const btnId = `#btn-${btn[0]}-${status}`;
            showElement(btnId, false);
        });
    });

    // btn-group-reload
    ["reload", "start", "back", "pause", "resume"].forEach((btnName) => {
        $(`#btn-${btnName}-inactive`).on("mousedown", function (e) {
            g_eventId += 1;
            g_latestMousePress = `${btnName}-inactive`;

            animateButtonEffect(`#group-${btnName}`, true);
        });
        if(g_state.sigma >0){
            g_latestMousePress = `btn-reload-inactive`;
        }
    });

    $("#btn-reload-active").on("mousedown", function (event) {
        event.preventDefault();
        showElement(".btn-reload-element", false);
        showElement("#btn-reload-inActive", true);
        animateButtonEffect("#group-reload", true);
        g_latestMousePress = "reload-inactive";
    });


    $(`#unCheck`).on("mouseup", function (e) {
        g_latestMousePress = `unCheck-box`;
    });

    $(`#check`).on("mouseup", function (e) {
        g_latestMousePress = `check-box`;
    });
    
    $(`#check-box`).on("mouseup", function (e) {
        if(g_state.is_turn == true){
          g_latestMousePress = `unCheck-box`;
        }
        if(g_state.is_turn == false){
            g_latestMousePress = `check-box`;
        }
      });
   
    $(document).on("mouseup", function (e) {
        g_isMouseDown = false;

        console.log("g_latestMousePress", g_latestMousePress);
       
        switch (g_latestMousePress) {
            case "check-box":
                showElement("#unCheck",true)
                showElement("#check", true)
                showElement(".btn-reload-element", true);
                g_state.is_turn = true
                C15.render();
                break;
                
                
            case "unCheck-box":
                showElement("#unCheck",false)
                showElement("#check", true);
                g_state.is_turn = false
                C15.render();
                break;
            
            case "btn-start-active":
                
                animateButtonEffect("#btn-start-group", false);
                showElement("#btn-reload-inactive", true);
              
                break;
            case "reload-inactive":
                animateButtonEffect("#group-reload", false);
                setTimeout(() => {
                    showElement(".btn-reload-element, #unCheck", false);

                    showElement(
                        "#btn-start-inactive, #btn-back-disabled, #btn-reload-disabled",
                        true
                    ); // hien cac nut (cach viet thu gon nhieu phan tu thay vi viet day du nhu tren)
                    g_state.sigma = 1;
                    g_state.is_turn = false;
                    C15.render();

                }, 100);
                break;
            case "back-inactive":
                animateButtonEffect("#btn-reload-group", false, () => {
                    [
                        ["start", ["inactive"]],
                        ["reload", ["disabled"]],
                    ].forEach((btn) => {
                        btn[1].forEach((status) => {
                            const btnId = `#btn-${btn[0]}-${status}`;
                            showElement(btnId, true);
                        });
                    });

                    [
                        ["start", ["active", "disabled"]],
                        ["reload", ["active", "inactive"]],
                        ["back", ["active", "inactive", "disabled"]],
                        ["pause", ["active", "inactive", "disabled"]],
                        ["resume", ["active", "inactive", "disabled"]],
                    ].forEach((btn) => {
                        btn[1].forEach((status) => {
                            const btnId = `#btn-${btn[0]}-${status}`;
                            showElement(btnId, false);
                        });
                    });
                });
                g_state.t = 0
                break;
                

            default:
                break;
        }

        g_latestMousePress = "";
    });

    setTimeout(() => {
        $("#svg_root").css("opacity", 1);
    }, 300);

    // drag event
    var prevX = 0;
    var prevY = 0;

    var svg = document.querySelector("svg");

    // Create an SVGPoint for future math
    var pt = svg.createSVGPoint();

    function cursorPoint(evt) {
        var c = /Edge/.test(window.navigator.userAgent) ? document.getElementById("diagram") : svg;
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        var ctm = c.getScreenCTM();
        var inverse = ctm.inverse();
        var p = pt.matrixTransform(inverse);

        return {
            x: p.x,
            y: p.y,
        };
    }
    const x0 = 90;
    const x1 = 690;



    let fnDrag = (event) =>{
        event.stopPropagation();

        var layoutLoc = SVGLib.getTranslate("#seekbar-group");
        var curPos = cursorPoint(event);

        var x = curPos.x - layoutLoc.left;
        var y = -(curPos.y - layoutLoc.top);

        let percent = (x - x0) / (x1 - x0);
        if (percent < 0) percent = 0;
        if (percent > 1) percent = 1;

    //     g_state.sigma = percent * 5;
    //     C15.render();

    //     keepDraggableSvgNotMove();
    // };
    if (g_state.sigma <= 0.1) {
        g_state.sigma = 0.0034677579993841945;
        C15.render();
    }

    //0,1,2,3,4,5 node attraction
    if (g_state.sigma >= 0.9 && g_state.sigma <= 1.1) { g_state.sigma = 1; C15.render(); }
    if (g_state.sigma >= 1.9 && g_state.sigma <= 2.1) { g_state.sigma = 2; C15.render(); }
    if (g_state.sigma >= 2.9 && g_state.sigma <= 3.1) { g_state.sigma = 3; C15.render(); }
    if (g_state.sigma >= 3.9 && g_state.sigma <= 4.1) { g_state.sigma = 4; C15.render(); }
    if (g_state.sigma >= 4.9) { g_state.sigma = 5; C15.render(); }


    C15.render();
}


    $("#scrollbar").on("mousedown", function(event){
        fnDrag(event);
    });
    
    $("#scrollbar")
        .draggable({
            start: function start(event, ui) {
                event.stopPropagation();
            },
            drag: function drag(event, ui) {
               
                event.stopPropagation();

                var layoutLoc = SVGLib.getTranslate("#scrollbar");
                var curPos = cursorPoint(event);

                var x = curPos.x - layoutLoc.left;
                var y = -(curPos.y - layoutLoc.top);

                let percent = (x - x0) / (x1 - x0);
               
                
                if (percent < 0) percent = 0;
                if (percent > 1) percent = 1;
                console.log(percent)
                g_state.sigma = percent * 5;
              
                C15.render();
                keepDraggableSvgNotMove();
                fnDrag(event);
            },
            stop: function stop(event) {
                event.stopPropagation();
                keepDraggableSvgNotMove();
            },
        })
        .css("position", "absolute"); // play

        
});


