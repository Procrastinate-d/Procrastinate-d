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


// Possible: export/import function
// add/subtract etc.
// recording to gif & loops (idk how)
// Voronoi & FBM is going to be 100% slow, I can't help it
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
<input type="range" min="0"     max="10" value="1" step="0.01" class="slider ${ePrefix+"aSlider"}"/>Amp: <div class="${ePrefix+"display_aSlider"}">1</div><br/>
<input type="range" min="0"     max="1000" value="273" class="slider ${ePrefix+"rSlider"}"/>Rot:        <div class="${ePrefix+"display_rSlider"}">0.005</div><br/>
<input type="range" min="0"     max="180"  value="0"   class="slider ${ePrefix+"dSlider"}"/>Directions: <div class="${ePrefix+"display_dSlider"}">0</div><br/>

<button class="${ePrefix+"resetBtn"}">Reset</button> Loop: <button class="${ePrefix+"noLoopBtn"}">On</button>
Hooked: <button class="${ePrefix+"hookBtn"}">Off</button>
Inverse: <button class="${ePrefix+"inverseBtn"}">Off</button><br/>

<input type="radio" name="noiseFunc" value="Value"     class="${ePrefix+"noiseFunc"}"        /> 
<input type="radio" name="noiseFunc" value="Perlin"    class="${ePrefix+"noiseFunc"}"        /> 
<input type="radio" name="noiseFunc" value="Simplex"    class="${ePrefix+"noiseFunc"}"        /> 
<input type="radio" name="noiseFunc" value="Random"   class="${ePrefix+"noiseFunc"}"        /> Value / Perlin / Simplex / (TBA)
<br/>
<input type="radio" name="noiseFunc" value="Voronoi"   class="${ePrefix+"noiseFunc"}"        /> 
<input type="radio" name="noiseFunc" value="2Voronoi"  class="${ePrefix+"noiseFunc"}"        />
<input type="radio" name="noiseFunc" value="BVoronoi"    class="${ePrefix+"noiseFunc"}"     /> 
<input type="radio" name="noiseFunc" value="Random"  class="${ePrefix+"noiseFunc"}"          /> Voronoi / F2 Voronoi / Border / (TBA)
<br/>
<input type="radio" name="noiseFunc" value="SVoronoi"  class="${ePrefix+"noiseFunc"}"        /> 
<input type="radio" name="noiseFunc" value="FVoronoi"  class="${ePrefix+"noiseFunc"}"        /> 
<input type="radio" name="noiseFunc" value="Sine"    class="${ePrefix+"noiseFunc"}"        />
<input type="radio" name="noiseFunc" value="Random"    class="${ePrefix+"noiseFunc"}" checked/> Smooth V / Flat Voronoi / Sine / Random  <br/>
`
    // everything else
    form2.innerHTML = 
String.raw`
<button class="${ePrefix+"DownloadBtn"}">Download</button>
<button class="${ePrefix+"ExportBtn"}">See Settings</button>
 Min/Max: <div class="${ePrefix+"display_Test"}"></div>
<br/><table>
<tr><td>Smooth:</td><td>
<input type="radio" name="smoothFunc" value="On"   class="${ePrefix+"smoothFunc"}" checked/>
<input type="radio" name="smoothFunc" value="Off"  class="${ePrefix+"smoothFunc"}"        />
<input type="radio" name="smoothFunc" value="Sine" class="${ePrefix+"smoothFunc"}"        />
</td><td>On / Off / Sine </td></tr>

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

<tr><td></td><td>
<input type="radio" name="colorFunc" value="gradient9" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient10" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient11" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient12" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient13" class="${ePrefix+"colorFunc"}"        />
</td><td> Warm / Leaf / Ocean / Rose / Dirt  </td></tr>

<tr><td>Display:</td><td>
<input type="radio" name="displayMode" value="0" class="${ePrefix+"displayMode"}" checked/>
<input type="radio" name="displayMode" value="3" class="${ePrefix+"displayMode"}"        />
<input type="radio" name="displayMode" value="1" class="${ePrefix+"displayMode"}"        />
<input type="radio" name="displayMode" value="2" class="${ePrefix+"displayMode"}"        />
<input type="radio" name="displayMode" value="4" class="${ePrefix+"displayMode"}"        />
</td><td>Noise / FBM / Box / Box Blend / Closest</td></tr>

<tr><td></td><td>
<input type="radio" name="processMode" value="none" class="${ePrefix+"processMode"}" checked />
<input type="radio" name="processMode" value="turbulence" class="${ePrefix+"processMode"}"/>
<input type="radio" name="processMode" value="marble" class="${ePrefix+"processMode"}"       />
<input type="radio" name="processMode" value="wood" class="${ePrefix+"processMode"}"         />
<input type="radio" name="processMode" value="none" class="${ePrefix+"processMode"}"         />
</td><td>None / Turbulence / Marble / Wood / (TBA) </td></tr>

<tr><td>Distance:</td><td>
<input type="radio" name="distMode" value="Dot" class="${ePrefix+"distMode"}" checked/>
<input type="radio" name="distMode" value="Manhattan" class="${ePrefix+"distMode"}" />
<input type="radio" name="distMode" value="Chebyshev" class="${ePrefix+"distMode"}" />
<input type="radio" name="distMode" value="Minkowski" class="${ePrefix+"distMode"}" />
</td><td>Euclidean (Dot) / Manhattan / Chebyshev / Minkowski </td></tr>


<tr><td>F2 Variation:</td><td>
<input type="radio" name="F2VMode" value="0" class="${ePrefix+"F2VMode"}" checked/>
<input type="radio" name="F2VMode" value="1" class="${ePrefix+"F2VMode"}" />
<input type="radio" name="F2VMode" value="2" class="${ePrefix+"F2VMode"}" />
<input type="radio" name="F2VMode" value="3" class="${ePrefix+"F2VMode"}" />
<input type="radio" name="F2VMode" value="4" class="${ePrefix+"F2VMode"}" />
</td><td>F2 / Flat / F2 - F1 / Watery / Bacteria </td></tr>

<tr><td>Extra:</td><td>
<input type="radio" name="extraMode" value="0" class="${ePrefix+"extraMode"}" checked/>
<input type="radio" name="extraMode" value="1" class="${ePrefix+"extraMode"}" />
<input type="radio" name="extraMode" value="2" class="${ePrefix+"extraMode"}" />
</td><td>None / Gradient / Debug</td></tr>

<tr><td>More:</td><td>
<input type="radio" name="moreMode" value="0" class="${ePrefix+"moreMode"}" checked/>
<input type="radio" name="moreMode" value="1" class="${ePrefix+"moreMode"}" />
<input type="radio" name="moreMode" value="2" class="${ePrefix+"moreMode"}" />
</td><td>None / Oil / Grid </td></tr>

</table>
<input type="range" min="0" max="50" value="0"              class="slider ${ePrefix+"cSlider"}"/>Contours:   <div class="${ePrefix+"display_cSlider"}">0</div><br/>
<input type="range" min="1" max="15" value="1"              class="slider ${ePrefix+"zSlider"}"/>Layers:     <div class="${ePrefix+"display_zSlider"}">1</div><br/>
<input type="range" min="1" max="15" value="2" step="0.01"  class="slider ${ePrefix+"lSlider"}"/>Lacunarity: <div class="${ePrefix+"display_lSlider"}">2</div><br/>
<input type="range" min="0" max="2" value="0" step="0.0001" class="slider ${ePrefix+"gSlider"}"/>Gain:       <div class="${ePrefix+"display_gSlider"}">1 / lacunarity</div><br/>
<input type="range" min="1" max="1500" value="100"          class="slider ${ePrefix+"mSlider"}"/>Marbles:    <div class="${ePrefix+"display_mSlider"}">100</div><div style="font-size:10px">(use FBM)</div><br/>
<input type="range" min="1" max="25" value="2" step="0.01"  class="slider ${ePrefix+"wSlider"}"/>Woods:      <div class="${ePrefix+"display_wSlider"}">2</div><br/>
<input type="range" min="1" max="256" value="256"           class="slider ${ePrefix+"uSlider"}"/>RepeatX:    <div class="${ePrefix+"display_uSlider"}">256</div><br/>
<input type="range" min="1" max="256" value="256"           class="slider ${ePrefix+"vSlider"}"/>RepeatY:    <div class="${ePrefix+"display_vSlider"}">256</div><br/>
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
    target = "aSlider";
    this.setupSlider(this, target, form1, this.WP1, this.WS, function (obj, target){
        obj.manager.setVal(obj[target], 'amp', obj[target+"Text"]);
        obj[target].addEventListener("input", () => { 
            obj.manager.setVal(obj[target], 'amp', obj[target+"Text"]); });
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
        this.xSlider.value = -1; this.ySlider.value = -1; this.fSlider.value = 500.5; this.aSlider.value = 1; // reset position of sliders
        this.manager.move(this.xSlider, this.xSliderText); // set display value
        this.manager.move(this.ySlider, this.ySliderText, true);
        this.manager.setSlider(this.fSlider, 'freq', this.fSliderText);
        this.manager.setVal(this.aSlider, 'amp', this.aSliderText);
        this.manager.resetVar(); // reset values in object
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
        this.colorFuncBtns = this.WTL(this.WP, {timer: this.WS.timer, targetLength: 15, verbose: false}, form2, `[class*="${ePrefix+"colorFunc"}"]`, false); 
        this.colorFuncBtns.then(e => { this.colorFuncBtns = e;
            for (let i=0; i<this.colorFuncBtns.length;i++){
                this.colorFuncBtns[i].addEventListener("click", () => { this.manager.setFunc(this.colorFuncBtns[i], 'colorFunc'); }); 
            }
        });

        this.displayModeBtns = this.WTL(this.WP, {timer: this.WS.timer, targetLength: 5, verbose: false}, form2, `[class*="${ePrefix+"displayMode"}"]`, false); 
        this.displayModeBtns.then(e => { this.displayModeBtns = e;
            for (let i=0; i<this.displayModeBtns.length;i++){
                this.displayModeBtns[i].addEventListener("click", () => { this.manager.setVal(this.displayModeBtns[i], 'distinctShowMode'); }); 
            }
        });
        this.processModeBtns = this.WTL(this.WP, {timer: this.WS.timer, targetLength: 5, verbose: false}, form2, `[class*="${ePrefix+"processMode"}"]`, false); 
        this.processModeBtns.then(e => { this.processModeBtns = e;
            for (let i=0; i<this.processModeBtns.length;i++){
                this.processModeBtns[i].addEventListener("click", () => { this.manager.setFunc(this.processModeBtns[i], 'processFunc'); }); 
            }
        });
        this.distModeBtns = this.WTL(this.WP, {timer: this.WS.timer, targetLength: 4, verbose: false}, form2, `[class*="${ePrefix+"distMode"}"]`, false); 
        this.distModeBtns.then(e => { this.distModeBtns = e;
            for (let i=0; i<this.distModeBtns.length;i++){
                this.distModeBtns[i].addEventListener("click", () => { this.manager.setFunc(this.distModeBtns[i], 'distFunc'); }); 
            }
        });
        // THERE'S MORE?! aww man https://www.google.com/search?sca_esv=000223f181a12c46&rlz=1C1UEAD_enSG1121SG1121&q=distance+metrics&udm=2&fbs=AIIjpHxU7SXXniUZfeShr2fp4giZ1Y6MJ25_tmWITc7uy4KIeoJTKjrFjVxydQWqI2NcOhZVmrJB8DQUK5IzxA2fZbQF4YL5sNSRJGgx0e9Z9AxExzjE4_ynshmXB4KOs3cwRUeqSxtyEph1-LMoYoz7AgsxiAlRbfQlh62fpf4TvoMmLeIHIDQBlO9bBf83uliUCcabaD8ejPu9aoigNJtiQ30WOIRP0w&sa=X&ved=2ahUKEwjr7v7f3pGOAxVjxDgGHSZ7E8MQtKgLKAF6BAgeEAE&biw=818&bih=730&dpr=1.25#vhid=WgMMWnlacsNcwM&vssid=mosaic
        // HOW did people invent >5+ ways to calculate distance?

        this.F2VModeBtns = this.WTL(this.WP, {timer: this.WS.timer, targetLength: 5, verbose: false}, form2, `[class*="${ePrefix+"F2VMode"}"]`, false); 
        this.F2VModeBtns.then(e => { this.F2VModeBtns = e;
            for (let i=0; i<this.F2VModeBtns.length;i++){
                this.F2VModeBtns[i].addEventListener("click", () => { this.manager.setVal(this.F2VModeBtns[i], 'F2VMode'); }); 
            }
        });

        this.extraModeBtns = this.WTL(this.WP, {timer: this.WS.timer, targetLength: 3, verbose: false}, form2, `[class*="${ePrefix+"extraMode"}"]`, false); 
        this.extraModeBtns.then(e => { this.extraModeBtns = e;
            for (let i=0; i<this.extraModeBtns.length;i++){
                this.extraModeBtns[i].addEventListener("click", () => { this.manager.setVal(this.extraModeBtns[i], 'extraShowMode'); }); 
            }
        });

        this.moreModeBtns = this.WTL(this.WP, {timer: this.WS.timer, targetLength: 3, verbose: false}, form2, `[class*="${ePrefix+"moreMode"}"]`, false); 
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

        target = "mSlider";
        this.setupSlider(this, target, form2, this.WP1, this.WS, function (obj, target){
            obj[target].addEventListener("input", () => { obj.manager.setVal(obj[target], "marbles", obj[target+"Text"]);  }); });
        target = "wSlider";
        this.setupSlider(this, target, form2, this.WP1, this.WS, function (obj, target){
            obj[target].addEventListener("input", () => { obj.manager.setVal(obj[target], "woods", obj[target+"Text"]);  }); });
        
        this.downloadBtn = this.WTL(this.WP1, this.WS, form2, `[class*="${ePrefix+"DownloadBtn"}"]`); 
        this.downloadBtn.then(e => { this.downloadBtn = e;
        this.downloadBtn.addEventListener("click", () => {
            this.saveCanvasImage();
        });});
        target = "uSlider";
        this.setupSlider(this, target, form2, this.WP1, this.WS, function (obj, target){
            obj[target].addEventListener("input", () => { 
                obj.manager.setVal(obj[target], 'REPEATX', obj[target+"Text"]); });
        });
        target = "vSlider";
        this.setupSlider(this, target, form2, this.WP1, this.WS, function (obj, target){
        obj[target].addEventListener("input", () => { 
            obj.manager.setVal(obj[target], 'REPEATY', obj[target+"Text"]); });
        });

        this.exportBtn = this.WTL(this.WP1, this.WS, form2, `[class*="${ePrefix+"ExportBtn"}"]`); 
        this.exportBtn.then(e => { this.exportBtn = e;
        this.exportBtn.addEventListener("click", () => {
            this.exportSettings(document.querySelector("#InputTextArea"));
        });});

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
    // https://stackoverflow.com/questions/8126623/downloading-canvas-element-to-an-image
    saveCanvasImage(){
    var link = document.createElement('a');
    link.download = 'savenoise'+new Date().valueOf()+'.jpeg';
    link.href = document.getElementById('defaultCanvas0').toDataURL("image/jpeg");
    link.click();
    }
    exportSettings(element){
        let keys = Object.keys(this.manager);
        let copyText = ""; // \u200b huh https://stackoverflow.com/questions/64328549/remove-u200b-in-vs-code
        let includeKeys = ["width", "height", "REPEATX", "REPEATY", "xOffsetRate", "yOffsetRate", "xOffset", "yOffset", 
            "rot", "freq", "amp", "N_directions",
            "noiseFuncMode", "smoothFuncMode", "colorFuncMode", "processFuncMode",
            "distinctShowMode", "extraShowMode", "moreShowMode",
            "noLoop", "triggerCirclesOnce", "colorInverse", "F2VMode", 
            "vnorm", "layers", "lacunarity", "gain", 
            "contours", "woods", "marbles", 
            "testFactor", "testing"];
// "normalizerFunc", "noiseFunc", distMode, processMode, colorMode, smoothMode, "fixedArray", "fixedLengthArray
        // for (let k=0;k<keys.length; k++){ if (includeKeys.indexOf(keys[k]) > 0){ copyText += `"${keys[k]}": ${(gn[keys[k]]).toString()}\n`; }}
        for (let k=0;k<includeKeys.length; k++) { copyText += `"${includeKeys[k]}": ${(gn[includeKeys[k]]).toString()}\n`;  }

        element.innerHTML = copyText;
        // i'm not setting the sliders tho
    }
}

function easeInOutSine(t){ return -(Math.cos(Math.PI*t)-1)/2; }
class NoiseProgramManager{
    constructor(canvasSize){
        // FUNCTIONS DECLARED OUTSIDE
        this.hsv_pixel = hsv_pixel.bind(this);
        this.greyscale_pixel = greyscale_pixel.bind(this);
        this.easeInOutSine = easeInOutSine.bind(this);
        this.gradient1_pixel = linear_gradient_pixel.bind(this);
        this.gradient2_pixel = function(val, colors=[[0, .9, .9], [80, .2, 1], [170, .2, 1], [250, .9, .9]], positions=[0, .5, .5, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient3_pixel = function(val, colors=[[255, 1, .5], [360, .7, .8], [60, 1, 1]], positions=[0, .5, 1]){ return linear_gradient_pixel(val, colors, positions, true); };
        
        this.gradient4_pixel = function(val, colors=[[323, 1, 1], [150, 1, 1]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient5_pixel = function(val, colors=[[236, .5, .6], [230, .25, 1]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient6_pixel = function(val, colors=[[0, .9, .9], [260, .9, .9]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient7_pixel = function(val, colors=[[231, 0, 0], [231, 1, .3], [200, .6, .5]], positions=[0, 0.3, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient8_pixel = function(val, colors=[[300, .5, 1], [180, .5, 1], [60, .5, 1]], positions=[0, .5, 1]){ return linear_gradient_pixel(val, colors, positions, true); };

        this.gradient9_pixel = function(val, colors=[[0, .8, .7], [69, 1, 1]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        // this.gradient10_pixel = function(val, colors=[[20, 1, 1], [33, 1, 1], [50, .5, 0], [220, .5, 0], [220, .6, .6], [242, 1, .4]], positions=[0, .3, .5, .5, .7, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient10_pixel = function(val, colors=[[80, .8, 1], [115, 1, .4]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient11_pixel = function(val, colors=[[234, 1, .4], [195, 1, .7], [195, 0, .9]], positions=[0, .5, 1]){ return linear_gradient_pixel(val, colors, positions); };  // hsl!!! is bad in the case where dark green => blue
        this.gradient12_pixel = function(val, colors=[[285, .5, .5], [297, .4, .7], [307, .3, .8], [350, .8, .9]], positions=[0, .2, .5, 1]){ return linear_gradient_pixel(val, colors, positions, true); };
        this.gradient13_pixel = function(val, colors=[[28, .5, .8], [20, .8, .4], [15, .4, .5]], positions=[0, .7, 1]){ return linear_gradient_pixel(val, colors, positions); };

        this.width = canvasSize[0]; this.height = canvasSize[1];
        this.REPEAT = [256, 256]; // please don't dynamically change it to be bigger :)
        this.REPEAT_ = [256, 256];
        this.REPEATX = 256; this.REPEATY = 256;  // dynamically enlarge this instead
        
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
        this.rot = 0; this.freq = 0.05; this.amp = 1;
        this.N_directions = 0;
        this.noiseFuncMode = "Random", this.smoothFuncMode = "On", this.colorFuncMode = "grayscale", this.processFuncMode = "None";
        this.distFuncMode = "Dot";
        this.noiseFunc = this.randomNoise.bind(this); this.smoothFunc = this.smoothie.bind(this); this.colorFunc = this.greyscale_pixel.bind(this); this.processFunc = this.defaultWrapper.bind(this); 
        this.distFunc = this.dotHandler.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this);
        this.distFunc2 = this.dot.bind(this);
        
        this.distinctShowMode = 0; // noise vs boxes vs box blend
        this.extraShowMode = "0"; // none vs gradients vs debug
        this.moreShowMode = "0"; // none vs oil vs grid

        this.contours = 0; this.layers = 1; this.lacunarity = 2.; this.gain = 0; 
        this.noLoop = false; this.triggerCirclesFlag = false; this.triggerCirclesOnce = false; this.colorInverse = false;
        this.marbles = 100; this.woods = 2; //this.roundNum = 1;
        this.F2VMode = 0; this.vnorm = 256; 
        this.testing = false; this.testFactor = 4;
                
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
    
    /* Other distance formulas */
    manhattan(A, B){ return Math.abs(B[0]-A[0]) + Math.abs(B[1]-A[1]); }
    chebyshev(A, B){ return Math.max(Math.abs(B[0]-A[0]), Math.abs(B[1]-A[1])); }
    minkowski(A, B, h=4){ return ((B[0]-A[0])**h + (B[1]-A[1])**h)**(1/h); }
    // manhattan(A, B, C, D){ return Math.abs(C-A) + Math.abs(D-B); }
    // chebyshev(A, B, C, D){ return Math.max(Math.abs(C-A), Math.abs((D-B)); }
    // minkowski(A, B, C, D, h=4){ return pow((C-A)**h + (D-B)**h, 1/h); }
    dotHandler(cellPos){ return (cellPos[0]*cellPos[0] + cellPos[1]*cellPos[1]); }
    manhattanHandler(cellPos){ return Math.abs(cellPos[0]) + Math.abs(cellPos[1]); }
    chebyshevHandler(cellPos){ return Math.max(Math.abs(cellPos[0]), Math.abs(cellPos[1])) ; }
    minkowskiHandler(cellPos, h=4){ return ((cellPos[0])**h + (cellPos[1])**h)**(1/h) ; } 
    // ^^^ try -1 on smooth voronoi 
    manhattanHandler2(A, B){ return (Math.abs(B[0]-A[0]) + Math.abs(B[1]-A[1])) -1; } // it was too bright so -1
    chebyshevHandler2(A, B){ return (Math.max(Math.abs(B[0]-A[0]), Math.abs(B[1]-A[1]))) -1 }
    minkowskiHandler2(A, B, h=4){ return (((B[0]-A[0])**h + (B[1]-A[1])**h)**(1/h)) -1; }
    
    /* Functions */
    noiseBase2(seed=undefined, maxX=this.REPEAT[0], maxY=this.REPEAT[1]){
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

        let t;
        if (this.N_directions != 0){ t = this.remap(this.roundInt(this.fixedArray[refX][refY], 0, this.N_directions)/this.N_directions, 0, 1, 0, 2*Math.PI); }
        else { t = this.fixedArray[refX][refY]*(2*Math.PI); }

        let D = Math.sqrt(-(Math.abs(this.fixedLengthArray[refX][refY]*2-1))+1)/2;
        // let D = Math.sin(this.fixedLengthArray[refX][refY]*Math.PI)/2; // so that it goes in a circle?
        return [D*Math.cos(t)+0.5, D*Math.sin(t)+0.5];
        
    }
    perlinNormalizer(n){ return (n*Math.sqrt(0.5)+0.5); }
    // simplexNormalizer(n){ return (n*Math.sqrt(0.5)+0.5); }  // -0.7. return (n+1)/2;
    // voronoiNormalizer(n){ return n*=1.13; } // i don't actually know :P

    /* Basic Noise Functions */
    randomNoise(x, y){ 
        let repeatX = Math.floor(x%this.REPEAT_[0]);
        let repeatY = Math.floor(y%this.REPEAT_[1]);
        return this.fixedArray[repeatX][repeatY]; } 
    sineNoise(x, y){
        return (Math.sin(x)*Math.sin(y)+1)/2; // is it \sin\left(x\right)\cdot\sin\left(x+a\right)
    }
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
        var c00 = this.distFunc2(this.randomVector(refX1, refY1), [xDif  ,yDif  ]); // dot
        var c10 = this.distFunc2(this.randomVector(refX2, refY1), [xDif-1,yDif  ]);
        var c01 = this.distFunc2(this.randomVector(refX1, refY2), [xDif  ,yDif-1]);
        var c11 = this.distFunc2(this.randomVector(refX2, refY2), [xDif-1,yDif-1]);
        { xDif = this.smoothFunc(xDif); yDif = this.smoothFunc(yDif); }
        var x1 = lerp(c00, c10, xDif); var x2 = lerp(c01, c11, xDif); var val = lerp(x1, x2, yDif);
        return val; 
        }
    points = [[1,1], [-1, 1], [1, -1], [-1, -1]];
    F2 = 0.5*(Math.sqrt(3)-1); //  0.36602540378 
    G2 = (3 - Math.sqrt(3))/6; // 0.2113248654 
    simplexNoise(x, y){
        var n0, n1, n2; // Noise from 3 corners.
        let s = (x+y)*this.F2; // "hairy factor" skew input space
        let i = Math.floor(x+s); // wow \( O <O)/   i don't get it
        let j = Math.floor(y+s);
        // let i = Math.floor(0.5*((1+Math.sqrt(3))*x - (1-Math.sqrt(3))*y));
        // let j = Math.floor(0.5*(-(1-Math.sqrt(3))*x + (1+Math.sqrt(3))*y));
        // see grid
        // return this.fixedArray[this.fit(i, this.REPEAT_[0])][this.fit(j, this.REPEAT_[1])];
        // console.log(i, j, i2, j2);
        // noLoop();
        // return (i%1.5+j%1.5)/2;

        let t = (i+j)*this.G2; // need to % it >:(
        // return ((i-t)**2 + (j-t)**2)**.5;

        // t = this.smoothFunc(t%1)+ Math.floor(t);
        let X0 = i-t; // unskew?
        let Y0 = j-t;
        let x0 = x-X0; // x y dist from cell origin
        let y0 = y-Y0;
        
        let i1, j1; // offsets for 2nd middle corner of simplex (i, j) coords?
        if (x0 > y0){ i1 = 1; j1 = 0; }  // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else { i1 = 0; j1 = 1;}   // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        let x1 = x0-i1 +this.G2; // Offsets for middle corner in (x,y) unskewed coords
        let y1 = y0-j1 +this.G2;
        let x2 = x0-1.0 +2.*this.G2;  // Offsets for last corner in (x,y) unskewed coords
        let y2 = y0-1.0 +2.*this.G2;

        let ii = i%this.REPEAT_[0], jj = j%this.REPEAT_[1];
        // let gi0 = int(posMod(round(this.fixedArray[ii][jj]*20),       4)); // wrong
        // ok is there an easier way to loop it back around than constantly repeating REPEAT_
        let gi0 = this.randomVector(ii, jj);
        let gi1 = this.randomVector(this.fit(ii+i1, this.REPEAT_[0]), this.fit(jj+j1, this.REPEAT_[1]));
        let gi2 = this.randomVector(this.fit(ii+1, this.REPEAT_[0]), this.fit(jj+1, this.REPEAT_[1]));
        // Work out the hashed gradient indices of the three simplex corners
        
        // gi0 = [gi0[0]*this.testFactor, gi0[1]*this.testFactor];
        // gi1 = [gi1[0]*this.testFactor, gi1[1]*this.testFactor];
        // gi2 = [gi2[0]*this.testFactor, gi2[1]*this.testFactor];
        // contribution from the three corners
        let t0 = 0.5 - x0*x0-y0*y0;
        if (t0 < 0){ n0 = 0;}
        else { t0 *= t0; 
            n0 = t0*t0 * this.distFunc2(gi0, [x0, y0]);
        }
        let t1 = 0.5 - x1*x1-y1*y1;
        if (t1 < 0){ n1 = 0;}
        else { t1 *= t1; 
            n1 = t1*t1 * this.distFunc2(gi1, [x1, y1]);
        }
        let t2 = 0.5 - x2*x2-y2*y2;
        if (t2 < 0){ n2 = 0;}
        else { t2 *= t2; 
            n2 = t2*t2 * this.distFunc2(gi2, [x2, y2]);
        }
        return 70*(n0+n1+n2)
    } // normalize the same as perlin
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
    min(x,y) { return y + ((x - y) & ((x - y) >> (8 * 4 - 1)));} // don't use floats, so i use this.vnorm
    // is there a way to sort only the first two and leave? probably.
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
        var minDistance = this.vnorm*2, cellPos, n;        
        for (let i=0; i<this.gridPoints.length; i++){
            // let offset = this.gridPoints[i];
            cellPos = this.randomCoord(this.fit(refX1+this.gridPoints[i][0], this.REPEAT_[0]), this.fit(refY1+this.gridPoints[i][1], this.REPEAT_[1]));
            cellPos = [cellPos[0] + this.gridPoints[i][0] - xDif, cellPos[1] + this.gridPoints[i][1] - yDif ]; // + offset for position relative to center cell at (RefX, RefY) 
           
            // n = this.dot(cellPos, cellPos);
            // n = this.manhattan([0, 0], cellPos); // wow... that's it?
            // n = this.chebyshev([0, 0], cellPos);
            // n = this.minkowski([0, 0], cellPos, this.testFactor); // floats are bad. 1 is bad. odd numbers are bad.
            n = this.distFunc(cellPos);

            // minDistance = min(minDistance, n) = min(minDistance, round(n*(this.vnorm)));
            minDistance = this.min(minDistance, round(n*this.vnorm));
            // lag central
            // cellPos = [cellPos[0] + offset[0] + xCel , cellPos[1] + offset[1] + yCel ];
            // var n = dist(cellPos[0], cellPos[1], x, y)/Math.sqrt(2);
            // if (n < minDistance){ minDistance = n; }
        }
        // return this.smoothFunc(minDistance/this.vnorm)
        return this.smoothFunc(Math.sqrt(minDistance/this.vnorm/2)); //*Math.sqrt(.5);
        // [3] Distance to nearest border
        // for (let i=0; i<this.gridPoints.length; i++){ ... }        
    }
    // ======================================================================
    // yes it's all the same code >:(
    flatvoronoiNoise(x, y){
        var xCel = Math.floor(x); var xDif = x-xCel; var refX1 = xCel%this.REPEAT_[0];
        var yCel = Math.floor(y); var yDif = y-yCel; var refY1 = yCel%this.REPEAT_[1];
        var minDistance = this.vnorm*2;  
        var minCellVal = 0, fitted, cellPos, n;
        for (let i=0; i<this.gridPoints.length; i++){
            // let offset = this.gridPoints[i];
            fitted = [this.fit(refX1+this.gridPoints[i][0], this.REPEAT_[0]), this.fit(refY1+this.gridPoints[i][1], this.REPEAT_[1])]
            cellPos = this.randomCoord(fitted[0], fitted[1]);
            cellPos = [cellPos[0] + this.gridPoints[i][0] - xDif, cellPos[1] + this.gridPoints[i][1] - yDif ]; // + offset for position relative to center cell at (RefX, RefY) 
            // n = this.dot(cellPos, cellPos);
            n = this.distFunc(cellPos);
            n = round(n*this.vnorm);
            if (n < minDistance){ minDistance = n;
                // Choose any
                // minCellVal = this.fixedArray[fitted[0]][fitted[1]];
                minCellVal = this.fixedLengthArray[fitted[0]][fitted[1]];
                // minCellVal = (this.fixedLengthArray[fitted[0]][fitted[1]] + this.fixedArray[fitted[0]][fitted[1]])/2;
            }
        }
        return this.smoothFunc(minCellVal);
    }
    F2voronoiNoise(x, y){ // Extremly slow
        var xCel = Math.floor(x); var xDif = x-xCel; var refX1 = xCel%this.REPEAT_[0];
        var yCel = Math.floor(y); var yDif = y-yCel; var refY1 = yCel%this.REPEAT_[1];
        var minDistances = [], fitted, cellPos, n;
        for (let i=0; i<this.gridPoints.length; i++){
            fitted = [this.fit(refX1+this.gridPoints[i][0], this.REPEAT_[0]), this.fit(refY1+this.gridPoints[i][1], this.REPEAT_[1])]
            cellPos = this.randomCoord(fitted[0], fitted[1]);
            cellPos = [cellPos[0] + this.gridPoints[i][0] - xDif, cellPos[1] + this.gridPoints[i][1] - yDif ]; // + offset for position relative to center cell at (RefX, RefY) 
            n = this.distFunc(cellPos);
            // n = this.dot(cellPos, cellPos);
            // n = this.manhattan([0, 0], cellPos);
            // n = this.chebyshev([0, 0], cellPos);
            // n = this.minkowski([0, 0], cellPos, this.testFactor); 
            minDistances.push(n);
        }
        // https://stackoverflow.com/questions/42484022/efficient-way-of-computing-second-min-value
        // minDistances.sort();
        // return this.smoothFunc(Math.sqrt(minDistances[1]/2)); // there are weird borders sometimes with F3 and beyond, but maybe my math is just wrong
        // return this.smoothFunc(Math.sqrt((minDistances[0]+minDistances[1])/4));
        let firstMin = min(minDistances);
        let firstMinID = minDistances.indexOf(firstMin);  // ouch
        if (this.F2VMode == 1){
            let secMinID = minDistances.indexOf(min(minDistances.slice(0, firstMinID).concat(minDistances.slice(firstMinID+1)))); // without slicing
            let fitted = [this.fit(refX1+this.gridPoints[secMinID][0], this.REPEAT_[0]), this.fit(refY1+this.gridPoints[secMinID][1], this.REPEAT_[1])]
            return this.fixedLengthArray[fitted[0]][fitted[1]];
        }

        minDistances = minDistances.slice(0, firstMinID).concat(minDistances.slice(firstMinID+1)); // ouuuuch
        if (this.F2VMode == 0){ return this.smoothFunc(Math.sqrt(min(minDistances) )/2); // welp i tried
        } else if (this.F2VMode == 2){ return this.smoothFunc(Math.sqrt((min(minDistances) - firstMin) )/2);
        } else if (this.F2VMode == 3){ return this.smoothFunc((Math.sqrt(min(minDistances) + Math.sqrt(firstMin)) )/2); // watery
        } return this.smoothFunc((Math.sqrt(min(minDistances)) + Math.sqrt(firstMin))/2 ); // bacteria-y
    } // didn't check the range 😋

    // https://iquilezles.org/articles/smoothvoronoi/
    smoothvoronoiNoise(x, y){
        var xCel = Math.floor(x); var xDif = x-xCel; var refX1 = xCel%this.REPEAT_[0];
        var yCel = Math.floor(y); var yDif = y-yCel; var refY1 = yCel%this.REPEAT_[1];
        var smoothDistance = 0, offset, cellPos, n;        
        for (let i=0; i<this.gridPoints.length; i++){
            offset = this.gridPoints[i];
            cellPos = this.randomCoord(this.fit(refX1+offset[0], this.REPEAT_[0]), this.fit(refY1+offset[1], this.REPEAT_[1]));
            cellPos = [cellPos[0] + offset[0] - xDif, cellPos[1] + offset[1] - yDif ]; 
            // n = this.dot(cellPos, cellPos);
            n = this.distFunc(cellPos);
            smoothDistance += 1.0/pow( n, 8.0 );
        } 
        return this.smoothFunc(pow( 1.0/smoothDistance, 1.0/16.0)); 
    }
    bordervoronoiNoise(x,y){
        var xCel = Math.floor(x); var xDif = x-xCel; var refX1 = xCel%this.REPEAT_[0]; 
        var yCel = Math.floor(y); var yDif = y-yCel; var refY1 = yCel%this.REPEAT_[1]; 
        let cellPos = []; // the 9 looped calculations stored in array.   // minCellRef, minCellPos
        let minDistance = this.vnorm*4, minCell = -1, n, fitted; // minCell is index. n temporary
        var minEdgeDistance = 10*this.vnorm, toCenter, cellDiff, edgeDist;
        for (let i=0; i<this.gridPoints.length; i++){
            fitted = [this.fit(refX1+this.gridPoints[i][0], this.REPEAT_[0]), this.fit(refY1+this.gridPoints[i][1], this.REPEAT_[1])];
            cellPos.push(this.randomCoord(fitted[0], fitted[1]));
            cellPos[i] = [cellPos[i][0] + this.gridPoints[i][0] - xDif, cellPos[i][1] + this.gridPoints[i][1] - yDif ];
            n = this.dot(cellPos[i], cellPos[i]); // if centered at (x, y), it points to the other feature points. 
            // n = this.distFunc(cellPos[i]); // leaving this off bcoz it looks the same as normal
            n = ceil(n * this.vnorm);
            if (n < minDistance){  minDistance = n; minCell = i; // minCellRef = fitted; minCellPos = cellPos[i];
            }}
        // [3] Distance to nearest border
        for (let i=0; i<this.gridPoints.length; i++){
            if (minCell == i){ continue; } // skip. excluding closest cell
            // toCenter = [(cellPos[i][0]+cellPos[minCell][0])*.5, // center of closest feature and current feature
            //             (cellPos[i][1]+cellPos[minCell][1])*.5];
            toCenter = [(cellPos[i][0]+cellPos[minCell][0]),   // do you really need to /2? i guess to avoid the flat surfaces.
                        (cellPos[i][1]+cellPos[minCell][1])];
            cellDiff = [cellPos[i][0]-cellPos[minCell][0],  // feature - closest feature
                        cellPos[i][1]-cellPos[minCell][1] ];
            // cellDiff = [cellPos[i][0]-2*cellPos[minCell][0],  // blobby :3
            //             cellPos[i][1]-2*cellPos[minCell][1] ];
            /*  
                cellOffsetB + refOffsetB + cellOffsetA + refOffsetA - 2frac
                (cellOffsetA + refOffsetA) - frac - ((cellOffsetB + refOffsetB) - frac)
                = (cellOffsetA + refOffsetA - cellOffsetB - refOffsetB)
            */
            // edgeDist = this.dot(toCenter, cellDiff)
            edgeDist = this.distFunc2(toCenter, cellDiff);
            
            // minEdgeDistance = min(minEdgeDistance, round(edgeDist*this.vnorm));
            minEdgeDistance = this.min(minEdgeDistance, ceil(edgeDist*this.vnorm));
            // console.log(edgeDist, toCenter, cellDiff)
        }
        minEdgeDistance*=.5;
        // If you don't *.5: -0.00390625 (which is the smallest difference of 256, essentially 0 =_=) to 1.6484375
        // if ((minEdgeDistance/this.vnorm >1 ) || (minEdgeDistance/this.vnorm < 0)){ console.log(minEdgeDistance/this.vnorm)}
        // noLoop();
        return minEdgeDistance/this.vnorm;
    }
    // ======================================================================

    /* Displaying Functions */
    generateImage(){
        this.REPEAT_ = [int(this.REPEATX), int(this.REPEATY)]; // hehehe

        if (this.distinctShowMode == 0){
        for (var x = 0; x < this.width; x++){
            for (var y = 0; y < this.height; y++){
                var n = this.noiseFunc((x+this.xOffset)*this.freq, (y+this.yOffset)*this.freq) *this.amp; 
                n = this.normalizerFunc(n);
                this.pixelArray[y][x] = this.processFunc(n, x);
            // if (y > (1/this.freq)){ break; } // 1/f = target pixels for 1 grid cell
        }
    } // FBM
        } else if (this.distinctShowMode == 3){
            let gain = this.gain; let lacunarity = this.lacunarity;
            if (gain == 0){ gain = 1/lacunarity;}
            var divider = 0; for (let l=0; l<this.layers; l++){ divider += gain**l }
            for (var x = 0; x < this.width; x++){
            for (var y = 0; y < this.height; y++){
                var n = 0; var amplitude = 1; var frequencyX = (x+this.xOffset)*this.freq; var frequencyY = (y+this.yOffset)*this.freq;
                for (let l=0; l<this.layers; l++){
                    n += this.processFunc(this.normalizerFunc(this.noiseFunc(frequencyX, frequencyY)* this.amp), x) * amplitude;
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
        let testBoundary = [500, -500];

        for (var y = 0; y < this.pixelArray.length; y++){
            for (var x = 0; x < this.pixelArray[y].length; x++){
                var n = this.pixelArray[y][x];
                testBoundary[0] = min(n, testBoundary[0]);
                testBoundary[1] = max(n, testBoundary[1]);

                if (this.colorInverse){ n = 1-n; }; // cry about it
                let color = this.colorFunc(n);
                setPixel(x, y, color);
            }
        }
        document.querySelector('[class*="display_Test"]').innerHTML = 
            round(testBoundary[0], 2).toLocaleString(undefined,{ minimumFractionDigits:2})+" "
            +round(testBoundary[1], 2).toLocaleString(undefined,{ minimumFractionDigits:2});

    }
    /* Miscallaneous */
    showOnTop(){
        if (this.extraShowMode == "1") { this.showGradients(); }
        else if (this.extraShowMode == "2") { this.showGradientBoxDetails(); updatePixels();  }
    }    
    ExtraStuff(){ 
        if (this.moreShowMode == "1"){ this.oil(); // requires information from other pixels :) i.e. not standalone
        } else if (this.moreShowMode == "2") {
            this.gridding();
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
    gridding(){
        for (let x = 0; x < this.width-1; x++){ for (let y = 0; y < this.height-1; y++){
            let x2 = (x+this.xOffset);  let y2 = (y+this.yOffset); /* Every cell that at interval */
            // if (this.basicallyEqual(int(x2*this.freq, 2), x2*this.freq) && 
            // this.basicallyEqual(int(y2*this.freq, 2), y2*this.freq, 2)){  console.log(x, y); } // 0, 20, 40, 60, 80 etc. to 220 @f = 0.05
            if (this.basicallyEqual(int(x2*this.freq, 2), x2*this.freq) ||
            this.basicallyEqual(int(y2*this.freq, 2), y2*this.freq, 2)){    
            // this.pixelArray[y][x] = (this.pixelArray[y][x]+0.25)%1; // cycle
            this.pixelArray[y][x] *= 1.5; // lighten
        }}}
        // corners are brighter
        // let h = this.height*this.freq-1; let w = this.width*this.freq-1;
        // for (let x2 = 0; x2 < this.width-1; x2++){ 
        //     for (let y = 0; y < h; y++){ this.pixelArray[round(y/this.freq)][x2] *= 1.5; }}
        // for (let y2 = 0; y2 < this.height-1; y2++){ 
        //     for (let x = 0; x < w; x++){ this.pixelArray[y2][round(x/this.freq)] *= 1.5; }}
    }
    

    // https://www.scratchapixel.cm/lessons/procedural-generation-virtual-worlds/procedural-patterns-noise-part-1/simple-pattern-examples.html
    turbulence(n){
        // for (let x = 0; x < this.width-1; x++){ for (let y = 0; y < this.height-1; y++){
        //     this.pixelArray[y][x] = Math.abs(this.pixelArray[y][x]*2-1); }}
        return Math.abs(n*2-1); }
    marble(n, x=0){ //  f = 0.01, FBM and this.marbles = 100;
        // failed return sin(n*100*2*Math.PI)+1;
        return (Math.sin(((x+this.xOffset)+100*n) * (1/this.marbles) * Math.PI*2) + 1) / 2; }
    wood(n){ return n*this.woods - Math.floor(n*this.woods); }

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
    // discreteRound(n){ return round(n, this.roundNum); } // idk
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
        var newVal = Math.E**(8*slider.value/1000.0 -7);  if (newVal < 0.001) {newVal = 0;}
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
        this.xOffset = 0; this.yOffset = 0; this.freq = 0.05; this.amp = 1;}
    /* directions */
    setVal(slider, key, sliderText=null){ 
        this[key] = slider.value; 
        if (sliderText != null) {sliderText.innerHTML = this[key];} }

    setFunc(btn, key="noiseFunc"){  
        /* type of noise */
        if (key == "noiseFunc"){
            if (btn.value == "Value"){ this[key] = this.valueNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else if (btn.value == "Perlin"){ this[key] = this.perlinNoise.bind(this); this.normalizerFunc = this.perlinNormalizer.bind(this); }
            else if (btn.value == "Simplex"){ this[key] = this.simplexNoise.bind(this); this.normalizerFunc = this.perlinNormalizer.bind(this); }
            else if (btn.value == "Voronoi"){ this[key] = this.voronoiNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else if (btn.value == "SVoronoi"){ this[key] = this.smoothvoronoiNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else if (btn.value == "FVoronoi"){ this[key] = this.flatvoronoiNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else if (btn.value == "2Voronoi"){ this[key] = this.F2voronoiNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else if (btn.value == "BVoronoi"){ this[key] = this.bordervoronoiNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else if (btn.value == "Sine"){ this[key] = this.sineNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else { this[key] = this.randomNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); } /* Random */
            this.noiseFuncMode = btn.value;
        } 
        if (key == "smoothFunc"){
            if (btn.value == "On"){ this[key] = this.smoothie.bind(this); }
            else if (btn.value == "Sine"){ this[key] = this.easeInOutSine.bind(this); }
            else { this[key] = this.defaultWrapper.bind(this); }
            this.smoothFuncMode = btn.value;
        }
        if (key == "colorFunc"){
            if (btn.value == "greyscale"){ this[key] = this.greyscale_pixel.bind(this); }
            else if (btn.value == "hsv"){ this[key] = this.hsv_pixel.bind(this); }
            else if (btn.value.substr(0, 8) == "gradient"){ 
                this[key] = this[btn.value+"_pixel"]; }
            else {this[key] = this.defaultWrapper.bind(this); }
            this.colorFuncMode = btn.value;
        }
        if (key == "processFunc"){
            if (btn.value == "turbulence"){ this[key] = this.turbulence.bind(this); }
            else if (btn.value == "marble"){ this[key] = this.marble.bind(this); }
            else if (btn.value == "wood"){ this[key] = this.wood.bind(this); }
            else {this[key] = this.defaultWrapper.bind(this); }
            this.processFuncMode = btn.value;
        }
        if (key == "distFunc"){
            if (btn.value == "Manhattan"){ this[key] = this.manhattanHandler.bind(this);  this.distFunc2 = this.manhattanHandler2.bind(this); }
            else if (btn.value == "Chebyshev"){ this[key] = this.chebyshevHandler.bind(this); this.distFunc2 = this.chebyshevHandler2.bind(this); }
            else if (btn.value == "Minkowski"){ this[key] = this.minkowskiHandler.bind(this); this.distFunc2 = this.minkowskiHandler2.bind(this); }
            else {this[key] = this.dotHandler.bind(this); this.distFunc2 = this.dot.bind(this); }
            this.distFuncMode = btn.value;
        }
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
