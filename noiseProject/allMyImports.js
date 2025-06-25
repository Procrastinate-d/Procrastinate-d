function setPixel(x, y, rgba){ // taking note of row width
    var base = (x + (width)*(y)) * 4; // each pixel is 4 entries
    pixels[base] = rgba[0];   pixels[base+1] = rgba[1];
    pixels[base+2] = rgba[2]; pixels[base+3] = rgba[3];
}
function readPixel(x, y){
    var base = (x + (width)*(y)) * 4;
    return [pixels[base], pixels[base+1], pixels[base+2], pixels[base+3]];
}

function posMod(x, p){ return x - floor(x/p)*p; } // -60%360  = -60 or 300, but I need +ve result. python does that.
function invLerp1D(x0, x1, v){  return (v - x0) / (x1 - x0) } // mix?

// FOR NOISE: disable the things above /* else */ to see values that don't make it (flaw)
function valueToGradient(val, colors, positions, enabled=false){ // assuming 0-1, a list of hsv values and a list of their positions (0 to 1)
    if (colors[0].length == undefined) { colors = [colors]; } // must be a list
    // indexList.sort(); if (positions.length != colors.length) return false; // i will trust you 🥹
    if (val <= positions[0]){  return colors[0]; /* under */
    } else if (val >= positions[colors.length-1]){ return colors[colors.length-1]; } /* or -1 index*/
    /* else */
    // if (testCondition){ console.log("testing val "+val);}
    for (let i=0; i<positions.length-1; i++){
        if (val < positions[i+1]){ /* only select one window, right before it eclipses */
            var newval = (val - positions[i])/(positions[i+1] - positions[i]);
            var nextColor = colors[i+1][0];
            if (colors[i][0] > colors[i+1][0] && enabled) {nextColor += 360;}
            // if (testCondition){ console.log(positions[i], positions[i+1]); }
            // if (testCondition){ console.log(val, newval) }
            // if (testCondition){ console.log(lerp((colors[i][0]), (nextColor), newval), lerp(colors[i][1], colors[i+1][1], newval)
            //     , lerp(colors[i][2], colors[i+1][2], newval));}
            return [lerp((colors[i][0]), (nextColor), newval)%360,
                lerp(colors[i][1], colors[i+1][1], newval),
                lerp(colors[i][2], colors[i+1][2], newval)]
        }}
    return [0, 0, 0]; /* impossible */
}
function greyscale_pixel(val){ return [val*255., val*255., val*255, 255]; }
function hsv_pixel(val){ let newColor = hsv_to_rgb([val*360., 1, 1]); newColor.push(255); return newColor; }
function linear_gradient_pixel(val, colors=[[200, 0.9, 0.9], [359, 0.4, 1]], positions=[0, 1], enabled=false){ // hsv
    let newColor = hsv_to_rgb(valueToGradient(val, colors, positions, enabled));
    newColor.push(255); return newColor; }

// ===================================================================


// https://www.rapidtables.com/convert/color/rgb-to-hsv.html
// https://www.geeksforgeeks.org/program-change-rgb-color-model-hsv-color-model/
function rgb_to_hsv(color){
    var r = color[0]/255.; g = color[1]/255.; b = color[2]/255.;
    var Cmax = max(r, g, b); Cmin = min(r, g, b); // V = Cmax
    var h = -1, s = -1; var d = Cmax-Cmin;
    if (Cmax == Cmin){ h = 0; }
    else if (Cmax == r){ h = 60*((g-b)/d % 6) }
    else if (Cmax == g){ h = 60*((b-r)/d + 2) }
    else if (Cmax == b) { h = 60*((r-g)/d + 4) }
    s = (Cmax == 0) ? 0 : d/Cmax;
    return [round(h), s, Cmax]; // 0-360, 1(%), 1(%)
}
function hsv_to_rgb(color){
    var h = color[0]; var s = color[1]; var v = color[2];
    C = v*s;
    X = C*(1-abs((h/60)%2-1));
    m = v-C;
    var r = 0; g = 0; b = 0;
    if (h >= 300){      r = C;        b = X; }
    else if (h >= 240){ r = X;        b = C; }
    else if (h >= 180){        g = X; b = C; }
    else if (h >= 120){        g = C; b = X; }
    else if (h >= 60){  r = X; g = C; }
    else {              r = C; g = X;} // if (h >= 0)
    return [(r+m)*255, (g+m)*255, (b+m)*255 ]
}

// ===================================================================

// Target variables include verbose, timer, timeWait, timeout
// Target function needs to return false (reset timer), "break" or otherwise (= present). Recommended variable targetLength.
async function waitToLoad(targetFunction, myTargetVariables={verbose: false}, base, query, single=true){ 
    if (myTargetVariables.timer == null) { myTargetVariables.timer = 15; }  if (myTargetVariables.timeWait == null) { myTargetVariables.timeWait = 50; } /* initialize default values */
    var timer = 0; var timeout = 0; var elements; 
    while (true){
        if (single) { elements = base.querySelector(query); }
        else { elements = base.querySelectorAll(query); }

        /*wait to load*/                         if (myTargetVariables.verbose) { console.log(timer, '/', myTargetVariables.timer, elements.length, '/', myTargetVariables.targetLength); } 
        myTargetVariables.elements = elements; 
        var outcome = targetFunction(myTargetVariables);
        if (!outcome) { timer = 0; }    /* false case. reset the timer */ 
        else if (outcome == 'break') { console.log('break'); break; }   /* override condition */
        if (myTargetVariables.timeout != null) { if (timeout >= myTargetVariables.timeout) { console.log('timeout'); break; } timeout+= 1; }  /* timeout case */
        timer += 1; await new Promise(r => setTimeout(r, myTargetVariables.timeWait)); 
        if (timer >= myTargetVariables.timer){ if (myTargetVariables.verbose) { console.log("loading finished"); } timer = 0; break; }  /* default case */ 
    }
    return elements;
}
function waitPresent(myTargetVariables){
    var elements = myTargetVariables.elements;
    /* if (myTargetVariables.verbose == false){ console.log(elements.length, '/', myTargetVariables.targetLength); } */
    if (elements == null) { return false; }  /* your selector is wrong */
    if ((myTargetVariables.targetLength == 0) && (elements.length > 0)){ return false; } /* want no elements to exist, but elements exist */
    if (myTargetVariables.targetLength > elements.length) { return false; }   /* does not mean length requirement. */
    return true; }
function waitPresent1(myTargetVariables){
    if (myTargetVariables.elements == null){ return false; };
    return true;
}
var waitsettings = {timer:5, targetLength: 1, verbose: false};


// ========== [NOISE] =============
class NoiseUIManager{
    constructor(box1, box2, NoiseProgramManager){
        // external functions
        this.WTL = waitToLoad.bind(this); 
        this.WP = waitPresent.bind(this); 
        this.WP1 = waitPresent1.bind(this);
        this.WS = waitsettings;


        this.manager = NoiseProgramManager;

        const ePrefix = "ELEMENT_"+this.constructor.name+"_"; this.ePrefix = ePrefix;
        const box1Name = ePrefix+"box1_"+new Date().valueOf();
        const box2Name = ePrefix+"box2_"+new Date().valueOf();
        box1.innerHTML = String.raw`<form autocomplete="off" onsubmit="return false;" id="`+box1Name+`">`;
        box2.innerHTML = String.raw`<form autocomplete="off" onsubmit="return false;" id="`+box2Name+`">`;
        var form1 = box1.querySelector("#"+box1Name);
        var form2 = box2.querySelector("#"+box2Name);    

    // Base Noise features
    form1.innerHTML = 
String.raw`
Coords: <div class="${ePrefix+"display_Circle"}"></div><br/>
Offset: <div class="${ePrefix+"display_Offset"}"></div><br/>
<input type="range" min="-2500" max="2500" value="-1"   class="slider ${ePrefix+"xSlider"}"/>X Offset:  <div class="${ePrefix+"display_xSlider"}">0</div><br/>
<input type="range" min="-2500" max="2500" value="-1"   class="slider ${ePrefix+"ySlider"}"/>Y Offset:  <div class="${ePrefix+"display_ySlider"}">0</div><br/>    
<input type="range" min="0"     max="1000" value="500.5" class="slider ${ePrefix+"fSlider"}"/>Freq:     <div class="${ePrefix+"display_fSlider"}">0.05</div><br/>
<input type="range" min="0"     max="1000" value="273" class="slider ${ePrefix+"rSlider"}"/>Rot:        <div class="${ePrefix+"display_rSlider"}">0.005</div><br/>
<input type="range" min="0"     max="180"  value="0"   class="slider ${ePrefix+"dSlider"}"/>Directions: <div class="${ePrefix+"display_dSlider"}">0</div><br/>

<button class="${ePrefix+"resetBtn"}">Reset</button> Loop: <button class="${ePrefix+"noLoopBtn"}">On</button>
Hooked: <button class="${ePrefix+"hookBtn"}">Off</button><br/>
Inverse: <button class="${ePrefix+"inverseBtn"}">Off</button><br/>

<input type="radio" name="noiseFunc" value="Value"   class="${ePrefix+"noiseFunc"}"        />Value
<input type="radio" name="noiseFunc" value="Perlin"  class="${ePrefix+"noiseFunc"}"        />Perlin
<input type="radio" name="noiseFunc" value="Voronoi" class="${ePrefix+"noiseFunc"}"        />Voronoi
<input type="radio" name="noiseFunc" value="Random"  class="${ePrefix+"noiseFunc"}" checked/>Random<br/>
        `
    // everything else
    form2.innerHTML = 
String.raw`
<table>
<tr><td>Smooth:</td><td>
<input type="radio" name="smoothFunc" value="On"   class="${ePrefix+"smoothFunc"}" checked/>
<input type="radio" name="smoothFunc" value="Off"  class="${ePrefix+"smoothFunc"}"        />
<input type="radio" name="smoothFunc" value="Sine" class="${ePrefix+"smoothFunc"}"        />
</td><td>On / Off / Sine</td></tr>

<tr><td>Color:</td><td>
<input type="radio" name="colorFunc" value="greyscale" class="${ePrefix+"colorFunc"}" checked/>
<input type="radio" name="colorFunc" value="hsv"       class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient1" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient2" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient3" class="${ePrefix+"colorFunc"}"        />
</td><td>Greyscale / HSV / Dream / Temp / Plasma </td></tr>

<tr><td></td><td>
<input type="radio" name="colorFunc" value="gradient4" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient5" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient6" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient7" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient8" class="${ePrefix+"colorFunc"}"        />
</td><td> Magic / Gloom / Thermal / Night / Pastel  </td></tr>

<tr><td>Display:</td><td>
<input type="radio" name="displayMode" value="0" class="${ePrefix+"displayMode"}" checked/>
<input type="radio" name="displayMode" value="3" class="${ePrefix+"displayMode"}"        />
<input type="radio" name="displayMode" value="1" class="${ePrefix+"displayMode"}"        />
<input type="radio" name="displayMode" value="2" class="${ePrefix+"displayMode"}"        />
<input type="radio" name="displayMode" value="4" class="${ePrefix+"displayMode"}"        />
</td><td>Noise / FBM / Box / Box Blend / Closest</td></tr>

<tr><td>Extra:</td><td>
<input type="radio" name="extraMode" value="0" class="${ePrefix+"extraMode"}" checked/>
<input type="radio" name="extraMode" value="1" class="${ePrefix+"extraMode"}" />
<input type="radio" name="extraMode" value="2" class="${ePrefix+"extraMode"}" />
</td><td>None / Gradient / Debug</td></tr>

<tr><td>More:</td><td>
<input type="radio" name="moreMode" value="0" class="${ePrefix+"moreMode"}" checked/>
<input type="radio" name="moreMode" value="1" class="${ePrefix+"moreMode"}" />
</td><td>None / Oil / </td></tr>

</table>
<input type="range" min="0" max="50" value="0"              class="slider ${ePrefix+"cSlider"}"/>Contours:   <div class="${ePrefix+"display_cSlider"}">0</div><br/>
<input type="range" min="1" max="15" value="1"              class="slider ${ePrefix+"zSlider"}"/>Layers:     <div class="${ePrefix+"display_zSlider"}">1</div><br/>
<input type="range" min="1" max="15" value="2" step="0.01"  class="slider ${ePrefix+"lSlider"}"/>Lacunarity: <div class="${ePrefix+"display_lSlider"}">2</div><br/>
<input type="range" min="0" max="2" value="0" step="0.0001" class="slider ${ePrefix+"gSlider"}"/>Gain:       <div class="${ePrefix+"display_gSlider"}">1 / lacunarity</div><br/>
Test: <button class="${ePrefix+"testingBtn"}">Off</button><br/>

<div style="display: none"> Select: <select onchange=""> <option value="perlin">Perlin</option><option value="value">Value</option><option value="voronoi">Voronoi</option> </select><br/> </div>
`
    // 1. Set via innerhtml because i'm lazy
    // 2. Wait to load (both input and output) using "Promises" because I can't await [Note: PROMISE.then(var) => { return <val> }) https://www.youtube.com/watch?v=QO4NXhWo_NM]
    // 3. Set function oninput (call function instead of onload for default value)
    // https://stackoverflow.com/questions/23815294/why-does-addeventlistener-fire-before-the-event-if-at-all
    let target = "";
    if (true) {
    // this.xSlider = this.WTL(this.WP1, this.WS, form1, `[class*="${ePrefix+"xSlider"}"]`); 
    // this.xSlider.then(e => { this.xSlider = e;
    //     this.xSliderText = this.WTL(this.WP1, this.WS, form1, `[class*="${ePrefix+"display_xSlider"}"]`);
    //     this.xSliderText.then(e => { this.xSliderText = e;
    //         });    
    // });

    target = "xSlider";
    this.setupSlider(this, target, form1, this.WP1, this.WS, function (obj, target){
        obj.manager.move(obj[target], obj[target+"Text"]);
        obj[target].addEventListener("input", () => { 
            obj.manager.move(obj[target], obj[target+"Text"]); });         
    });
    target = "ySlider";
    this.setupSlider(this, target, form1, this.WP1, this.WS, function (obj, target){
        obj.manager.move(obj[target], obj[target+"Text"]);
        obj[target].addEventListener("input", () => { 
            obj.manager.move(obj[target], obj[target+"Text"], true); });         
    });
    target = "fSlider";
    this.setupSlider(this, target, form1, this.WP1, this.WS, function (obj, target){
        obj.manager.setSlider(obj[target], 'freq', obj[target+"Text"]);
        obj[target].addEventListener("input", () => { 
            obj.manager.setSlider(obj[target], 'freq', obj[target+"Text"]); });
    });
    target = "rSlider";
    this.setupSlider(this, target, form1, this.WP1, this.WS, function (obj, target){
        obj.manager.setSlider(obj[target], 'rot', obj[target+"Text"]);
        obj[target].addEventListener("input", () => { 
            obj.manager.setSlider(obj[target], 'rot', obj[target+"Text"]); });
    });
    target = "dSlider";
    this.setupSlider(this, target, form1, this.WP1, this.WS, function (obj, target){
        obj.manager.setVal(obj[target], 'N_directions', obj[target+"Text"]);
        obj[target].addEventListener("input", () => { 
            obj.manager.setVal(obj[target], 'N_directions', obj[target+"Text"]); });
    });

    this.noiseFuncBtns = this.WTL(this.WP, {timer: this.WS.timer, targetLength: 4, verbose: false}, form1, `[class*="${ePrefix+"noiseFunc"}"]`, false); 
    this.noiseFuncBtns.then(e => { this.noiseFuncBtns = e;
        for (let i=0; i<this.noiseFuncBtns.length;i++){
            this.noiseFuncBtns[i].addEventListener("click", () => { this.manager.setFunc(this.noiseFuncBtns[i], 'noiseFunc'); }); 
        }
    });

    this.display_Offset = this.WTL(this.WP1, this.WS, form1, `[class*="${ePrefix+"display_Offset"}"]`); 
    this.display_Offset.then(e => { this.display_Offset = e; this.display_Offset.innerHTML = "0 0"; 
        this.manager.display_Offset = this.display_Offset; // to display xOffset/yOffset result
    });

    this.noLoopBtn = this.WTL(this.WP1, this.WS, form1, `[class*="${ePrefix+"noLoopBtn"}"]`); 
    this.noLoopBtn.then(e => { this.noLoopBtn = e;
        this.noLoopBtn.addEventListener("click", () => { 
            const looping = this.manager.toggleNoLoop();
            if (looping){ this.noLoopBtn.innerHTML = "Off"; }
            else{ this.noLoopBtn.innerHTML = "On"; }
        });
    });

    this.hookBtn = this.WTL(this.WP1, this.WS, form1, `[class*="${ePrefix+"hookBtn"}"]`); 
    this.hookBtn.then(e => { this.hookBtn = e;
        this.hookBtn.addEventListener("click", () => { 
            const state = this.manager.toggle("triggerCirclesOnce");
            if (state){ this.hookBtn.innerHTML = "On"; }
            else{ this.hookBtn.innerHTML = "Off"; }
        });
    });
    this.inverseBtn = this.WTL(this.WP1, this.WS, form1, `[class*="${ePrefix+"inverseBtn"}"]`); 
    this.inverseBtn.then(e => { this.inverseBtn = e;
        this.inverseBtn.addEventListener("click", () => { 
            const state = this.manager.toggle("colorInverse");
            if (state){ this.inverseBtn.innerHTML = "On"; }
            else{ this.inverseBtn.innerHTML = "Off"; }
        });
    });
    this.resetBtn = this.WTL(this.WP1, this.WS, form1, `[class*="${ePrefix+"resetBtn"}"]`); 
    this.resetBtn.then(e => { this.resetBtn = e;
        this.resetBtn.addEventListener("click", () => { 
        // reset xSlider, ySlider and so on...
        this.xSlider.value = -1; this.ySlider.value = -1; this.fSlider.value = 500.5;
        this.manager.move(this.xSlider, this.xSliderText);
        this.manager.move(this.ySlider, this.ySliderText, true);
        this.manager.setSlider(this.fSlider, 'freq', this.fSliderText);
        this.manager.resetVar();
        });});
    }

    // Everything else in form2
    if (true){
        this.smoothFuncBtns = this.WTL(this.WP, {timer: this.WS.timer, targetLength: 3, verbose: false}, form2, `[class*="${ePrefix+"smoothFunc"}"]`, false); 
            this.smoothFuncBtns.then(e => { this.smoothFuncBtns = e;
                for (let i=0; i<this.smoothFuncBtns.length;i++){
                    this.smoothFuncBtns[i].addEventListener("click", () => { this.manager.setFunc(this.smoothFuncBtns[i], 'smoothFunc'); }); 
                }
            });
        this.colorFuncBtns = this.WTL(this.WP, {timer: this.WS.timer, targetLength: 10, verbose: false}, form2, `[class*="${ePrefix+"colorFunc"}"]`, false); 
        this.colorFuncBtns.then(e => { this.colorFuncBtns = e;
            for (let i=0; i<this.colorFuncBtns.length;i++){
                this.colorFuncBtns[i].addEventListener("click", () => { this.manager.setFunc(this.colorFuncBtns[i], 'colorFunc'); }); 
            }
        });

        this.displayModeBtns = this.WTL(this.WP, {timer: this.WS.timer, targetLength: 4, verbose: false}, form2, `[class*="${ePrefix+"displayMode"}"]`, false); 
        this.displayModeBtns.then(e => { this.displayModeBtns = e;
            for (let i=0; i<this.displayModeBtns.length;i++){
                this.displayModeBtns[i].addEventListener("click", () => { this.manager.setVal(this.displayModeBtns[i], 'distinctShowMode'); }); 
            }
        });


        this.extraModeBtns = this.WTL(this.WP, {timer: this.WS.timer, targetLength: 3, verbose: false}, form2, `[class*="${ePrefix+"extraMode"}"]`, false); 
        this.extraModeBtns.then(e => { this.extraModeBtns = e;
            for (let i=0; i<this.extraModeBtns.length;i++){
                this.extraModeBtns[i].addEventListener("click", () => { this.manager.setVal(this.extraModeBtns[i], 'extraShowMode'); }); 
            }
        });

        this.moreModeBtns = this.WTL(this.WP, {timer: this.WS.timer, targetLength: 2, verbose: false}, form2, `[class*="${ePrefix+"moreMode"}"]`, false); 
        this.moreModeBtns.then(e => { this.moreModeBtns = e;
            for (let i=0; i<this.moreModeBtns.length;i++){
                this.moreModeBtns[i].addEventListener("click", () => { this.manager.setVal(this.moreModeBtns[i], 'moreShowMode'); }); 
            }
        });

        target = "cSlider";
        this.setupSlider(this, target, form2, this.WP1, this.WS, function (obj, target){
            obj[target].addEventListener("input", () => { obj.manager.setVal(obj[target], "contours", obj[target+"Text"]); }); });

        target = "zSlider";
        this.setupSlider(this, target, form2, this.WP1, this.WS, function (obj, target){
            obj[target].addEventListener("input", () => { obj.manager.setVal(obj[target], "layers", obj[target+"Text"]); }); });

        target = "lSlider";
        this.setupSlider(this, target, form2, this.WP1, this.WS, function (obj, target){
            obj[target].addEventListener("input", () => { obj.manager.setVal(obj[target], "lacunarity", obj[target+"Text"]);  }); });
        
        target = "gSlider";
        this.setupSlider(this, target, form2, this.WP1, this.WS, function (obj, target){
            obj[target].addEventListener("input", () => { obj.manager.setVal(obj[target], "gain", obj[target+"Text"]); 
                    if (obj[target].value == 0){ obj[target+"Text"].innerHTML = "1 / lacunarity";} }) });

        this.testBtn = this.WTL(this.WP1, this.WS, form2, `[class*="${ePrefix+"testingBtn"}"]`); 
        this.testBtn.then(e => { this.testBtn = e;
        this.testBtn.addEventListener("click", () => { 
            const state = this.manager.toggle("testing");
            if (state){ this.testBtn.innerHTML = "On"; } else{ this.testBtn.innerHTML = "Off"; }
        });});
    
    }
    }
    setupSlider(obj, target, base, WP, WS, newFunc){
        let ePrefix = obj.ePrefix;
        obj[target] = obj.WTL(WP, WS, base, `[class*="${ePrefix+target}"]`); 
        obj[target].then(e => { obj[target] = e;
            obj[target+"Text"] = obj.WTL(WP, WS, base, `[class*="${ePrefix+"display_"+target}"]`);
            obj[target+"Text"].then(e => { obj[target+"Text"] = e;
                newFunc(obj, target, base, WP, WS);
            });    
        });

    }

}

function easeInOutSine(t){ return -(Math.cos(Math.PI*t)-1)/2; }
class vec { constructor(x, y){ this.x = x; this.y = y; } // Vector example
    add(vec2){ return new vec(this.x+vec2.x, this.y+vec2.y); }
    sub(vec2){ return new vec(this.x-vec2.x, this.y-vec2.y); }
    mod(vec2){ return new vec( this.x%vec2.x, this.y%vec2.y); }
    wrap(vec2){ return new vec( 
        (this.x == vec2.x) ? 0: this.x,
        (this.y == vec2.y) ? 0: this.y
    ); }
    modn(n){ return new vec(this.x%n, this.y%n); }
} 

class NoiseProgramManager{
    constructor(canvasSize){
        // FUNCTIONS DECLARED OUTSIDE
        this.hsv_pixel = hsv_pixel.bind(this);
        this.greyscale_pixel = greyscale_pixel.bind(this);
        this.easeInOutSine = easeInOutSine.bind(this);
        this.gradient1_pixel = linear_gradient_pixel.bind(this);
        this.gradient2_pixel = function(val, colors=[[0, .9, .9], [80, .2, 1], [170, .2, 1], [250, .9, .9]], positions=[0, .5, .5, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient3_pixel = function(val, colors=[[255, 1, .5], [360, .7, .8], [60, 1, 1]], positions=[0, .5, 1]){ return linear_gradient_pixel(val, colors, positions, true); };
        this.gradient4_pixel = function(val, colors=[[323, 1, 1], [178, 1, 1]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient5_pixel = function(val, colors=[[236, .5, .6], [230, .25, 1]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient6_pixel = function(val, colors=[[0, .9, .9], [260, .9, .9]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient7_pixel = function(val, colors=[[231, 0, 0], [231, 1, .3], [200, .6, .5]], positions=[0, 0.3, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient8_pixel = function(val, colors=[[300, .5, 1], [180, .5, 1], [60, .5, 1]], positions=[0, .5, 1]){ return linear_gradient_pixel(val, colors, positions, true); };
        this.width = canvasSize[0]; this.height = canvasSize[1];
        this.REPEAT_ = [256, 256];
        this.REPEAT = new vec(256, 256);
        this.fixedArray = this.noiseBase2(); // [1]
        this.fixedLengthArray = this.noiseBase2(1); // for voronoi.
        /* note that there is basically no question online that has a "1 random value" limit
         which suggests that having a formulaic way to generate mag+vec 
        (with the capability to be reversed) is... impossible? */
        this.pixelArray = [];
        for (var i = 0; i < this.height; i++) { this.pixelArray[i] = new Array(this.width); }
        this.cloneArray = [];
        for (var i = 0; i < this.height; i++) { this.cloneArray[i] = new Array(this.width); }

        this.xOffsetRate = 0; this.yOffsetRate = 0;
        this.xOffset = 0; this.yOffset = 0; // after applying changeOffset()
        this.display_Offset = null; // element
        this.rot = 0; this.freq = 0.05;
        this.N_directions = 0;
        this.noiseFunc = this.randomNoise.bind(this); // default value noise
        this.noiseFuncMode = "Random";;
        this.smoothFunc = this.smoothie.bind(this);
        this.colorFunc = this.greyscale_pixel.bind(this);
        this.normalizerFunc = this.defaultWrapper.bind(this);
        this.distinctShowMode = 0; // noise vs boxes vs box blend
        this.extraShowMode = "0"; // none vs gradients vs debug
        this.moreShowMode = "0"; // none vs oil 

        this.contours = 0; this.layers = 1; this.lacunarity = 2.; this.gain = 0; 
        this.noLoop = false; 
        this.triggerCirclesFlag = false; this.triggerCirclesOnce = false;
        this.colorInverse = false;
        this.testing = false;

        this.gridPoints = [[-1, -1], [0, -1], [1, -1], 
                            [-1, 0], [0, 0], [1, 0],
                            [-1, 1], [0, 1], [1, 1]];
    }
    defaultWrapper(val, args=""){ return val; }
    /* Helping (General Math) Functions */
    smoothie(t){ return t * t * t * (t * (t * 6 - 15) + 10)}
    dot(A, B){ return (A[0]*B[0] + A[1]*B[1]); }
    roundInt(val, mn, mx){ return Math.floor(val * (mx-mn+1) + mn); }
    remap(val, a, b, c, d) { return (val - a) / (b-a) * (d-c) + c; }
    dist(A, B, C, D){ return Math.sqrt((C-A)**2 + (D-B)**2); }
    
    /* Functions */
    noiseBase2(seed=undefined, maxX=this.REPEAT_[0], maxY=this.REPEAT_[1]){
        if (seed == undefined){ randomSeed(0); } /* from p5js, no native 🥲 */
        var fixedArray = [];
        for (var y = 0; y < maxY; y++){ fixedArray.push([]);
            for (var x = 0; x < maxX; x++){ fixedArray[y].push(random()) }}
        return fixedArray; }

    randomVector(refX, refY){
        var val = this.fixedArray[refX][refY] * 2 * Math.PI;
        /* (Optional) */
        if (this.N_directions != 0){ val = this.remap(this.roundInt(this.fixedArray[refX][refY], 0, this.N_directions)/this.N_directions, 0, 1, 0, 2*Math.PI) }
        return [Math.cos(val), Math.sin(val)]; }
        // return [Math.sqrt(2)*Math.cos(val), Math.sqrt(2)*Math.sin(val)]; } /* for 0.999 range */
    randomCoord(refX, refY){//, w=2**8, h=2**8){ // don't use floats on w/h
        // please pass refX & refY through fit()
        // refY += this.REPEAT_[1]-2; // shift the entire thing up by 2 boxes
        
        // if ((refY%this.REPEAT_[1]) == (this.REPEAT_[1]-1)) return [0.5, 0.5]; // set specific row
        // let even = [refX%2 == 0, refY%2 == 0];
        // if      (even[0] && even[1])   return [0, 0]
        // else if (even[0] && !even[1])  return [0, 1]
        // else if (!even[0] && even[1])  return [1, 0]
        // else if (!even[0] && !even[1]) return [1, 1]
        // // [it goes in a grid.]
        // let t = this.fixedArray[refX][refY] * (w*h) // rescale random value
        // let x1 = t%w/w; let y1 = Math.floor((t-x1)/w)/h
        // if (y1>h){ x1 = 0, y1=0; }
        // return [x1, y1];
        // // [i want a spiral]
        // let t = this.fixedArray[refX][refY]*(12*Math.PI);
        // return [t*Math.cos(t)/76 +0.5, t*Math.sin(t)/76 + 0.5];
        // // [lazy vector]
        let t = this.fixedArray[refX][refY]*(2*Math.PI);
        let D = Math.sqrt(-(Math.abs(this.fixedLengthArray[refX][refY]*2-1))+1)/2;
        // let D = Math.sin(this.fixedLengthArray[refX][refY]*Math.PI)/2; // so that it goes in a circle?
        return [D*Math.cos(t)+0.5, D*Math.sin(t)+0.5];
    }
    perlinNormalizer(n){
        return (n*Math.sqrt(0.5)+0.5); }

    /* Basic Noise Functions */
    randomNoise(x, y){ 
        let repeatX = Math.floor(x%this.REPEAT.x);
        let repeatY = Math.floor(y%this.REPEAT.y);
        return this.fixedArray[repeatX][repeatY]; }    
    valueNoise(x, y){          
        var xCel = Math.floor(x); var xDif = x-xCel; var refX1 = xCel%this.REPEAT_[0]; var refX2 = refX1+1; if (refX2 == this.REPEAT_[0]){ refX2 = 0; }
        var yCel = Math.floor(y); var yDif = y-yCel; var refY1 = yCel%this.REPEAT_[1]; var refY2 = refY1+1; if (refY2 == this.REPEAT_[1]){ refY2 = 0; }
        var c00 = this.fixedArray[refX1][refY1];
        var c10 = this.fixedArray[refX2][refY1];
        var c01 = this.fixedArray[refX1][refY2];
        var c11 = this.fixedArray[refX2][refY2];
        { xDif = this.smoothFunc(xDif); yDif = this.smoothFunc(yDif); }
        var x1 = lerp(c00, c10, xDif); var x2 = lerp(c01, c11, xDif); var val = lerp(x1, x2, yDif); // bilinear interpolation
        return val; }
    perlinNoise(x, y){  
        var xCel = Math.floor(x); var xDif = x-xCel; var refX1 = xCel%this.REPEAT_[0]; var refX2 = refX1+1; if (refX2 == this.REPEAT_[0]){ refX2 = 0; }
        var yCel = Math.floor(y); var yDif = y-yCel; var refY1 = yCel%this.REPEAT_[1]; var refY2 = refY1+1; if (refY2 == this.REPEAT_[1]){ refY2 = 0; }
        var c00 = this.dot(this.randomVector(refX1, refY1), [xDif  ,yDif  ]);
        var c10 = this.dot(this.randomVector(refX2, refY1), [xDif-1,yDif  ]);
        var c01 = this.dot(this.randomVector(refX1, refY2), [xDif  ,yDif-1]);
        var c11 = this.dot(this.randomVector(refX2, refY2), [xDif-1,yDif-1]);
        
        { xDif = this.smoothFunc(xDif); yDif = this.smoothFunc(yDif); }
        var x1 = lerp(c00, c10, xDif); var x2 = lerp(c01, c11, xDif); var val = lerp(x1, x2, yDif);
        return val; 
        }
    closestPoint(x, y){
        var xCel = Math.floor(x); var refX1 = posMod(xCel, this.REPEAT_[0]); 
        var yCel = Math.floor(y); var refY1 = posMod(yCel, this.REPEAT_[1]);
        let cellPos = this.randomCoord(refX1, refY1);
        cellPos = [cellPos[0] + xCel, cellPos[1] + yCel];
        return this.dist(cellPos[0], cellPos[1], x, y)//Math.sqrt(2)
    }
    fit(val, REPEAT){
        // console.log(val, REPEAT)
        if (val >= REPEAT){ return val-REPEAT; }
        if (val < 0){ return REPEAT+val; }
        return val;
    }
    blurNoise(x, y){
        var xCel = Math.floor(x); var refX1 = xCel%this.REPEAT_[0];
        var yCel = Math.floor(y); var refY1 = yCel%this.REPEAT_[1];
        var cellVal = 0;        
        for (let i=0; i<this.gridPoints.length; i++){
            let offset = this.gridPoints[i];
            cellVal += this.fixedArray[this.fit(refX1+offset[0], this.REPEAT_[0])][this.fit(refY1+offset[1], this.REPEAT_[1])]; }
        return cellVal/8;
    }
    // https://www.geeksforgeeks.org/dsa/compute-the-minimum-or-maximum-max-of-two-integers-without-branching/
    min(x,y) { return y + ((x - y) & ((x - y) >> (8 * 4 - 1)));}
    voronoiNoise(x, y){
        var xCel = Math.floor(x); var xDif = x-xCel; var refX1 = xCel%this.REPEAT_[0]; //var refX2 = refX1+1; if (refX2 == this.REPEAT_[0]){ refX2 = 0; }
        var yCel = Math.floor(y); var yDif = y-yCel; var refY1 = yCel%this.REPEAT_[1]; //var refY2 = refY1+1; if (refY2 == this.REPEAT_[1]){ refY2 = 0; }
        // [1] Distance to point in same cell (radial gradient)
        // let cellPos;
        //     cellPos = this.randomCoord(refX1, refY1);
        //     cellPos = [cellPos[0] + xCel, cellPos[1] + yCel];
        // return this.dist(cellPos[0], cellPos[1], x, y)//Math.sqrt(2)

        // [2] Distance to Nth nearest point
        /* i don't know how to optimize, deal with it. */
        const norm = 256; // 
        var minDistance = norm*2;        
        for (let i=0; i<this.gridPoints.length; i++){
            let offset = this.gridPoints[i];
            let cellPos = this.randomCoord(this.fit(refX1+offset[0], this.REPEAT_[0]), this.fit(refY1+offset[1], this.REPEAT_[1]));
            cellPos = [cellPos[0] + offset[0] - xDif, cellPos[1] + offset[1] - yDif ]; // + offset for position relative to center cell at (RefX, RefY) 
            var n = this.dot(cellPos, cellPos);
            // minDistance = min(minDistance, n) = min(minDistance, round(n*(norm)));
            minDistance = this.min(minDistance, round(n*norm));
            // lag central
            // cellPos = [cellPos[0] + offset[0] + xCel , cellPos[1] + offset[1] + yCel ];
            // var n = dist(cellPos[0], cellPos[1], x, y)/Math.sqrt(2);
            // if (n < minDistance){ minDistance = n; }
        }
        return Math.sqrt(minDistance/norm/2)//*Math.sqrt(.5);
        // this.VNH[i] = [n, [refX1+offset[0], refY1+offset[1]], cellPos] // choose minimum n.
        // [3] Distance to nearest border (TBA)
        // for (let i=0; i<this.gridPoints.length; i++){
        // }        

    }
    
    /* Displaying Functions */
    generateImage(){
        if (this.distinctShowMode == 0){
        for (var x = 0; x < this.width; x++){
            for (var y = 0; y < this.height; y++){
                var n = this.noiseFunc((x+this.xOffset)*this.freq, (y+this.yOffset)*this.freq); 
                n = this.normalizerFunc(n);
                this.pixelArray[y][x] = n;
            // if (y > (1/this.freq)){ break; } // 1/f = target pixels for 1 grid cell
        }
    
    }
        } else if (this.distinctShowMode == 3){
            let gain = this.gain; let lacunarity = this.lacunarity;
            if (gain == 0){ gain = 1/lacunarity;}
            var divider = 0; for (let l=0; l<this.layers; l++){ divider += gain**l }
            for (var x = 0; x < this.width; x++){
            for (var y = 0; y < this.height; y++){
                var n = 0; var amplitude = 1; var frequencyX = (x+this.xOffset)*this.freq; var frequencyY = (y+this.yOffset)*this.freq;
                for (let l=0; l<this.layers; l++){
                    n += this.normalizerFunc(this.noiseFunc(frequencyX, frequencyY)) * amplitude;
                    amplitude *= gain; frequencyX *= lacunarity; frequencyY *= lacunarity;

                }
                if (divider != 1.) n/= divider;
                // if (n > val[0]){ val[0] = n;} else if (n < val[1]){ val[1] = n;}
                this.pixelArray[y][x] = n;
                // if (y > (1/f)){ break; } // 1/f = target pixels for 1 grid cell
            }}
        } 
        else if (this.distinctShowMode == 1){
            this.showGradientBoxes();
        } else if (this.distinctShowMode == 2){
            this.averageGradientBoxes();
        } else if (this.distinctShowMode == 4){
            for (var x = 0; x < this.width; x++){
            for (var y = 0; y < this.height; y++){
                this.pixelArray[y][x] = this.closestPoint((x+this.xOffset)*this.freq, (y+this.yOffset)*this.freq);
        }}
        }
    }

    loadImage(){
        for (var y = 0; y < this.pixelArray.length; y++){
            for (var x = 0; x < this.pixelArray[y].length; x++){
                var n = this.pixelArray[y][x];
                if (this.colorInverse){ n = 1-n; }; // cry about it
                setPixel(x, y, this.colorFunc(n));
            }
        }
    }
    /* Miscallaneous */
    showOnTop(){
        if (this.extraShowMode == "1") { this.showGradients(); }
        else if (this.extraShowMode == "2") { this.showGradientBoxDetails(); updatePixels();  }
    }    
    ExtraStuff(){
        if (this.moreShowMode == "1"){
            this.oil();
        }
    }

    basicallyEqual(a, b){ return Math.abs(a-b) < this.freq*0.9999; } /* can't do fixed value because of f=0.03 */
    showGradients(){
        var f = this.freq; if (f > 0.5) { console.log('no gradients 4 u>:('); return;}
        strokeWeight(2); fill(0,0); stroke('#DDDDDD88');
        for (var x = 0; x < (this.width); x++){
            for (var y = 0; y < (this.height); y++){
                
                let x2 = (x+this.xOffset); 
                let y2 = (y+this.yOffset); // console.log(Math.abs(int(x*f)-x*f));
                /* Every cell that at interval */
                if (this.basicallyEqual(int(x2*f, 2), x2*f) && this.basicallyEqual(int(y2*f, 2), y2*f, 2)){
                    var refX1 = Math.floor(x2*f)%this.REPEAT_[0];
                    var refY1 = Math.floor(y2*f)%this.REPEAT_[1];
                    var val = this.randomVector(refX1, refY1);
                    
                    var x1 = Math.floor(x+val[0]); var y1 = Math.floor(y+val[1]);
                    // stroke([random()*64+128, random()*5+50, random()*64+128, 128])
                    line(x1, y1, Math.ceil(x+val[0]/f), Math.ceil(y+val[1]/f)); circle(x, y, 0.1/f);
                } // if (y >= (1/f)){ break; }
            } // if (x >= (1/f)){ break; }
        }
    }
    
    // https://stackoverflow.com/questions/4011793/this-is-undefined-in-javascript-class-methods
    // https://www.google.com/search?q=javascript+pass+a+function+into+another+function+in+clas&client=firefox-b-d&sca_esv=f96236a721133e6f&ei=PxJUaOD1Lr2hnesP_b_fqAs&ved=0ahUKEwigkdabzf2NAxW9UGcHHf3fF7UQ4dUDCBA&uact=5&oq=javascript+pass+a+function+into+another+function+in+clas&gs_lp=Egxnd3Mtd2l6LXNlcnAiOGphdmFzY3JpcHQgcGFzcyBhIGZ1bmN0aW9uIGludG8gYW5vdGhlciBmdW5jdGlvbiBpbiBjbGFzSABQAFgAcAB4AJABAJgBAKABAKoBALgBA8gBAPgBAZgCAKACAJgDAJIHAKAHALIHALgHAMIHAMgHAA&sclient=gws-wiz-serp
    oil(){
        for(let i = 0; i < this.height-1; i++) { this.cloneArray[i] = this.pixelArray[i].slice(); }
        for (let x = 0; x < this.width-1; x++){ for (let y = 0; y < this.height-1; y++){
            if (Math.abs(this.cloneArray[y][x] - this.cloneArray[y+1][x+1]) < 3/255 ){ 
                this.pixelArray[y][x] *= 0.2; }} // darken
    }}

    activateContours(){ /* somehow I don't think this is correct */
        let contours = int(this.contours); 
        if (contours < 1){ return; } // 1x = 0.5, 2x = 0.33, 0.66, 3x = 0.25, 0.5, 0.75
        // possible: check if surrounding pixels difference too high. calculate gradient?
        let allowance = 0.005;
        for (var x = 0; x < this.width; x++){
        for (var y = 0; y < this.height; y++){
            var targetPixel = this.pixelArray[y][x];
            for (let i = 0; i < contours; i++){
                var tgt = ((i+1)/(contours+1));
                if ((targetPixel >= tgt-allowance) && 
                    (targetPixel <= tgt+allowance)){
                    this.pixelArray[y][x] = 0; break; 
                }} 
        }}}

    /* UI HANDLING */
    /* X & Y offset */
    move(slider, sliderText, isY=false){
        var newVal = Math.E**(8*Math.abs(slider.value)/1000.0 -7); if (slider.value < 0) {newVal = -newVal;}
        if (abs(newVal) > 100){ newVal = int(newVal); }
        if (isY){ this.yOffsetRate = newVal; sliderText.innerHTML = round(this.yOffsetRate, 3); return; }
        this.xOffsetRate = newVal; sliderText.innerHTML = round(this.xOffsetRate, 3);
    }
    changeOffset(){
        this.xOffset += this.xOffsetRate; this.yOffset += this.yOffsetRate;
        if (this.xOffset < 0){ this.xOffset = 0; } if (this.yOffset < 0){ this.yOffset = 0; } /* no -ves please :) */
        if (this.display_Offset != null) {
            this.display_Offset.innerHTML = round(this.xOffset, 2).toLocaleString(undefined,{ minimumFractionDigits:2})+" "
                                            +round(this.yOffset, 2).toLocaleString(undefined,{ minimumFractionDigits:2}); return; }
    }
    /* rotation & frequency */
    setSlider(slider, key, sliderText=null){ 
        var newVal = Math.E**(8*slider.value/1000.0 -7); if (newVal < 0.001) {newVal = 0;}
        this[key] = newVal; sliderText.innerHTML = round(newVal, 5); }
    rotateGradients(){
        if ((this.rot == 0) || (this.rot%1 == 0)) {return} /* no change */
        for (var x = 0; x < (this.fixedArray.length); x++){
            for (var y = 0; y < (this.fixedArray[x].length); y++){
                var newVal = this.fixedArray[x][y] + this.rot;
                if (newVal > 1){ newVal = 0; } /* loop back to 0 */
                this.fixedArray[x][y] = newVal;
            }}

        // For voronoi only
        // if (this.displayModeBtns == "4" || this.displayModeBtns == "1"){ }
        // for (var x = 0; x < (this.fixedLengthArray.length); x++){
        //     for (var y = 0; y < (this.fixedLengthArray[x].length); y++){
        //         var newVal = this.fixedLengthArray[x][y] + this.rot;
        //         if (newVal > 1){ newVal = 0; }
        //         this.fixedLengthArray[x][y] = newVal;
        //     }
        // } // it's like a beating heart 🤨
        
    }
    /* reset button */
    resetVar(){ 
        this.fixedArray = this.noiseBase2();
        this.xOffset = 0; this.yOffset = 0; this.freq = 0.05; }
    /* directions */
    setVal(slider, key, sliderText=null){ 
        this[key] = slider.value; 
        if (sliderText != null) {sliderText.innerHTML = this[key];} }

    setFunc(btn, key="noiseFunc"){  
        /* type of noise */
        if (key == "noiseFunc"){
            if (btn.value == "Value"){ this[key] = this.valueNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else if (btn.value == "Perlin"){ this[key] = this.perlinNoise.bind(this); this.normalizerFunc = this.perlinNormalizer.bind(this); }
            else if (btn.value == "Voronoi"){ this[key] = this.voronoiNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else { this[key] = this.randomNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); } /* Random */
            this.noiseFuncMode = btn.value;
        } 
        if (key == "smoothFunc"){
            if (btn.value == "On"){ this[key] = this.smoothie.bind(this); }
            else if (btn.value == "Off"){ this[key] = this.defaultWrapper.bind(this); }
            else if (btn.value == "Sine"){ this[key] = this.easeInOutSine.bind(this); }}
        if (key == "colorFunc"){
            if (btn.value == "greyscale"){ this[key] = this.greyscale_pixel.bind(this); }
            else if (btn.value == "hsv"){ this[key] = this.hsv_pixel.bind(this); }
            else if (btn.value.substr(0, 8) == "gradient"){ 
                this[key] = this[btn.value+"_pixel"]; }
            else {this[key] = this.defaultWrapper.bind(this); }}
    }
    toggleNoLoop(key){
        this.noLoop = !this.noLoop;
        if (this.noLoop){ noLoop(); } else {loop(); }
        return this.noLoop; }
    toggle(key){
        this[key] = !this[key];
        return this[key]; }

    /* Change specific rotations */
    handlePress(){
        if (mouseX < this.width && mouseY < this.height
            // && (Math.abs(this.xOffset) < 5) && (Math.abs(this.yOffset) < 5)
        ){
            // if (mouseX == 0 && mouseY == 0){ return; } // alert('hey'); pre v1.11.8 on firefox this triggers when selecting dropdown menu
            var xOff = this.xOffset; var yOff = this.yOffset; var f = this.freq;
            this.triggerCirclesFlag = !this.triggerCirclesFlag;
            var x = round((mouseX+xOff)*f); var y = round((mouseY+yOff)*f); 
            this.triggerCirclesRef = [x, y]; // (Optional) update once (or each time) 
        }
    }
    triggerCircles(logElement){
    if (this.triggerCirclesFlag){
        // (Optional) offset w/ current time depending on how you're zooming. (tx & ty)
        var tx = this.xOffset; var ty = this.yOffset; var f = this.freq; 
        var mx = mouseX; var my = mouseY;
        logElement.innerHTML = round(mx, 2).toLocaleString(undefined,{ minimumFractionDigits:2})+" "+round(my, 2).toLocaleString(undefined,{ minimumFractionDigits:2});
        stroke('#FFFF00AA'); strokeWeight(15); circle(mx, my, 10);
        
        
        // get the corresponding refX & refY in the fixedArray :)
        // edit the value to where the new mousePos is at
        var x = round((mx+tx)*f); var y = round((my+ty)*f); // boundary of each point will be a square
        // all target points are integers => we can round point. automatically deals with "the invisible borders"
        if (!this.triggerCirclesOnce) { this.triggerCirclesRef = [x, y]; } // (Optional) update each time
        var newX = this.triggerCirclesRef[0]; var newY = this.triggerCirclesRef[1];
        var endX = newX/f - tx; var endY = newY/f - ty;
        stroke('#FF00FFAA'); circle(endX, endY, 10);
        var A = Math.atan((my-endY)/(mx-endX));
        if ((mx-endX) < 0) { A += Math.PI }  // as it doesn't work for the left side :]
        var refX = newX%this.REPEAT_[0]; var refY = newY%this.REPEAT_[1];

        // (Optional) if exactly at (x, y) it becomes black 
        // if ((mouseX == endX) && (mouseY == endY)){ A = 0; }
        try { this.fixedArray[refX][refY] = map(A, 0, 2*Math.PI, 0, 1); } // map degrees/radians to 0-1
        catch( error ){ console.log(error); }
        // or set a fixed value
    }}

    /* completely unnecessary */
    // Note: when I set the pixels, it loops back around so it looks like it got errors on the left. :I
    projLine(v1x, v1y, v2x, v2y, px, py){ /* confirmed https://www.sunshine2k.de/coding/java/PointOnLine/PointOnLine.html */
        var e1x = v2x - v1x; var e1y = v2y - v1y; var e2x = px - v1x; var e2y = py - v1y;
        var val = this.dot([e1x, e1y], [e2x, e2y]); var len2 = e1x * e1x + e1y * e1y;
        var p = [ (v1x + (val*e1x) / len2), (v1y + (val*e1y) / len2) ]
        return p; }

    GradientBoxCalc(x, y, xOff, yOff, f, blendFunc, blendX=0, blendY=0){
        var centerXS = blendFunc((x+xOff)*f) + blendX; var centerYS = blendFunc((y+yOff)*f) + blendY; /* center scaled */
        var centerX = Math.floor(centerXS/f - xOff); var centerY = Math.floor(centerYS/f - yOff); /* 1. Center Point */
        var refX1 = centerXS%this.REPEAT_[0]; var refY1 = centerYS%this.REPEAT_[1];
        var v = this.randomVector(refX1, refY1); var xv = v[0]; var yv = v[1];
        var endX = Math.ceil(centerX + xv/f); var endY = Math.ceil(centerY + yv/f); /* 2. End Point */
        /* Project point to line. (dot product)
        Assume circle end value 1 and given 0.5 is center normalized to (0,0), find value: End-Proj distance */
        var proj = this.projLine(0, 0, (endX-centerX)*f, (endY-centerY)*f, (x-centerX)*f, (y-centerY)*f); /* 3. Projected line */
        var val =  this.dist((endX-centerX)*f, (endY-centerY)*f, proj[0], proj[1]);
        return {centerX, centerY, endX, endY, proj, val};
    }
    showGradientBoxes(){ // non-smooth shows gradients between points
        // for each point's boundary, display its gradient.
       var f = this.freq; 
        for (var x = 0; x < (this.width); x++){
            for (var y = 0; y < (this.height); y++){
            var {centerX, centerY, endX, endY, proj, val} = this.GradientBoxCalc(x, y, this.xOffset, this.yOffset, f, round);
            // if (centerX == 33 && centerY == 33){}  else{ continue; }
            val *= .5; // .5 to see clearly
            this.pixelArray[y][x] = 1-val;
            /* 4. gradient (it's reversed though.) */
    }}}
    averageGradientBoxes(){
        let Vpairs = [[0, 0], [1, 0], [0, 1], [1, 1]]; /* lazy do for each: refX1, refX2, refY1, refY2 */
        var f = this.freq; 
        for (var x = 0; x < (this.width); x++){
            for (var y = 0; y < (this.height); y++){     
            var total = 0 ;
            for (let i = 0; i < Vpairs.length; i++){
                var {centerX, centerY, endX, endY, proj, val} = this.GradientBoxCalc(x, y, this.xOffset, this.yOffset, f, floor, Vpairs[i][0], Vpairs[i][1]);
            total += val; } total /=4 * 2; /* *2 to see better */ 
            this.pixelArray[y][x] = 1-total;
            }}}
    showGradientBoxDetails(){ /* performance will tank */
        var f = this.freq;
        
        for (var x = 0; x < (this.width); x++){
            for (var y = 0; y < (this.height); y++){ 
                var {centerX, centerY, endX, endY, proj, val} = this.GradientBoxCalc(x, y, this.xOffset, this.yOffset, f, round); // REPEATED from showGradientBoxes()
                if (f < 0.06){ setPixel(Math.round(proj[0]/f)+centerX,Math.round(proj[1]/f)+centerY, [0,255,0,255]); } /* projected line */
                if (f < 0.06){ setPixel(int(endX), int(endY), [255, 0, 0 ,255]);} /* end point */
                if (f < 0.06){ setPixel(int(centerX), int(centerY), [255,0,255,255]);} /* target center point */
        }}}
}
