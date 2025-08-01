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

// Target variables include verbose, timer, timeWait, timeout
// Target function needs to return false (reset timer), "break" or otherwise (= present). Recommended variable targetLength.
async function waitToLoad(targetFunction, myTargetVariables={verbose: false}, base, query, single=true){ 
    if (myTargetVariables.timer == null) { myTargetVariables.timer = 15; }  if (myTargetVariables.timeWait == null) { myTargetVariables.timeWait = 30; } /* initialize default values */
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
var waitsettings = {timer:3, targetLength: 1, verbose: false};

// Voronoi & FBM is going to be 100% slow, I can't help it
// ========== [NOISE] =============
class NoiseUIManager{
    constructor(boxes, NoiseProgramManager){
        // external functions
        this.WTL = waitToLoad.bind(this); 
        this.WP = waitPresent.bind(this); 
        this.WP1 = waitPresent1.bind(this);
        this.WS = waitsettings;

        this.manager = NoiseProgramManager;

        const ePrefix = "ELEMENT_"+this.constructor.name+"_"; this.ePrefix = ePrefix;
        
        this.forms = [];
        for(let i=0; i < boxes.length; i++){
            const boxXName = ePrefix+"box"+i.toString()+"_"+new Date().valueOf();
            boxes[i].innerHTML = String.raw`<form autocomplete="off" onsubmit="return false;" id="`+boxXName+`">`;
            // console.log(boxXName, boxes[0].querySelector("#"+boxXName));
            this.forms.push(boxes[i]);
            // this.forms.push(boxes[0].querySelector("#"+boxXName));
        }
    // Base Noise features
    let borderStyle = `style="border: 1px solid #777777"`;
    this.forms[0].innerHTML = 
String.raw`
Coords: <div class="${ePrefix+"display_Circle"}"></div><br/>
Offset: <div class="${ePrefix+"display_Offset"}"></div><br/>
<input type="range" min="-2500" max="2500" value="-1"   class="slider ${ePrefix+"xSlider"}"/>X Offset:  <div class="${ePrefix+"display_xSlider"}">0</div><br/>
<input type="range" min="-2500" max="2500" value="-1"   class="slider ${ePrefix+"ySlider"}"/>Y Offset:  <div class="${ePrefix+"display_ySlider"}">0</div><br/>    
<input type="range" min="0"     max="10"   value="2.23607" step="0.01" class="slider ${ePrefix+"fSlider"}"/>Freq: <div class="${ePrefix+"display_fSlider"}"></div><br/>
<input type="range" min="0"     max="10"   value="1"   step="0.01" class="slider ${ePrefix+"aSlider"}"/>Amp: <div class="${ePrefix+"display_aSlider"}"></div><br/>
<input type="range" min="0"     max="450"  value="10"  class="slider ${ePrefix+"rSlider"}"/>Rot:        <div class="${ePrefix+"display_rSlider"}"></div><br/>
<input type="range" min="0"     max="180"  value="0"   class="slider ${ePrefix+"dSlider"}"/>Directions: <div class="${ePrefix+"display_dSlider"}">0</div><br/>

<button class="${ePrefix+"resetBtn"}">Reset</button> 
Loop: <button class="${ePrefix+"noLoopBtn"}">On</button>
Hooked: <button class="${ePrefix+"hookBtn"}">Off</button>
Inverse: <button class="${ePrefix+"inverseBtn"}">Off</button><br/>

<input type="radio" name="noiseFunc" value="Random"     class="${ePrefix+"noiseFunc"}" checked/> 
<input type="radio" name="noiseFunc" value="Value"    class="${ePrefix+"noiseFunc"}"   /> 
<input type="radio" name="noiseFunc" value="Perlin"    class="${ePrefix+"noiseFunc"}"  /> 
<input type="radio" name="noiseFunc" value="Simplex"   class="${ePrefix+"noiseFunc"}"  /> Random / Value / Perlin / Simplex
<br/>
<input type="radio" name="noiseFunc" value="Voronoi"   class="${ePrefix+"noiseFunc"}"  /> 
<input type="radio" name="noiseFunc" value="2Voronoi"  class="${ePrefix+"noiseFunc"}"  />
<input type="radio" name="noiseFunc" value="BVoronoi"    class="${ePrefix+"noiseFunc"}"/> 
<input type="radio" name="noiseFunc" value="Simplex2"  class="${ePrefix+"noiseFunc"}"    /> Voronoi / F2 Voronoi / Border / Simplex2
<br/>
<input type="radio" name="noiseFunc" value="SVoronoi"  class="${ePrefix+"noiseFunc"}"  /> 
<input type="radio" name="noiseFunc" value="FVoronoi"  class="${ePrefix+"noiseFunc"}"  /> 
<input type="radio" name="noiseFunc" value="Sine"    class="${ePrefix+"noiseFunc"}"    />
<input type="radio" name="noiseFunc" value="Random"    class="${ePrefix+"noiseFunc"}"  /> Smooth V / Flat Voronoi / Sine / (TBA) <br/>
`
    // everything else
    this.forms[1].innerHTML = 
String.raw`
<button class="${ePrefix+"DownloadBtn"}">Download</button>
Default Normalize: <button class="${ePrefix+"toggleNormalizerBtn"}">On</button>
Auto Norm: <button class="${ePrefix+"normBtn"}">Off</button>
 Min/Max: <div class="${ePrefix+"display_Test"}"></div><br/>
Lighting: <button class="${ePrefix+"toggleLightingBtn"}">Off</button>
 <button class="${ePrefix+"TriggerBtn"}">Trigger</button>
 Stop at 0: <button class="${ePrefix+"stop0Btn"}">On</button>
Frame Rate: <div class="${ePrefix+"frameRateDisplay"}"></div>

<table>
<tr><td>Smooth:</td><td ${borderStyle}>
<input type="radio" name="smoothFunc" value="Off"  class="${ePrefix+"smoothFunc"}" checked/>
<input type="radio" name="smoothFunc" value="On"   class="${ePrefix+"smoothFunc"}"        />
<input type="radio" name="smoothFunc" value="Sine" class="${ePrefix+"smoothFunc"}"        />
</td><td>Off / On / Sine </td></tr>

<tr><td>Color:</td><td style="filter: hue-rotate(70deg);">
<input type="radio" name="colorFunc" value="greyscale" class="${ePrefix+"colorFunc"}" checked/>
<input type="radio" name="colorFunc" value="hsv"       class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient1" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient2" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient3" class="${ePrefix+"colorFunc"}"        />
</td><td>Greyscale / HSV / Dream / Temp / Plasma </td></tr>

<tr><td></td><td style="filter: hue-rotate(50deg);">
<input type="radio" name="colorFunc" value="gradient4" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient5" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient6" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient7" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient8" class="${ePrefix+"colorFunc"}"        />
</td><td> Magic / Gloom / Thermal / Night / Pastel  </td></tr>

<tr><td></td><td style="filter: hue-rotate(50deg);">
<input type="radio" name="colorFunc" value="gradient9" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient10" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient11" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient12" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient13" class="${ePrefix+"colorFunc"}"        />
</td><td> Warm / Leaf / Ocean / Rose / Dirt  </td></tr>

<tr><td></td><td style="filter: hue-rotate(50deg);">
<input type="radio" name="colorFunc" value="gradient14" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient15" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient16" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient17" class="${ePrefix+"colorFunc"}"        />
<input type="radio" name="colorFunc" value="gradient18" class="${ePrefix+"colorFunc"}"        />
</td><td> Acid / Twilight / Scoville / Hue / Dark Hue </td></tr>

<tr><td>Distance:</td><td ${borderStyle}>
<input type="radio" name="distFunc" value="Dot" class="${ePrefix+"distFunc"}" checked/>
<input type="radio" name="distFunc" value="Manhattan" class="${ePrefix+"distFunc"}" />
<input type="radio" name="distFunc" value="Chebyshev" class="${ePrefix+"distFunc"}" />
<input type="radio" name="distFunc" value="Minkowski" class="${ePrefix+"distFunc"}" />
</td><td>Euclidean (Dot) / Manhattan / Chebyshev / Minkowski </td></tr>

<tr><td>F2 Variation:</td><td style="filter: hue-rotate(250deg);">
<input type="radio" name="F2VMode" value="0" class="${ePrefix+"F2VMode"}" checked/>
<input type="radio" name="F2VMode" value="1" class="${ePrefix+"F2VMode"}" />
<input type="radio" name="F2VMode" value="2" class="${ePrefix+"F2VMode"}" />
<input type="radio" name="F2VMode" value="3" class="${ePrefix+"F2VMode"}" />
<input type="radio" name="F2VMode" value="4" class="${ePrefix+"F2VMode"}" />
</td><td>F2 / Flat / F2 - F1 / Watery / Bacteria </td></tr>

<tr><td>Process:</td><td ${borderStyle}>
<input type="radio" name="processFunc" value="none" class="${ePrefix+"processFunc"}" checked />
<input type="radio" name="processFunc" value="turbulence" class="${ePrefix+"processFunc"}"   />
<input type="radio" name="processFunc" value="marble" class="${ePrefix+"processFunc"}"       />
<input type="radio" name="processFunc" value="wood" class="${ePrefix+"processFunc"}"         />
<input type="radio" name="processFunc" value="central" class="${ePrefix+"processFunc"}"      />
</td><td>None / Turbulence / Marble / Wood / Central  </td></tr>

<tr><td>Display:</td><td style="filter: hue-rotate(50deg);">
<input type="radio" name="displayFunc" value="0" class="${ePrefix+"displayFunc"}" checked/>
<input type="radio" name="displayFunc" value="3" class="${ePrefix+"displayFunc"}"        />
<input type="radio" name="displayFunc" value="7" class="${ePrefix+"displayFunc"}"        />
<input type="radio" name="displayFunc" value="8" class="${ePrefix+"displayFunc"}"        />
<input type="radio" name="displayFunc" value="9" class="${ePrefix+"displayFunc"}"        />
</td><td>Noise / FBM / Domain Warping / ... / ...  </td></tr>
<tr><td></td><td style="filter: hue-rotate(50deg);">
<input type="radio" name="displayFunc" value="2" class="${ePrefix+"displayFunc"}"        />
<input type="radio" name="displayFunc" value="1" class="${ePrefix+"displayFunc"}"        />
<input type="radio" name="displayFunc" value="4" class="${ePrefix+"displayFunc"}"        />
<input type="radio" name="displayFunc" value="5" class="${ePrefix+"displayFunc"}"        />
<input type="radio" name="displayFunc" value="6" class="${ePrefix+"displayFunc"}"        />
</td><td>Box Blend / Box / Closest / Simplex / Simplex Hex</td></tr>


<tr><td>Extra:</td><td ${borderStyle}>
<input type="radio" name="extraMode" value="0" class="${ePrefix+"extraMode"}" checked/>
<input type="radio" name="extraMode" value="1" class="${ePrefix+"extraMode"}" />
<input type="radio" name="extraMode" value="3" class="${ePrefix+"extraMode"}" />
<input type="radio" name="extraMode" value="2" class="${ePrefix+"extraMode"}" />
<input type="radio" name="extraMode" value="4" class="${ePrefix+"extraMode"}" />
</td><td>None / P. Grid / V. G / S. G / Debug </td></tr>

<tr><td>Click:</td><td ${borderStyle}>
<input type="radio" name="clickMode" value="3" class="${ePrefix+"clickMode"}" />
<input type="radio" name="clickMode" value="0" class="${ePrefix+"clickMode"}" checked/>
<input type="radio" name="clickMode" value="1" class="${ePrefix+"clickMode"}" />
<input type="radio" name="clickMode" value="2" class="${ePrefix+"clickMode"}" />
<input type="radio" name="clickMode" value="4" class="${ePrefix+"clickMode"}" />
</td><td>Value Picker / Default / Voronoi / Simplex / Lighting </td></tr>

<tr><td>More:</td><td>
<input type="radio" name="moreFunc" value="0" class="${ePrefix+"moreFunc"}" checked/>
<input type="radio" name="moreFunc" value="2" class="${ePrefix+"moreFunc"}" />
<input type="radio" name="moreFunc" value="3" class="${ePrefix+"moreFunc"}" />
<input type="radio" name="moreFunc" value="4" class="${ePrefix+"moreFunc"}" />
<input type="radio" name="moreFunc" value="1" class="${ePrefix+"moreFunc"}" />
</td><td>None / Grid / Simplex Grid / w/ Diagonal / Oil </td></tr>

<tr><td colspan="3"> 
<button class="${ePrefix+"ExportBtn"}">See Settings</button>
Limit Frame Rate for DW: <button class="${ePrefix+"cfrBtn"}">On</button><br>
Toggle G <button class="${ePrefix+"toggleDspBtn"}">Off</button>
V. w/in Circle <button class="${ePrefix+"toggleCircleBounds"}">On</button>
Process each FBM layer <button class="${ePrefix+"toggleProcessBtn"}">On</button>
</td></tr>

<tr><td>Quick:</td><td>
<input type="radio" name="quickMode" value="0" class="${ePrefix+"quickMode"}" />
<input type="radio" name="quickMode" value="1" class="${ePrefix+"quickMode"}" />
<input type="radio" name="quickMode" value="2" class="${ePrefix+"quickMode"}" />
<input type="radio" name="quickMode" value="4" class="${ePrefix+"quickMode"}" />
<input type="radio" name="quickMode" value="5" class="${ePrefix+"quickMode"}" />
</td><td> G. Perlin / G. Simplex / G. Voronoi / Perlin / Simplex </td></tr>

</table>
<div style="display: none"> Select: <select onchange=""> <option value="perlin">Perlin</option><option value="value">Value</option><option value="voronoi">Voronoi</option> </select><br/> </div>
`
this.forms[2].innerHTML = 
String.raw`
Value: <div class="${ePrefix+"display_Picker"}" style="vertical-align:top">:D<br/><br/><br/><br/></div><br/><br/>
<input type="range" min="0" max="50" value="0"              class="slider ${ePrefix+"cSlider"}"/>Contours:   <div class="${ePrefix+"display_cSlider"}">0</div><br/>
<input type="range" min="1" max="15" value="1"              class="slider ${ePrefix+"zSlider"}"/>Layers:     <div class="${ePrefix+"display_zSlider"}">1</div><br/>
<input type="range" min="1" max="15" value="2" step="0.01"  class="slider ${ePrefix+"lSlider"}"/>Lacunarity: <div class="${ePrefix+"display_lSlider"}">2</div><br/>
<input type="range" min="0" max="2" value="0" step="0.0001" class="slider ${ePrefix+"gSlider"}"/>Gain:       <div class="${ePrefix+"display_gSlider"}">1 / lacunarity</div><br/>
<input type="range" min="1" max="1500" value="100"          class="slider ${ePrefix+"mSlider"}"/>Marbles:    <div class="${ePrefix+"display_mSlider"}">100</div><div style="font-size:10px">(use FBM)</div><br/>
<input type="range" min="1" max="25" value="2" step="0.01"  class="slider ${ePrefix+"wSlider"}"/>Woods:      <div class="${ePrefix+"display_wSlider"}">2</div><br/>
<input type="range" min="1" max="256" value="256"           class="slider ${ePrefix+"uSlider"}"/>RepeatX:    <div class="${ePrefix+"display_uSlider"}">256</div><br/>
<input type="range" min="1" max="256" value="256"           class="slider ${ePrefix+"vSlider"}"/>RepeatY:    <div class="${ePrefix+"display_vSlider"}">256</div><br/>
<input type="range" min="1" max="8" value="1" step="0.05"   class="slider ${ePrefix+"iSlider"}"/>Resolution: <div class="${ePrefix+"display_iSlider"}">1</div><br/>
<input type="range" min="-16" max="16" value="4" step="1"   class="slider ${ePrefix+"sSlider"}"/>Minkowski:  <div class="${ePrefix+"display_sSlider"}">4</div><br/>
<input type="range" min="0" max="5" value="0" step="0.1"    class="slider ${ePrefix+"oSlider"}"/>Grid:       <div class="${ePrefix+"display_oSlider"}">0</div><br/>
<input type="range" min="0" max="10" value="4" step="0.01"  class="slider ${ePrefix+"jSlider"}"/>Strength:   <div class="${ePrefix+"display_jSlider"}">4</div><br/>
<input type="range" min="0.001" max="2" value="0.01" step="0.001" class="slider ${ePrefix+"kSlider"}"/>Diff:       <div class="${ePrefix+"display_kSlider"}">0.01</div><br/>
<input type="range" min="0" max="360" value="0"             class="slider ${ePrefix+"hSlider"}"/>Hue:        <div class="${ePrefix+"display_hSlider"}">2</div><br/>
<input type="range" min="-20" max="20" value="2"            class="slider ${ePrefix+"tSlider"}"/>Test:       <div class="${ePrefix+"display_tSlider"}">0</div><br/>

Test: <button class="${ePrefix+"testingBtn"}">Off</button><br/>
`
// for reference later: b e k n q

    // 1. Set via innerhtml because i'm lazy
    // 2. Wait to load (both input and output) using "Promises" because I can't await [Note: PROMISE.then(var) => { return <val> }) https://www.youtube.com/watch?v=QO4NXhWo_NM]
    // 3. Set function oninput (call function instead of onload for default value)
    // https://stackoverflow.com/questions/23815294/why-does-addeventlistener-fire-before-the-event-if-at-all
    let target = "";
    if (true) {
        let myForm = this.forms[0];
    // this.xSlider = this.WTL(this.WP1, this.WS, myForm, `[class*="${ePrefix+"xSlider"}"]`); 
    // this.xSlider.then(e => { this.xSlider = e;
    //     this.xSliderText = this.WTL(this.WP1, this.WS, myForm, `[class*="${ePrefix+"display_xSlider"}"]`);
    //     this.xSliderText.then(e => { this.xSliderText = e;
    //         });    
    // });
    target = "xSlider";
    this.setupSlider(this, target, myForm, this.WP1, this.WS, function (obj, target){
        obj.manager.move(obj[target], obj[target+"Text"]);
        obj[target].addEventListener("input", () => { 
            obj.manager.move(obj[target], obj[target+"Text"]); });         
    });
    target = "ySlider";
    this.setupSlider(this, target, myForm, this.WP1, this.WS, function (obj, target){
        obj.manager.move(obj[target], obj[target+"Text"]);
        obj[target].addEventListener("input", () => { 
            obj.manager.move(obj[target], obj[target+"Text"], true); });         
    });
    target = "fSlider";
    this.setupSlider(this, target, myForm, this.WP1, this.WS, function (obj, target){
        obj.manager.setSlider(obj[target], 'freq', obj[target+"Text"]);
        obj[target].addEventListener("input", () => { 
            obj.manager.setSlider(obj[target], 'freq', obj[target+"Text"]); });
    });
    target = "aSlider";
    this.setupSlider(this, target, myForm, this.WP1, this.WS, function (obj, target){
        obj.manager.setVal(obj[target], 'amp', obj[target+"Text"]);
        obj[target].addEventListener("input", () => { 
            obj.manager.setVal(obj[target], 'amp', obj[target+"Text"]); });
    });
    target = "rSlider";
    this.setupSlider(this, target, myForm, this.WP1, this.WS, function (obj, target){
        obj.manager.setVal(obj[target], 'rot', obj[target+"Text"]);
        obj[target].addEventListener("input", () => { 
            obj.manager.setVal(obj[target], 'rot', obj[target+"Text"]); });
    });
    target = "dSlider";
    this.setupSlider(this, target, myForm, this.WP1, this.WS, function (obj, target){
        obj.manager.setVal(obj[target], 'N_directions', obj[target+"Text"]);
        obj[target].addEventListener("input", () => { 
            obj.manager.setVal(obj[target], 'N_directions', obj[target+"Text"]); });
    });

    this.noiseFuncBtns = this.WTL(this.WP, {timer: this.WS.timer, targetLength: 4, verbose: false}, myForm, `[class*="${ePrefix+"noiseFunc"}"]`, false); 
    this.noiseFuncBtns.then(e => { this.noiseFuncBtns = e;
        for (let i=0; i<this.noiseFuncBtns.length;i++){
            this.noiseFuncBtns[i].addEventListener("click", () => { this.manager.setFunc(this.noiseFuncBtns[i], 'noiseFunc'); }); 
        }
    });

    this.display_Offset = this.WTL(this.WP1, this.WS, myForm, `[class*="${ePrefix+"display_Offset"}"]`); 
    this.display_Offset.then(e => { this.display_Offset = e; this.display_Offset.innerHTML = "0 0"; 
        this.manager.display_Offset = this.display_Offset; // to display xOffset/yOffset result
    });

    this.noLoopBtn = this.WTL(this.WP1, this.WS, myForm, `[class*="${ePrefix+"noLoopBtn"}"]`); 
    this.noLoopBtn.then(e => { this.noLoopBtn = e;
        this.noLoopBtn.addEventListener("click", () => { 
            const looping = this.manager.toggleNoLoop();
            if (looping){ this.noLoopBtn.innerHTML = "Off"; }
            else{ this.noLoopBtn.innerHTML = "On"; }
        });
    });

    this.hookBtn = this.WTL(this.WP1, this.WS, myForm, `[class*="${ePrefix+"hookBtn"}"]`); 
    this.hookBtn.then(e => { this.hookBtn = e;
        this.hookBtn.addEventListener("click", () => { 
            const state = this.manager.toggle("triggerCirclesOnce");
            if (state){ this.hookBtn.innerHTML = "On"; }
            else{ this.hookBtn.innerHTML = "Off"; }
        });
    });
    this.inverseBtn = this.WTL(this.WP1, this.WS, myForm, `[class*="${ePrefix+"inverseBtn"}"]`); 
    this.inverseBtn.then(e => { this.inverseBtn = e;
        this.inverseBtn.addEventListener("click", () => { 
            const state = this.manager.toggle("colorInverse");
            if (state){ this.inverseBtn.innerHTML = "On"; }
            else{ this.inverseBtn.innerHTML = "Off"; }
        });
    });
    this.resetBtn = this.WTL(this.WP1, this.WS, myForm, `[class*="${ePrefix+"resetBtn"}"]`); 
    this.resetBtn.then(e => { this.resetBtn = e;
        this.resetBtn.addEventListener("click", () => { 
        // reset xSlider, ySlider and so on...
        this.xSlider.value = -1; this.ySlider.value = -1; this.fSlider.value = 2.23607; this.aSlider.value = 1; // reset position of sliders
        this.manager.move(this.xSlider, this.xSliderText); // set display value
        this.manager.move(this.ySlider, this.ySliderText, true);
        this.manager.setSlider(this.fSlider, 'freq', this.fSliderText);
        this.manager.setVal(this.aSlider, 'amp', this.aSliderText);
        this.manager.resetVar(); // reset values in object
        });});
    }

    this.displayCircle = this.WTL(this.WP1, this.WS, this.forms[0], `[class*="${ePrefix+"display_Circle"}"]`); 
    this.displayCircle.then(e => { this.displayCircle = e; });
    this.displayPicker = this.WTL(this.WP1, this.WS, this.forms[2], `[class*="${ePrefix+"display_Picker"}"]`); 
    this.displayPicker.then(e => { this.displayPicker = e; });

    // Everything else
    if (true){
        let myForm = this.forms[1];
        let targetsToKeyDict = { // variable, class name/keyword, min no. of buttons, context
            "smoothFuncBtns": ["smoothFunc", 3, this.manager.setFunc.bind(this.manager)],
            "colorFuncBtns": ["colorFunc", 15, this.manager.setFunc.bind(this.manager)],
            "processModeBtns": ["processFunc", 5, this.manager.setFunc.bind(this.manager)],
            "distModeBtns": ["distFunc", 4, this.manager.setFunc.bind(this.manager)],
            "moreFuncBtns": ["moreFunc", 5, this.manager.setFunc.bind(this.manager)],

            "displayFuncBtns": ["displayFunc", 6, this.manager.setFunc.bind(this.manager)],
            "F2VModeBtns": ["F2VMode", 5, this.manager.setVal.bind(this.manager)],
            "extraModeBtns": ["extraMode", 5, this.manager.setVal.bind(this.manager)],
            "clickModeBtns": ["clickMode", 4, this.manager.setVal.bind(this.manager)],
            "quickModeBtns": ["quickMode", 4, this.manager.setAllFunc.bind(this.manager)]
        };
        let keys = Object.keys(targetsToKeyDict);
        for (let i = 0; i < keys.length; i++){
            let target = keys[i];
            let tgtLength = targetsToKeyDict[target][1], keyword = targetsToKeyDict[target][0];
            let whichFunc = targetsToKeyDict[target][2];
            
            this[target] = this.WTL(this.WP, {timer: this.WS.timer, targetLength: tgtLength, verbose: false}, myForm, `[class*="${ePrefix+keyword}"]`, false); 
            this[target].then(e => { this[target] = e;
                // console.log(target,this[target])
                for (let i=0; i<this[target].length;i++){
                    this[target][i].addEventListener("click", () => { 
                        whichFunc(this[target][i], keyword); }); }
            });
        }
        // this.colorFuncBtns = this.WTL(this.WP, {timer: this.WS.timer, targetLength: 15, verbose: false}, myForm, `[class*="${ePrefix+"colorFunc"}"]`, false); 
        // this.colorFuncBtns.then(e => { this.colorFuncBtns = e;
        //     for (let i=0; i<this.colorFuncBtns.length;i++){
        //         this.colorFuncBtns[i].addEventListener("click", () => { this.manager.setFunc(this.colorFuncBtns[i], 'colorFunc'); }); 
        //     }
        // });
        // THERE'S MORE?! aww man https://www.google.com/search?sca_esv=000223f181a12c46&rlz=1C1UEAD_enSG1121SG1121&q=distance+metrics&udm=2&fbs=AIIjpHxU7SXXniUZfeShr2fp4giZ1Y6MJ25_tmWITc7uy4KIeoJTKjrFjVxydQWqI2NcOhZVmrJB8DQUK5IzxA2fZbQF4YL5sNSRJGgx0e9Z9AxExzjE4_ynshmXB4KOs3cwRUeqSxtyEph1-LMoYoz7AgsxiAlRbfQlh62fpf4TvoMmLeIHIDQBlO9bBf83uliUCcabaD8ejPu9aoigNJtiQ30WOIRP0w&sa=X&ved=2ahUKEwjr7v7f3pGOAxVjxDgGHSZ7E8MQtKgLKAF6BAgeEAE&biw=818&bih=730&dpr=1.25#vhid=WgMMWnlacsNcwM&vssid=mosaic
        // HOW did people invent >5+ ways to calculate distance?

        // ============================================================
        targetsToKeyDict = {
            "normBtn": "autonorm",
            "cfrBtn": "clipFrameRateForIntensive",
            "toggleDspBtn": "QuickSwitchToNormalNoise",
            "stop0Btn": "stop0",
            "toggleCircleBounds": "WithinCircle",
            "toggleLightingBtn": "lighting"
        }
        keys = Object.keys(targetsToKeyDict);
        for (let i = 0; i < keys.length; i++){
            let target = keys[i];
            this[target] = this.WTL(this.WP1, this.WS, myForm, `[class*="${ePrefix+[target]}"]`); 
            this[target].then(e => { this[target] = e;
            this[target].addEventListener("click", () => { 
                this.toggleButton(this.manager.toggle(targetsToKeyDict[target]),  this[target]);
            });});   
        }
        // ============================================================
        this.triggerBtn = this.WTL(this.WP1, this.WS, myForm, `[class*="${ePrefix+"TriggerBtn"}"]`); 
        this.triggerBtn.then(e => { this.triggerBtn = e;
        this.triggerBtn.addEventListener("click", () => {
            this.manager.trigger();
        });});
        this.toggleNormalizerBtn = this.WTL(this.WP1, this.WS, myForm, `[class*="${ePrefix+"toggleNormalizerBtn"}"]`); 
        this.toggleNormalizerBtn.then(e => { this.toggleNormalizerBtn = e;
        this.toggleNormalizerBtn.addEventListener("click", () => {
            this.toggleButton(this.manager.toggle("norm"),  this.toggleNormalizerBtn);
            this.manager.toggleNormalizer();
        });});

        this.toggleProcessBtn = this.WTL(this.WP1, this.WS, myForm, `[class*="${ePrefix+"toggleProcessBtn"}"]`); 
        this.toggleProcessBtn.then(e => { this.toggleProcessBtn = e;
        this.toggleProcessBtn.addEventListener("click", () => {
            this.toggleButton(this.manager.toggle("processFBM"),  this.toggleProcessBtn);
            this.manager.toggleProcess();
        });});

        this.downloadBtn = this.WTL(this.WP1, this.WS, myForm, `[class*="${ePrefix+"DownloadBtn"}"]`); 
        this.downloadBtn.then(e => { this.downloadBtn = e;
        this.downloadBtn.addEventListener("click", () => {
            this.saveCanvasImage();
        });});
        this.exportBtn = this.WTL(this.WP1, this.WS, myForm, `[class*="${ePrefix+"ExportBtn"}"]`); 
        this.exportBtn.then(e => { this.exportBtn = e;
        this.exportBtn.addEventListener("click", () => {
            this.exportSettings(document.querySelector("#InputTextArea"));
        });});

        this.frameRateDisplay = this.WTL(this.WP1, this.WS, myForm, `[class*="${ePrefix+"frameRateDisplay"}"]`); 
        this.frameRateDisplay.then(e => { this.frameRateDisplay = e; });
    }
    if (true){
        let myForm = this.forms[2];
        target = "gSlider";
        this.setupSlider(this, target, myForm, this.WP1, this.WS, function (obj, target){
            obj[target].addEventListener("input", () => { obj.manager.setVal(obj[target], "gain", obj[target+"Text"]); 
                    if (obj[target].value == 0){ obj[target+"Text"].innerHTML = "1 / lacunarity";} }) });

        let targetsToKeyDict = {
            "cSlider": "contours",
            "zSlider": "layers",
            "lSlider": "lacunarity",
            "mSlider": "marbles",
            "wSlider": "woods",
            "uSlider": "REPEATX",
            "vSlider": "REPEATY",
            "uSlider": "REPEATX",
            "iSlider": "resolution",
            "sSlider": "minkowskiFactor",
            "oSlider": "gridFactor",
            "jSlider": "dmwStrength",
            "kSlider": "diff",
            "hSlider": "hue",
            "tSlider": "testFactor"
        };
        let keys = Object.keys(targetsToKeyDict);
        for (let i = 0; i < keys.length; i++){
            target = keys[i];
            this.setupSlider(this, target, myForm, this.WP1, this.WS, function (obj, target){
            obj[target].addEventListener("input", () => { obj.manager.setVal(obj[target], targetsToKeyDict[target], obj[target+"Text"]); }); });
        }
            
        // target = "wSlider";
        // this.setupSlider(this, target, myForm, this.WP1, this.WS, function (obj, target){
        //     obj[target].addEventListener("input", () => { obj.manager.setVal(obj[target], "woods", obj[target+"Text"]);  }); });
        
        this.testBtn = this.WTL(this.WP1, this.WS, myForm, `[class*="${ePrefix+"testingBtn"}"]`); 
        this.testBtn.then(e => { this.testBtn = e;
        this.testBtn.addEventListener("click", () => { 
            const state = this.manager.toggle("testing");
            if (state){ this.testBtn.innerHTML = "On"; } else{ this.testBtn.innerHTML = "Off"; }
        });});
    }    

}
// const state = this.manager.toggle(targetsToKeyDict[target]);
    toggleButton(state, btn){
        if (state){ btn.innerHTML = "On"; } else{ btn.innerHTML = "Off"; }
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
        console.log(keys);
        let copyText = ""; // \u200b huh https://stackoverflow.com/questions/64328549/remove-u200b-in-vs-code
        // for (let k=0;k<keys.length; k++){ if (includeKeys.indexOf(keys[k]) > 0){ copyText += `"${keys[k]}": ${(gn[keys[k]]).toString()}\n`; }}
        // for (let k=0;k<includeKeys.length; k++) {  copyText += `"${includeKeys[k]}": ${(this.manager[includeKeys[k]]).toString()}\n`;  }
        
        let bottomText = "\n\n\n";
        let excludeKeys = ["fixedArray", "fixedLengthArray", "pixelArray", "cloneArray", "display_Offset"];
        for (let k=0;k<keys.length; k++){ 
            if (excludeKeys.indexOf(keys[k]) < 0){
            if (typeof(gn[keys[k]])!= "function"){ copyText += `"${keys[k]}": ${(gn[keys[k]]).toString()}\n`; }
            else { bottomText += `"${keys[k]}": ${(gn[keys[k]]).toString()}\n`; }
        }}
        element.innerHTML = copyText+bottomText;
    }
    displayFrameRate(){
        let val = round(frameRate(), 3);
        this.frameRateDisplay.innerHTML = val.toLocaleString(undefined,{ minimumFractionDigits:3});
        
        if (this.frameRateDisplay.style != undefined){
            // if (val < 6){ this.frameRateDisplay.style.color = 'red'; }
            // else { this.frameRateDisplay.style.color = 'white'; }
            let rgb = linear_gradient_pixel(val/20, [[0, 1, .5], [101, 1, .8]], [0, 1]);
            this.frameRateDisplay.style.color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        }
    }
    triggerCircles(){ this.manager.triggerCircles(this.displayCircle, this.displayPicker); } // pass
}

function easeInOutSine(t){ return -(Math.cos(Math.PI*t)-1)/2; }
class NoiseProgramManager{
    constructor(canvasSize){
        // FUNCTIONS DECLARED OUTSIDE
        this.hsv_pixel = hsv_pixel.bind(this);
        this.greyscale_pixel = greyscale_pixel.bind(this);
        this.easeInOutSine = easeInOutSine.bind(this);
        this.posMod = posMod.bind(this);
        // this.gradient1_pixel = linear_gradient_pixel.bind(this);
        this.hue = 0;
        this.gradient1_pixel = function(val, colors=[[200+(this.hue), 0.9, 0.9], [359+(this.hue), 0.4, 1]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient2_pixel = function(val, colors=[[0+int(this.hue), .9, .9], [80+int(this.hue), .2, 1], [170+int(this.hue), .2, 1], [250+int(this.hue), .9, .9]], positions=[0, .5, .5, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient3_pixel = function(val, colors=[[255+int(this.hue), 1, .5], [360+int(this.hue), .7, .8], [60+int(this.hue), 1, 1]], positions=[0, .5, 1]){ return linear_gradient_pixel(val, colors, positions, true); };
        
        this.gradient4_pixel = function(val, colors=[[300+int(this.hue), .6, .9], [140+int(this.hue), .6, .9]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient5_pixel = function(val, colors=[[230+int(this.hue), .5, .4], [250+int(this.hue), .2, 1]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient6_pixel = function(val, colors=[[0+int(this.hue), .9, .9], [260+int(this.hue), .9, .9]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient7_pixel = function(val, colors=[[231+int(this.hue), 0, 0], [231+int(this.hue), 1, .3], [200+int(this.hue), .6, .5]], positions=[0, 0.3, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient8_pixel = function(val, colors=[[300+int(this.hue), .5, 1], [60+int(this.hue), .5, 1], [180+int(this.hue), .5, 1], [300+int(this.hue), .5, 1]], positions=[0, .33, .66, 1]){ return linear_gradient_pixel(val, colors, positions, true); };

        this.gradient9_pixel = function(val, colors=[[0+int(this.hue), .8, .7], [69+int(this.hue), 1, 1]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        // this.gradient10_pixel = function(val, colors=[[20, 1, 1], [33, 1, 1], [50, .5, 0], [220, .5, 0], [220, .6, .6], [242, 1, .4]], positions=[0, .3, .5, .5, .7, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient10_pixel = function(val, colors=[[80+int(this.hue), .8, 1], [115+int(this.hue), 1, .2]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient11_pixel = function(val, colors=[[234+int(this.hue), 1, .4], [195+int(this.hue), 1, .7], [195+int(this.hue), 0, .9]], positions=[0, .5, 1]){ return linear_gradient_pixel(val, colors, positions); };  // hsl!!! is bad in the case where dark green => blue
        this.gradient12_pixel = function(val, colors=[[285+int(this.hue), .5, .7], [300+int(this.hue), .2, .9], [320+int(this.hue), .4, .9], [350+int(this.hue), .81, .9]], positions=[0, .4, .8, 1]){ return linear_gradient_pixel(val, colors, positions, true); };
        this.gradient13_pixel = function(val, colors=[[28+int(this.hue), .5, .8], [20+int(this.hue), .8, .4], [15+int(this.hue), .4, .5]], positions=[0, .7, 1]){ return linear_gradient_pixel(val, colors, positions); };
        // ah. my problem is im asking for a linear gradient and not a hue one :L
        this.gradient14_pixel = function(val, colors=[[60+int(this.hue), .7, .9], [100+int(this.hue), .9, .5], [120+int(this.hue), .7, .1]], positions=[0, 0.5, 1]){ return linear_gradient_pixel(val, colors, positions); };
        // this.gradient15_pixel = function(val, colors=[[277, 1, 1], [247, 1, .6], [188, .7, .9], [218, .5, .9]], positions=[0, .2, .7, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient15_pixel = function(val, colors=[[340+int(this.hue), .3, 1], [277+int(this.hue), .6, 1], [247+int(this.hue), 1, .6], [240+int(this.hue), .7, .9]], positions=[0, .2, .7, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient16_pixel = function(val, colors=[[118+int(this.hue), .9, .5], [118+int(this.hue), .9, .9], [0+int(this.hue), .9, .9]], positions=[0, .3, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient17_pixel = function(val, colors=[[int(this.hue), .9, .5], [int(this.hue)+4, .1, 1]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        this.gradient18_pixel = function(val, colors=[[int(this.hue), .9, .9], [int(this.hue), .9, 0]], positions=[0, 1]){ return linear_gradient_pixel(val, colors, positions); };
        
        this.staticWidth = canvasSize[0]; this.staticHeight = canvasSize[1];
        this.width = canvasSize[0]; this.height = canvasSize[1];
        this.REPEAT = [256, 256]; // please don't dynamically change it to be bigger :)
        this.REPEAT_ = [256, 256];
        this.REPEATX = 256; this.REPEATY = 256;  // dynamically enlarge this instead
        
        this.SEED = 0; this.nothing = true;
        this.fixedArray = this.noiseBase2(this.SEED); // [1]
        this.fixedLengthArray = this.noiseBase2(this.SEED+1); // for voronoi.
        /* note that there is basically no question online that has a "1 random value" limit
         which suggests that having a formulaic way to generate mag+vec 
        (with the capability to be reversed) is... impossible? */
        this.pixelArray = [];
        for (var i = 0; i < this.width; i++) { this.pixelArray[i] = new Array(this.height); }
        this.cloneArray = [];
        for (var i = 0; i < this.width; i++) { this.cloneArray[i] = new Array(this.height); }

        this.xOffsetRate = 0; this.yOffsetRate = 0;
        this.xOffset = 0; this.yOffset = 0; // after applying changeOffset()
        this.display_Offset = null; // element
        this.rot = 0; this.freq = 0.05; this.amp = 1;
        
        this.N_directions = 0;
        
        this.noiseFuncMode = "Random", this.smoothFuncMode = "On", this.colorFuncMode = "grayscale", this.processFuncMode = "None";
        this.distFuncMode = "Dot";
        this.noiseFunc = this.randomNoise.bind(this); this.smoothFunc = this.defaultWrapper.bind(this); 
        this.colorFunc = this.greyscale_pixel.bind(this); this.processFunc = this.defaultWrapper.bind(this); 
        this.distFunc = this.dotHandler.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this);
        this.moreFunc = this.defaultWrapper.bind(this);
        this.distFunc2 = this.dot.bind(this);
        
        this.displayFunc = this.SingleNoiseLayer.bind(this); // techniques or show gradients

        this.extraMode = "0"; // show predefined gradients lines
        this.moreMode = "0"; // grids or post
        this.clickMode = "0";
        
        this.contours = 0; this.layers = 1; this.lacunarity = 2.; this.gain = 0; 
        this.noLoopVar = false; this.triggerCirclesFlag = false; this.triggerCirclesOnce = false; this.colorInverse = false;
        this.marbles = 100; this.woods = 2; //this.roundNum = 1;
        // this.turbulenceFactor = 2;
        this.F2VMode = 0; this.vnorm = 256; this.dmwStrength = 4; this.diff = 0.001;
        this.testing = false; this.testFactor = 2;

        this.autonorm = false; this.stop0 = true; this.clipFrameRateForIntensive = true; this.QuickSwitchToNormalNoise = false;
        this.WithinCircle = true; this.lighting = false; this.lightingVec = [1.0, 1.0];
        this.circlesRef = [0, 0]; this.triggerCirclesRef = [0, 0];

        this.gridPoints = [[-1, -1], [0, -1], [1, -1], 
                            [-1, 0], [0, 0], [1, 0],
                            [-1, 1], [0, 1], [1, 1]];
        this.enablePosMod = this.posMod.bind(this); // tile before calling noise function. (disabled for simplex)
        this.norm = true; this.enableNormalization = this.normalizerFunc.bind(this);
        this.processFBM = true; this.enableProcess = this.processFunc.bind(this);

        this.resolution = 1; // unfortunately some stray edge pixels don't get caught but that's a job for another time
        this.minkowskiFactor = 4; this.gridFactor = 0;
        this.g = this.gain == 0 ? 1/this.lacunarity : this.gain;
        
        this.nearestFunc = Math.round.bind(this); // im not sure if it should beround or whatever right now
    }
    defaultWrapper(val, args=""){ return val; }
    /* Helping (General Math) Functions */
    smoothie(t){ return t * t * t * (t * (t * 6 - 15) + 10)}
    dot(A, B){ return (A[0]*B[0] + A[1]*B[1]); }
    roundInt(val, mn, mx){ return Math.floor(val * (mx-mn+1) + mn); }
    remap(val, a, b, c, d) { return (val - a) / (b-a) * (d-c) + c; }
    dist(A, B, C, D){ return Math.sqrt((C-A)**2 + (D-B)**2); }
    distQ(A, B){ return Math.sqrt((B[0]-A[0])**2 + (B[1]-A[1])**2); }
    
    /* Other distance formulas */
    manhattan(A, B){ return Math.abs(B[0]-A[0]) + Math.abs(B[1]-A[1]); }
    chebyshev(A, B){ return Math.max(Math.abs(B[0]-A[0]), Math.abs(B[1]-A[1])); }
    minkowski(A, B, h=float(this.minkowskiFactor)){ return ((B[0]-A[0])**h + (B[1]-A[1])**h)**(1/h); } // -ves should be illegal, no? odd powers don't work either
    // manhattan(A, B, C, D){ return Math.abs(C-A) + Math.abs(D-B); }
    // chebyshev(A, B, C, D){ return Math.max(Math.abs(C-A), Math.abs((D-B)); }
    // minkowski(A, B, C, D, h=4){ return pow((C-A)**h + (D-B)**h, 1/h); }
    dotHandler(cellPos){ return (cellPos[0]*cellPos[0] + cellPos[1]*cellPos[1]); }
    manhattanHandler(cellPos){ return Math.abs(cellPos[0]) + Math.abs(cellPos[1]); }
    chebyshevHandler(cellPos){ return Math.max(Math.abs(cellPos[0]), Math.abs(cellPos[1])) ; }
    minkowskiHandler(cellPos, h=float(this.minkowskiFactor)){ return ((cellPos[0])**h + (cellPos[1])**h)**(1/h) ; } 
    // ^^^ try -1 on smooth voronoi 
    manhattanHandler2(A, B){ return (Math.abs(B[0]-A[0]) + Math.abs(B[1]-A[1])) -1; } // it was too bright so -1
    chebyshevHandler2(A, B){ return (Math.max(Math.abs(B[0]-A[0]), Math.abs(B[1]-A[1]))) -1 }
    minkowskiHandler2(A, B, h=float(this.minkowskiFactor)){ return (((B[0]-A[0])**h + (B[1]-A[1])**h)**(1/h)) -1; }
    
    /* Functions */
    noiseBase2(seed=undefined, maxX=this.REPEAT[0], maxY=this.REPEAT[1]){
        if (seed == undefined){ randomSeed(0); } /* from p5js, no native 🥲 */
        else { randomSeed(seed); }
        var fixedArray = [];
        for (var x = 0; x < maxX; x++){ fixedArray.push([]);
            for (var y = 0; y < maxY; y++){ fixedArray[x].push(random()) }}
        return fixedArray; }

    randomVector(refX, refY){
        var val =
            (this.N_directions == 0) ? 
                this.fixedArray[refX][refY] * Math.PI*2
                /* (Optional) */
                : this.remap(this.roundInt(this.fixedArray[refX][refY], 0, this.N_directions)/this.N_directions, 0, 1, 0, Math.PI*2)
        return [Math.cos(val), Math.sin(val)]; }
        // return [Math.sqrt(2)*Math.cos(val), Math.sqrt(2)*Math.sin(val)]; } /* for 0.999 range */
    
    pi2 = Math.PI*2;
    sqrtH = Math.sqrt(.5);
    randomCoord(refX, refY){//, w=2**8, h=2**8){ // don't use floats on w/h
        // please pass refX & refY through fit()
        // refY += this.REPEAT_[1]-2; // shift the entire thing up by 2 boxes
        
        // if ((refY%this.REPEAT_[1]) == (this.REPEAT_[1]-1)) return [0.5, 0.5]; // set specific row (above)
        // let even = [refX%2 == 0, refY%2 == 0];                                // create a grid
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
        // let t = this.fixedArray[refX][refY]*(1Math.PI*2);
        // return [t*Math.cos(t)/15 +0.5, t*Math.sin(t)/15 + 0.5];
        // [lazy vector]
        let t;
        t = this.N_directions == 0? 
            this.fixedArray[refX][refY]*Math.PI*2
            : this.remap(this.roundInt(this.fixedArray[refX][refY], 0, this.N_directions)/this.N_directions, 0, 1, 0, this.pi2)
        // let D = Math.sqrt(-(Math.abs(this.fixedLengthArray[refX][refY]*2-1))+1)/2;
        // let D = Math.sin(this.fixedLengthArray[refX][refY]*Math.PI)/2; // so that it goes in a circle?
        let D = this.fixedLengthArray[refX][refY];
        D = this.WithinCircle? D*this.sqrtH: D;
        let newX = D*Math.cos(t)+0.5, newY = D*Math.sin(t)+0.5;
        // return [newX, newY]; 
        // return [max(min(newX, 1), 0), max(min(newY, 1), 0)]; // limit it so you don't get 12 cells in one.  this is so slow omg
        return [(newX > 1 ? 1: newX) < 0 ? 0: newX,
            (newY > 1 ? 1: newY) < 0 ? 0: newY];
    }
    perlinNormalizer(n){ return (n*Math.sqrt(0.5)+0.5); }
    // simplexNormalizer(n){ return (n*Math.sqrt(0.5)+0.5); }  // -0.7. return (n+1)/2;
    // voronoiNormalizer(n){ return n*=1.13; } // i don't actually know :P
    negNormalizer(n){ return (n+1)/2; }

    /* Basic Noise Functions */
    randomNoise(x, y){
        return this.fixedArray[Math.floor(x)][Math.floor(y)]; 
        // let repeatX = Math.floor(x%this.REPEAT_[0]);
        // let repeatY = Math.floor(y%this.REPEAT_[1]);
        // return this.fixedArray[repeatX][repeatY]; 
    } 
    sineNoise(x, y){
        return (Math.sin(x)*Math.sin(y)+1)/2; // is it \sin\left(x\right)\cdot\sin\left(x+a\right)
    }
    valueNoise(x, y){          
        var refX1 = Math.floor(x); var xDif = x-refX1; var refX2 = refX1+1; refX2 = refX2 == this.REPEAT_[0]? 0: refX2; // me trying to avoid if statements like the plague
        var refY1 = Math.floor(y); var yDif = y-refY1;  var refY2 = refY1+1; refY2 = refY2 == this.REPEAT_[1]? 0: refY2;
        var c00 = this.fixedArray[refX1][refY1];
        var c10 = this.fixedArray[refX2][refY1];
        var c01 = this.fixedArray[refX1][refY2];
        var c11 = this.fixedArray[refX2][refY2];
        { xDif = this.smoothFunc(xDif); yDif = this.smoothFunc(yDif); }
        var x1 = lerp(c00, c10, xDif); var x2 = lerp(c01, c11, xDif); var val = lerp(x1, x2, yDif); // bilinear interpolation
        return val; }
    perlinNoise(x, y){  
        // var xCel = Math.floor(x); var xDif = x-xCel; var refX1 = xCel%this.REPEAT_[0]; var refY1 = yCel%this.REPEAT_[1]; // this.posMod() func keeps it within 0-255 so i got rid of this
        var refX1 = Math.floor(x); var xDif = x-refX1; var refX2 = refX1+1; refX2 = refX2 == this.REPEAT_[0]? 0: refX2; // "fit" upper bound
        var refY1 = Math.floor(y); var yDif = y-refY1; var refY2 = refY1+1; refY2 = refY2 == this.REPEAT_[1]? 0: refY2;
        var c00 = this.distFunc2(this.randomVector(refX1, refY1), [xDif  ,yDif  ]); // dot
        var c10 = this.distFunc2(this.randomVector(refX2, refY1), [xDif-1,yDif  ]);
        var c01 = this.distFunc2(this.randomVector(refX1, refY2), [xDif  ,yDif-1]);
        var c11 = this.distFunc2(this.randomVector(refX2, refY2), [xDif-1,yDif-1]);        
        // if (this.testing){ // LET'S TEST IT OUT
        //     let g = [this.randomVector(refX1, refY1), 
        //         this.randomVector(refX2, refY1),
        //         this.randomVector(refX1, refY2),
        //         this.randomVector(refX2, refY2) ];
        //     c00 = this.distFunc2(g[0]                  , [xDif  ,yDif  ]);
        //     c10 = this.distFunc2([g[1][0]-1, g[1][1]  ], [xDif  ,yDif  ]);
        //     c01 = this.distFunc2([g[2][0]  , g[2][1]-1], [xDif  ,yDif  ]);
        //     c11 = this.distFunc2([g[3][0]-1, g[3][1]-1], [xDif  ,yDif  ]); 
        // }
        xDif = this.smoothFunc(xDif); yDif = this.smoothFunc(yDif);
        var x1 = lerp(c00, c10, xDif); var x2 = lerp(c01, c11, xDif); var val = lerp(x1, x2, yDif);
        // if (this.testing) {
        //     if (this.basicallyEqual(xDif, 0) &&  this.basicallyEqual(yDif, 0)){
        //         console.log(val, c00, c10, c01, c11);
        //         noLoop();
        //     }
        //     return this.basicallyEqual(xDif, 0) &&  this.basicallyEqual(yDif, 0)? 0.6: 0; }

        // if (this.testing) {return this.basicallyEqual(val, 0)? 0.5: 0; }
        return val; 
        }
    // https://codeplea.com/triangular-interpolation
    barycentricLerp(p1, p2, p3, i){ // untested
        let w1 = ((p2[1]-p3[1]) * (i[0] -p3[0]) + (p3[0]-p2[0]) * (i[1] -p3[1]))/
              ((p2[1]-p3[1]) * (p1[0]-p3[0]) + (p3[0]-p2[0]) * (p1[1]-p3[1]));
        let w2 = ((p3[1]-p1[1]) * (i[0] -p3[0]) + (p1[0]-p3[0]) * (i[1] -p3[1]))/
              ((p2[1]-p3[1]) * (p1[0]-p3[0]) + (p3[0]-p2[0]) * (p1[1]-p3[1]));
        let w3 = 1 - w1 - w2;
        //  [ w1*p1[0] + w2*p2[0] + w3+p3[0], w1*p1[1] + w2*p2[1] + w3+p2[1]]
        return [w1, w2, w3];
    }
    // http://www.researchgate.net/publication/216813608_Simplex_noise_demystified
    // https://erfan-ahmadi.github.io/blog/simplex/
    // points = [[1,1], [-1, 1], [1, -1], [-1, -1]];
    F2 = 0.5*(Math.sqrt(3)-1); //  0.36602540378 
    G2 = (3-Math.sqrt(3))/6; // 0.2113248654 
    staticSimplexOffset = -(3**-.5); //-1+2*this.G2 = -0.5773502691896257 which a google search reveals is -tan(30) or -1/sqrt(3)
    staticFalloff = 2/3;
    staticFalloffOrig = 0.5;
    simplexNoise(x, y){
        // pre% doesn't tile 😡 the map is largerrrr (this.enablePosMod = disable) 
        // [0] Get array references i & j in skewed space
        let s = (x+y)*this.F2;   // skew     wow \( O <O)/   i don't get it
        let i = Math.floor(x+s), j = Math.floor(y+s); // integers
        /*  This is the equivalent of a single linear transformation:
        a = S1 + 1     b = S1
        c = S1         d = S1 + 1
        where S1 = (√3-1)/2 and its inverse S2 = (√3-3)/6.

        Which is the equivalent of 3 simple-r linear transformations: C * (B * A)
        1. Rotate by 45° => Matrix A
        2. Stretch vertically by √3 (= d) => Matrix B
        3. Undo rotation. => Matrix C

        The inverse to undo the skewing is:
        a = S2 + 1     b = S2
        c = S2         d = S2 + 1
        
        Take note that G2 is -S2 to remove the -ve in later lines... I think */
        // let i = Math.floor((this.F2+1)*x + this.F2*y); // direct result
        // let j = Math.floor(this.F2*x + (this.F2+1)*y); 
        // return this.fixedArray[this.fit(i, this.REPEAT_[0])][this.fit(j, this.REPEAT_[1])]; // see grid
        let t = (i+j)*-this.G2; // unskew
        let X0 = i+t,   Y0 = j+t; // return this.fixedArray[this.posMod(floor(X0), this.REPEAT_[0])][this.posMod(floor(Y0), this.REPEAT_[1])];
        // if (this.basicallyEqual(X0, x) &&this.basicallyEqual(Y0, y)) return 1; else return 0; // vertex of skewed square
        let x0 = x-X0,  y0 = y-Y0; // return this.dotHandler([x0, y0]); // distance from cell origin (0, 0)
        
        // [1] Determine if upper or lower triangle through the halfway point. Diagonal seperation by y=x (but the square is skewed)
        let i1, j1; // basically a bool
        if (x0 > y0){ i1 = 1; j1 = 0; } // lower: (0,0)->(1,0)->(1,1)
        else { i1 = 0; j1 = 1;}         // upper: (0,0)->(0,1)->(1,1)
        // return i1? this.dot([x0, y0], [x0, y0]): .5-this.dot([x0, y0], [x0, y0]); // upper & lower triangles (w/ distance)
        
        // let returnVal = 0; if (x0 > this.F2) returnVal += 0.5; if (y0 > this.F2) returnVal += 0.25; return returnVal; // skewed so this doesnt work like i hoped it would
        // let tx = (this.F2+1)*x0 + this.F2*y0; let ty = this.F2*x0 + (this.F2+1)*y0; 
        // return tx; // I guess this is what x0 is secretly representing? replace x0 w/ tx now
        // let returnVal = 0; if (tx > 0.5) returnVal += 0.5; if (ty > 0.5) returnVal += 0.25; return returnVal; // now it's a proper grid :)
        
        // [2] Distance to vertex points
        let x1 = x0-i1 + this.G2,              // middle (depends on upper/lower tri)
            y1 = y0-j1 + this.G2; 
        let x2 = x0+this.staticSimplexOffset,  // opposite. offset unskewPoint(1, 1) 
            y2 = y0+this.staticSimplexOffset;
        
        let ii = this.posMod(i, this.REPEAT_[0]), jj = this.posMod(j, this.REPEAT_[1]); // is there an easier way to loop it back around?
        let g0 = this.randomVector(ii, jj);                                                // gradients of origin corner (0,0)
        let g1 = this.randomVector(this.fit(ii+i1, this.REPEAT_[0]), this.fit(jj+j1, this.REPEAT_[1])); // middle corner (depends on upper/lower tri)
        let g2 = this.randomVector(this.fit(ii+1, this.REPEAT_[0]), this.fit(jj+1, this.REPEAT_[1]));   // opposite corner (1,1)
        // g0 = [g0[0]*this.testFactor, g0[1]*this.testFactor]; g1 = [g1[0]*this.testFactor, g1[1]*this.testFactor]; g2 = [g2[0]*this.testFactor, g2[1]*this.testFactor];

        // [3] Get noise contribution from each corner.
        // https://stackoverflow.com/questions/18340334/simplex-noise-summation
        // weight = max(0.5 - d^2, 0)^4
        // as d increases, weight decreases.
        // when < 0 then no value is added because you crossed the boundary. (so there are corners where each circle doesn't reach :| )

        let t0 = this.staticFalloffOrig - x0*x0-y0*y0; //x0*x0-y0*y0 vs this.distFunc([x0, y0]) looks worse 
        let t1 = this.staticFalloffOrig - x1*x1-y1*y1;
        let t2 = this.staticFalloffOrig - x2*x2-y2*y2;
        t2 = this.smoothFunc(t2); // comically redundant
        t1 = this.smoothFunc(t1);
        t0 = this.smoothFunc(t0);
        // return t0**4 + t1**4 + t2**4;
        let n = 0;
        if (t0 > 0){ t0 *= t0; n += t0*t0 * this.distFunc2(g0, [x0, y0]); } // if (t0 < 0) {} else { ... } idk if pow4 is slower.
        if (t1 > 0){ t1 *= t1; n += t1*t1 * this.distFunc2(g1, [x1, y1]); }
        if (t2 > 0){ t2 *= t2; n += t2*t2 * this.distFunc2(g2, [x2, y2]); } 
        // return (t0 <= 0) && (t1 <= 0)? -100: n*70;
        return n*70; // idk where the 70 comes from or how to get it. *sqrt(2)
    } // normalize the same as perlin
    simplexModifiedNoise(x, y){
        let s = (x+y)*this.F2; let i = Math.floor(x+s), j = Math.floor(y+s);
        let t = (i+j)*-this.G2;
        let X0 = i+t,   Y0 = j+t; 
        let x0 = x-X0,  y0 = y-Y0;
        let i1, j1; 
        if (x0 > y0){ i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1;}
        let x1 = x0-i1 + this.G2, y1 = y0-j1 + this.G2; 
        let x2 = x0+this.staticSimplexOffset, y2 = y0+this.staticSimplexOffset;
        let ii = this.posMod(i, this.REPEAT_[0]), jj = this.posMod(j, this.REPEAT_[1]);
        let g0 = this.randomVector(ii, jj);
        let g1 = this.randomVector(this.fit(ii+i1, this.REPEAT_[0]), this.fit(jj+j1, this.REPEAT_[1]));
        let g2 = this.randomVector(this.fit(ii+1, this.REPEAT_[0]), this.fit(jj+1, this.REPEAT_[1]));
        /* there's a problem with my implementation! the center is not the max value.
        something like:    center              vertex
                        <== 0.96   1  0.96 ==>
        when i want:          1       0.96 ==>
        why am I getting orbitals lol?
        
        // =================================================
        what is going on with x1 & x2? (im dumb)
            The range of values of: x0 -0.21 to 0.79, x1 -0.79 to 0.79, x2 -0.79 to 0.21
                same value for given x/y coords so it's probably the distance to each vertex
                https://www.desmos.com/calculator/niviapw7wd
                these are the coordinates of the first parallelogram formed by unskewing (S2)
                x -0.21, 0.79
                        x 0.57, 0.57

                x 0, 0
                            x 0.79, -0.21
            so... (the actual explanation)
                "unskewing"
                    x = (S2+1)i + (S2)j        y = (S2)i + (S2+1)j
                    x = S2(i+j) + i            y = S2(i+j) + j
                    t = S2(i+j)     x = t+i    y = t+j

                (x2, y2) is always offset to (x0, y0) by a static value
                    (1, 1) = S2(1+1) + 1
                            = 1 + 2*S2       <*S2 = -G2 so it's -offset here>
                (x1, y1) always offset to (x0, y0) to left or right (0, 1) or (1, 0):
                    t = S2(1+0) = S2
                    then + 0 or 1

                Why is it backwards tho?
                    X0 = floor of x, X2 = X0 + offset
                    x2 = x-X2
                    = x - (X0 + offset)
                    = x0 - offset     ta-da
        */

        /*         
        new problem: it's triangular-ish
            dist...
                t0 = invertingconstant - dist((0,0), (x0, y0))
                dot (x0, y0) up to 0.67                        =(^0.5)=> 0.8185. dist from (0, 0) up to 0.82
                this.dotHandler(this.unskewPoint(x0, y0)) up to 2 because normally the max length is sqrt(2)
                this.dotHandler([x0, y0]) / this.dotHandler(this.skewPoint(1, 1)) corrects it to 1. 
                therefore the "inverting constant" is 2/3. now t0 < 0 should never occur!

                [to normalize within 0 to 1...]
                t0 = 1 - this.dotHandler([x0, y0]) * 1.5;
                   = 1 - ( x0*x0+y0*y0 ) * 1.5;
                   = (2/3 - ( x0*x0+y0*y0 )) * 1.5;

            gradient...
            
                [x0, y0]: this.dotHandler([x0, y0])*1.5 = this.distQ([0, 0], [x0, y0]) * sqrt(3/2)
                g0: sqrt(g0[0]**2 + g0[1]**2) // within 1x1 so length is always 1 =_=
                [to normalize within 0 to 1...]
                [1] * sqrt(3/2) 

                could be -ve though. now that t0 is normalized to (0-1), this component is -1 to 1, 
                    but the result is to +/- 0.3417082266971382? why is that
                    if I have the gradient circles of length 1 that reach every other corner,
                         ⟋| Equilateral triangle, sides length 1
                       ⟋  |
                    _⟋____| g (full length 1)
                     ⟍    | opp/adj = tan(60 deg)
                       ⟍  | opp = tan(60 deg) * 0.5
                         ⟍| i have no clue tbh let's try it on desmos
                    or the other one where opp = 1
                    1/adj = tan(60)
                    adj = sqrt(3)  then *2 for full length?
                [2] / (sqrt(.5)/2)   or is it /(sqrt(3)*2)
                    but perlinNormalizer changes [-sqrt(.5), 0, sqrt(.5)] to [basically 0, 0.5, 1]
                [3] *sqrt(.5) to squish to -0.7 to 0.7, redundantly
                ignoring perlinNormalizer... = sqrt(12)     or is it 5*sqrt(.5)?
    
        Radial distance fall off kernel summation thing
        */
        // let w = this.barycentricLerp([0, 0], [i1, j1], [1, 1], this.unskewPoint(x0, y0)); // idk
        // return ( w[0]**4*this.distFunc2(g0, [x0, y0]) + 
        //          w[1]**4*this.distFunc2(g1, [x1, y1]) + 
        //          w[2]**4*this.distFunc2(g2, [x2, y2]) )/3
        let n=0; 
        let t0 = this.staticFalloff - x0*x0-y0*y0; 
        let t1 = this.staticFalloff - x1*x1-y1*y1;
        let t2 = this.staticFalloff - x2*x2-y2*y2;        
        t0 *= 1.5, t1 *= 1.5, t2 *= 1.5; //then n *2.5 but i like the hex it produces :)
        t2 = this.smoothFunc(t2);
        t1 = this.smoothFunc(t1);
        t0 = this.smoothFunc(t0);

        if (t0 > 0){ t0 *= t0; n += t0*t0*this.distFunc2(g0, [x0, y0]); } // if t0 == 0 then there's no need to add anything right? :)
        if (t1 > 0){ t1 *= t1; n += t1*t1*this.distFunc2(g1, [x1, y1]); }
        if (t2 > 0){ t2 *= t2; n += t2*t2*this.distFunc2(g2, [x2, y2]); }
        return (n * 5*sqrt(.5));
    }
    fit(val, REPEAT=1){
        return val >= REPEAT ? val-REPEAT
                    : val < 0? REPEAT+val
                    : val;
        // if (val >= REPEAT){ return val-REPEAT; } else if (val < 0){ return REPEAT+val; } return val;
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
        const refX1 = Math.floor(x), xDif = x-refX1; 
        const refY1 = Math.floor(y), yDif = y-refY1; 
        // [1] Distance to point in same cell (radial gradient)
        // let cellPos;
        //     cellPos = this.randomCoord(refX1, refY1);
        //     cellPos = [cellPos[0] + xCel, cellPos[1] + yCel]; // xCel = Math.floor(x) without pre-tiling (%), changed it so it's refX1 now
        // return this.dist(cellPos[0], cellPos[1], x, y)//Math.sqrt(2)
        
        // [2] Distance to Nth nearest point
        /* i don't know how to optimize, deal with it. */
        var cellPos, n, minDistance = 4; //this.vnorm*2;        
        for (let i=0; i<this.gridPoints.length; i++){
            cellPos = this.randomCoord(this.fit(refX1+this.gridPoints[i][0], this.REPEAT_[0]), this.fit(refY1+this.gridPoints[i][1], this.REPEAT_[1]));
            cellPos = [cellPos[0] + this.gridPoints[i][0] - xDif, cellPos[1] + this.gridPoints[i][1] - yDif ]; // + offset for position relative to center cell at (RefX, RefY) 
            // n = this.dot(cellPos, cellPos);
            // n = this.manhattan([0, 0], cellPos); // wow... that's it?
            // n = this.chebyshev([0, 0], cellPos);
            // n = this.minkowski([0, 0], cellPos, this.testFactor); // floats are bad. 1 is bad. odd numbers are bad.
            n = this.distFunc(cellPos);
            // // minDistance = min(minDistance, n) = min(minDistance, round(n*(this.vnorm)));
            // // minDistance = this.min(minDistance, round(n*this.vnorm));
            minDistance = minDistance < n? minDistance:n;
            // lag central
            // var n = dist(cellPos[0], cellPos[1], xDif, yDif)/Math.sqrt(2);
            // if (n < minDistance){ minDistance = n; }
        }
        // return this.smoothFunc(minDistance/this.vnorm)
        // return this.smoothFunc(Math.sqrt(minDistance/this.vnorm/2)); //*this.sqrtH;
        return this.smoothFunc(Math.sqrt(minDistance*.5)); // to keep or not to keep that is the question
        // [3] Distance to nearest border
        // for (let i=0; i<this.gridPoints.length; i++){ ... }        
    }
    // ======================================================================
    // yes it's all the same code >:(
    flatvoronoiNoise(x, y){
        const refX1 = Math.floor(x), xDif = x-refX1; 
        const refY1 = Math.floor(y), yDif = y-refY1; 
        var fitted, cellPos, n, minCellVal = 0, minDistance = 4;
        for (let i=0; i<this.gridPoints.length; i++){
            fitted = [this.fit(refX1+this.gridPoints[i][0], this.REPEAT_[0]), this.fit(refY1+this.gridPoints[i][1], this.REPEAT_[1])]
            cellPos = this.randomCoord(fitted[0], fitted[1]);
            cellPos = [cellPos[0] + this.gridPoints[i][0] - xDif, cellPos[1] + this.gridPoints[i][1] - yDif ];
            n = this.distFunc(cellPos);
            // n = round(n*this.vnorm);  // REPLACED!
            // if (n < minDistance){ minDistance = n;
            //     // Choose any
            //     // minCellVal = this.fixedArray[fitted[0]][fitted[1]];
            //     minCellVal = this.fixedLengthArray[fitted[0]][fitted[1]];
            //     // minCellVal = (this.fixedLengthArray[fitted[0]][fitted[1]] + this.fixedArray[fitted[0]][fitted[1]])/2;
            // }
            minCellVal = minDistance < n? minCellVal:this.fixedLengthArray[fitted[0]][fitted[1]];
            minDistance = minDistance < n? minDistance:n;
        }
        return this.smoothFunc(minCellVal);
    }
    F2voronoiNoise(x, y){ // Extremly slow
        const refX1 = Math.floor(x), xDif = x-refX1; 
        const refY1 = Math.floor(y), yDif = y-refY1; 
        var minDistances = [], cellPos, n;
        for (let i=0; i<this.gridPoints.length; i++){
            cellPos = this.randomCoord(this.fit(refX1+this.gridPoints[i][0], this.REPEAT_[0]), this.fit(refY1+this.gridPoints[i][1], this.REPEAT_[1])); // fitted
            cellPos = [cellPos[0] + this.gridPoints[i][0] - xDif, cellPos[1] + this.gridPoints[i][1] - yDif ]; // + offset for position relative to center cell at (RefX, RefY) 
            n = this.distFunc(cellPos);
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
            return this.fixedLengthArray[this.fit(refX1+this.gridPoints[secMinID][0], this.REPEAT_[0])] // fitted variable
            [this.fit(refY1+this.gridPoints[secMinID][1], this.REPEAT_[1])];
        }
        minDistances = minDistances.slice(0, firstMinID).concat(minDistances.slice(firstMinID+1)); // ouuuuch
        
        return this.F2VMode == 0 ? this.smoothFunc(Math.sqrt(min(minDistances) )/2) // welp i tried
         :this.F2VMode == 2? this.smoothFunc(Math.sqrt((min(minDistances) - firstMin) )/2)
        //  this.basicallyEqual(Math.sqrt((min(minDistances) - firstMin) )/2, 0)? 100 :Math.sqrt((min(minDistances) - firstMin) )/2
         :this.F2VMode == 3? this.smoothFunc((Math.sqrt(min(minDistances) + Math.sqrt(firstMin)) )/2) // watery
         :this.smoothFunc((Math.sqrt(min(minDistances)) + Math.sqrt(firstMin))/2 ); // bacteria-y
    } // didn't check the range 😋

    // https://iquilezles.org/articles/smoothvoronoi/
    smoothvoronoiNoise(x, y){
        const refX1 = Math.floor(x), xDif = x-refX1; 
        const refY1 = Math.floor(y), yDif = y-refY1; 
        var cellPos, n, smoothDistance = 0;        
        for (let i=0; i<this.gridPoints.length; i++){
            cellPos = this.randomCoord(this.fit(refX1+this.gridPoints[i][0], this.REPEAT_[0]), this.fit(refY1+this.gridPoints[i][1], this.REPEAT_[1]));
            cellPos = [cellPos[0] + this.gridPoints[i][0] - xDif, cellPos[1] + this.gridPoints[i][1] - yDif ]; 
            // n = this.dot(cellPos, cellPos);
            n = this.distFunc(cellPos);
            smoothDistance += 1.0/pow( n, 8.0 );
        } 
        return this.smoothFunc(pow( 1.0/smoothDistance, 1.0/16.0)); 
    }
    // https://www.ronja-tutorials.com/post/028-voronoi-noise/
    bordervoronoiNoise(x,y){
        const refX1 = Math.floor(x), xDif = x-refX1; 
        const refY1 = Math.floor(y), yDif = y-refY1; 
        let cellPos = []; // the 9 looped calculations stored in array.
        let minCell = -1, n, fitted, minDistance = 4; // minCell is index. n temporary
        var toCenter, cellDiff, edgeDist, minEdgeDistance=10;
        for (let i=0; i<this.gridPoints.length; i++){
            fitted = [this.fit(refX1+this.gridPoints[i][0], this.REPEAT_[0]), this.fit(refY1+this.gridPoints[i][1], this.REPEAT_[1])];
            cellPos.push(this.randomCoord(fitted[0], fitted[1]));
            cellPos[i] = [cellPos[i][0] + this.gridPoints[i][0] - xDif, cellPos[i][1] + this.gridPoints[i][1] - yDif ];
            n = this.dot(cellPos[i], cellPos[i]); // if centered at (x, y), it points to the other feature points. 
            // if (n < minDistance){  minDistance = n; minCell = i; }
            minCell = minDistance < n? minCell:i;
            minDistance = minDistance < n? minDistance:n;
        }
        // [3] Distance to nearest border
        for (let i=0; i<this.gridPoints.length; i++){
            if (minCell == i){ continue; } // skip. excluding closest cell
            // toCenter = [(cellPos[i][0]+cellPos[minCell][0])*.5, // center of closest feature and current feature
            //             ([i][1]+cellPos[minCell][1])*.5];
            toCenter = [(cellPos[i][0]+cellPos[minCell][0]),   // do you really need to /2? i guess to avoid the flat surfaces.
                        (cellPos[i][1]+cellPos[minCell][1])];
            cellDiff = [cellPos[i][0]-cellPos[minCell][0],  // feature - closest feature
                        cellPos[i][1]-cellPos[minCell][1] ];
            // cellDiff = [cellPos[i][0]-2*cellPos[minCell][0],  // blobby :3 (sharp edges tho)
            //             cellPos[i][1]-2*cellPos[minCell][1] ];
            // edgeDist = this.dot(toCenter, cellDiff)
            edgeDist = this.distFunc2(toCenter, cellDiff);
            
            cellPos.push(this.randomCoord(fitted[0], fitted[1]));
            minEdgeDistance = minEdgeDistance < edgeDist? minEdgeDistance : edgeDist
            // console.log(edgeDist, toCenter, cellDiff)
        }
        minEdgeDistance *= .5;
        // if ((minEdgeDistance/this.vnorm >1 ) || (minEdgeDistance/this.vnorm < 0)){ console.log(minEdgeDistance/this.vnorm)}
        // return this.basicallyEqual(minEdgeDistance, 0)? 100 :minEdgeDistance;
        return minEdgeDistance; 
    }
    // ======================================================================
    /* Ultra Lag
    https://www.youtube.com/watch?v=cWiLGZPwXCs
    https://iquilezles.org/articles/warp/       omg pick one
    fbm(p + fbm(p))
    fbm(p + fbm(p + fbm(p)))

    let n = this.FBM_noise(fx, fy, lacunarity, gain, 
        z=strength*this.FBM_noise(size*fx, size*fy, lacunarity, gain));    
    https://gamedev.stackexchange.com/questions/176819/domain-warping-with-perlin-noise
    ok?
    i must be doing something wrong because this still looks very different
    it's the pre-normalizing...

    what is Lighting?
    let p1 = this.noise(fx+this.diff, fy, x, y);
    let p2 = this.noise(fx-this.diff, fy, x, y);
    let p3 = this.noise(fx, fy+this.diff, x, y);
    let p4 = this.noise(fx, fy-this.diff, x, y);
    let diffuseStrength = max(0, this.dot([p1-p2, p3-p4], [1.0, 1.0]) + this.diff); // dot normal w/ [1, 1, 1]
    return diffuseStrength * 100;
    
    we can't just compare the surrounding pixels
    the actual values have to be calculated 🤦‍♀️
    4x the work 😡
       3
    2  x  1    does this mean noise has to output 0 - 1?
       4
    
    */
    // i mean the point of this is to have more detailed on close up 
    // so f < 0.005 is pretty much necessary ¯\_(ツ)_/¯
    DMW(fx, fy, x, y){
        let n1, n2, n;
        n1 = this.FBM(fx    , fy    , x, y, this.divider);            
        n2 = this.FBM(fx+5.2, fy+1.3, x, y, this.divider); 
        n  = this.FBM(n1*this.dmwStrength, n2*this.dmwStrength, x, y, this.divider);   
        return n;
    }
    DMW2(fx, fy, x, y){ // oh boi we have to add upon FBM noooooo
        let n1, n2, n;
        n1 = this.FBM(fx    , fy    , x, y);            
        n2 = this.FBM(fx+5.2, fy+1.3, x, y); 
        n1 = this.FBM(fx+n1*this.dmwStrength + 1.7, fy+n1*4 + 9.2, x, y);   
        n2 = this.FBM(fx+n2*this.dmwStrength + 8.3, fy+n2*4 + 2.9, x, y);
        n  = this.FBM(n1, n2, x, y, this.divider);   
        return n; // results too varied i won't normalize
    }
    DMW3(fx, fy, x, y){
        let n1, n2, n;
        n1 = this.FBM(fx    , fy    , x, y);            
        n2 = this.FBM(fx+5.2, fy+1.3, x, y); 
        n1 = this.FBM(fx+n1*this.dmwStrength + 1.7, fy+n1*4 + 9.2, x, y);   
        n2 = this.FBM(fx+n2*this.dmwStrength + 8.3, fy+n2*4 + 2.9, x, y);
        n  = this.FBM(n1*this.dmwStrength, n2*this.dmwStrength, x, y, this.divider);   
        return n; }


    /* Displaying Functions */
    FBM(x, y, origX, origY, divider=1){
        let n = 0, amplitude = 1, frequencyX = x; var frequencyY = y; // start w/ amplitude = 1 to avoid re-calculating rate**(layer-1) 
        for (let l=0; l<this.layers; l++){
            n += 
                this.enableProcess(
                    this.enableNormalization(this.noiseFunc(this.enablePosMod(frequencyX, this.REPEAT_[0]), this.enablePosMod(frequencyY, this.REPEAT_[1])))*this.amp
                    , origX, origY
                ) // optional process func?
                * amplitude;    
            amplitude *= this.g; frequencyX *= this.lacunarity; frequencyY *= this.lacunarity;
        }
        n = (divider != 1.)? n /= divider: n;
        // if (n > val[0]){ val[0] = n;} else if (n < val[1]){ val[1] = n;}
        return n;
    }
    /*
    example(){
        let n;
        for (var x = 0; x < this.width; x++){
            for (var y = 0; y < this.height; y++){
                // var n = this.noiseFunc((x+this.xOffset)*this.f, (y+this.yOffset)*this.f); // * this.amp? 
                // this.posMod() to tile, including -ves, except simplex
                // this.normalizerFunc(n) * this.amp;

                n = this.noiseFunc(   
                    // this.enablePosMod((x+this.xOffset)*this.f , this.REPEAT_[0]),  // simplex does not like 
                    // this.enablePosMod((y+this.yOffset)*this.f , this.REPEAT_[1])
                    
                    // find the precise f required before it gets rounded.
                    // wait it only fixes the last row =_=
                    this.enablePosMod((Math.round(x*this.resolution)+this.xOffset)*this.freq , this.REPEAT_[0]),  // simplex does not like 
                    this.enablePosMod((Math.round(y*this.resolution)+this.yOffset)*this.freq , this.REPEAT_[1])
                );
                n = this.normalizerFunc(n) *this.amp;
                this.pixelArray[y][x] = this.processFunc(n, x, y);
            // if (y > (1/this.f)){ break; } // 1/f = target pixels for 1 grid cell
        }
    }} */
    SingleNoiseLayer(x, y){ return this.enableNormalization( this.noiseFunc(x , y) ) * this.amp; }
    generateImage(){
        this.REPEAT_ = [int(this.REPEATX), int(this.REPEATY)]; // If i were smarter I would put this in the setup slider
        this.f = this.freq * this.resolution;
        this.g = this.gain == 0 ? 1/this.lacunarity : this.gain; // FBM
        this.divider = 0; for (let l=0; l<this.layers; l++){ this.divider += this.g**l } // partial sum of infinite series thing
        this.diffScaled = float(this.diff); 
        // as you zoom in, the window of the slope should be narrower
        // so..?

        let n;
        if (this.QuickSwitchToNormalNoise){
            for (var x = 0; x < this.width; x++){ for (var y = 0; y < this.height; y++){
                n = this.SingleNoiseLayer(
                    this.enablePosMod((Math.round(x*this.resolution)+this.xOffset)*this.freq , this.REPEAT_[0]),
                    this.enablePosMod((Math.round(y*this.resolution)+this.yOffset)*this.freq , this.REPEAT_[1])
                )
                this.pixelArray[y][x] = this.processFunc(n, x, y);
            }}
            return; } // else        
        if (this.lighting){ // did i do it wrong
            let n2, n3, n4, fx, fy;
            for (var x = 0; x < this.width; x++){ 
            for (var y = 0; y < this.height; y++){ // do i need to x*this.resolution on processFunc? maybe
                fx = (this.nearestFunc(x*this.resolution)+this.xOffset)*this.freq;
                fy = (this.nearestFunc(y*this.resolution)+this.yOffset)*this.freq;

                n  = this.displayFunc(this.enablePosMod(fx+this.diffScaled, this.REPEAT_[0]), this.enablePosMod(fy, this.REPEAT_[1]), x, y, this.divider);
                n2 = this.displayFunc(this.enablePosMod(fx-this.diffScaled, this.REPEAT_[0]), this.enablePosMod(fy, this.REPEAT_[1]), x, y, this.divider);
                n3 = this.displayFunc(this.enablePosMod(fx, this.REPEAT_[0]), this.enablePosMod(fy+this.diffScaled, this.REPEAT_[1]), x, y, this.divider);
                n4 = this.displayFunc(this.enablePosMod(fx, this.REPEAT_[0]), this.enablePosMod(fy-this.diffScaled, this.REPEAT_[1]), x, y, this.divider);
                n = max(0, this.dot([n-n2, n3-n4, 0.001], this.lightingVec) + this.diffScaled)*100; // dot normal w/ [1, 1, 1]?
                this.pixelArray[y][x] = this.processFunc(n, x, y); // idk how to normalize
            }}
            return;
        }
        //// v4! now noticeably laggier
        for (var x = 0; x < this.width; x++){ // might need to fix it w/ resolution :|
            for (var y = 0; y < this.height; y++){
                n = this.displayFunc(
                    this.enablePosMod((this.nearestFunc(x*this.resolution)+this.xOffset)*this.freq , this.REPEAT_[0]),
                    this.enablePosMod((this.nearestFunc(y*this.resolution)+this.yOffset)*this.freq , this.REPEAT_[1]),
                    x, y, this.divider
                );
                // this.pixelArray[y][x] = this.closestPoint((x+this.xOffset)*this.f, (y+this.yOffset)*this.f);
                this.pixelArray[y][x] = this.processFunc(n, x, y);
        // if (y > (1/this.f)){ break; } // 1/f = target pixels for 1 grid cell
        }}
    }
    testForMinMax(){ // oh :|
        this.testBoundary = [500, -500, false];
        for (var y = 0; y < this.height; y++){ // find min/max
            for (var x = 0; x < this.width; x++){
                var n = this.pixelArray[y][x];
                n = n != n? "bruh": n; // deal w/ NaN
                if (n == "bruh"){ this.testBoundary[2] = true; continue; }
                this.testBoundary[0] = this.testBoundary[0] < n? this.testBoundary[0]: n;
                this.testBoundary[1] = this.testBoundary[1] > n? this.testBoundary[1]: n;
            }}
        if (this.autonorm){
        for (var y = 0; y < this.height; y++){ // auto norm values. ugly 3 loops D:
            for (var x = 0; x < this.width; x++){
                this.pixelArray[y][x] = this.remap(this.pixelArray[y][x], this.testBoundary[0], this.testBoundary[1], 0, 1);
                this.pixelArray[y][x] *= this.amp;  // extremely lazy
        }}}
        document.querySelector('[class*="display_Test"]').innerHTML = 
            `${this.rPout(this.testBoundary[0])} ${this.rPout(this.testBoundary[1])} ${this.testBoundary[2]?"(NaN present)":""}`;
    }
    fixResolution(){  // need to consider gridding separately
        // In consideration of resolution steps... each pixel is magnified
        for (var y = 0; y < this.staticHeight; y++){ // set each pixel
            for (var x = 0; x < this.staticWidth; x++){
                var n = this.pixelArray[this.nearestFunc(y/this.resolution)][this.nearestFunc(x/this.resolution)]; // to the value at the floor
                // var n = this.pixelArray[y][x];
                this.cloneArray[x][y] = n;
        }} // if we only set the values of a smaller arrai
        //unfortunately this causes the graph to shrink because it doesn't actually blur
    }
    loadImage(){
        for (var y = 0; y < this.staticHeight; y++){ // set pixels
            for (var x = 0; x < this.staticWidth; x++){
                var n = this.moreFunc(this.cloneArray[x][y], x+this.xOffset, y+this.yOffset, this.nearestFunc(x/this.resolution),this.nearestFunc(y/this.resolution));                
                // check min/max here if ignoring auto norm
                if (this.colorInverse){ n = 1-n; };  //  if (this.colorInverse){ n = 1-n; };  cry about it        
                let color = this.colorFunc(n);
                setPixel(x, y, color);
            }}
    }
    /* Miscallaneous */
    showOnTop(){
        if (this.freq > 0.4) { console.log('no gradients 4 u>:('); return;} // not needed for last one?
        if (this.extraMode == "1") { this.showGradients(); }
        else if (this.extraMode == "2") { this.showGradientsSimplex(); }
        else if (this.extraMode == "3") { this.showGradientsVoronoi(); }
        else if (this.extraMode == "4") { this.showGradientBoxDetails(); updatePixels();  }
    }    
    
    basicallyEqual(a, b, factor=0.9999, f=this.freq){return Math.abs(a-b) < f*factor;  } /* can't do fixed value because of f=0.03 */
    // should i consider resolution as well? nah
    showGradients(){
        let f = this.freq
        strokeWeight(2); fill(0,0); stroke('#DDDDDD88');
        for (var x = 0; x < (this.staticWidth); x++){
            for (var y = 0; y < (this.staticHeight); y++){
                let x2 = (x+this.xOffset); 
                let y2 = (y+this.yOffset); // console.log(Math.abs(int(x*f)-x*f));
                /* Every cell that at interval */
                if (this.basicallyEqual(Math.floor(x2*f), x2*f) && this.basicallyEqual(Math.floor(y2*f), y2*f)){
                    var refX1 = this.posMod(Math.floor(x2*f), this.REPEAT_[0]);
                    var refY1 = this.posMod(Math.floor(y2*f), this.REPEAT_[1]);
                    var val = this.randomVector(refX1, refY1);
                    
                    var x1 = Math.floor(x+val[0]); var y1 = Math.floor(y+val[1]);
                    // stroke([random()*64+128, random()*5+50, random()*64+128, 128])
                    line(x1, y1, Math.ceil(x+val[0]/f), Math.ceil(y+val[1]/f)); circle(x, y, 0.1/f);
                } // if (y >= (1/f)){ break; }
            } // if (x >= (1/f)){ break; }
        }
    }
    rotatePoint(x, y, a=0){ // yippee
        let newA = a*Math.PI/180
        return Math.cos(newA)*x - Math.sin(newA)*y, Math.sin(newA)*x + Math.cos(newA)*y;}
    showGradientsSimplex(){
        let f = this.freq;
        strokeWeight(2); fill(0,0); stroke('#DDDDDD88');
        for (var x = 0; x < (this.staticWidth); x++){
            for (var y = 0; y < (this.staticHeight); y++){
                let x2 = (x+this.xOffset); 
                let y2 = (y+this.yOffset); 

                let Ref = this.unskewPoint(x2*f, y2*f);
                let refX1 = Math.floor(Ref[0]), refY1 = Math.floor(Ref[1]); // integer
                let Pos = [Ref[0]-refX1, Ref[1]-refY1];
                if (this.basicallyEqual(0, Pos[0], 1.7) && this.basicallyEqual(0, Pos[1],1.7)){ // 0.5 is the center
                    let val = this.randomVector(this.posMod(refX1, this.REPEAT_[0]), this.posMod(refY1, this.REPEAT_[1]));;
                    // let newX, newY = this.skewPoint(val[0], val[1]); //this.rotatePoint(x2, y2, val);
                    line(x, y, x+(val[0])/f, y+(val[1])/f)
                    circle(x, y, 0.1/f);
                }
    }}}
    showGradientsVoronoi(){
        let f = this.freq;
        strokeWeight(2); fill(0,0); stroke('#DDDDDD88');
        for (var x = 0; x < (this.staticWidth); x++){
            for (var y = 0; y < (this.staticHeight); y++){
                let x2 = (x+this.xOffset); 
                let y2 = (y+this.yOffset); 
                if (this.basicallyEqual(Math.floor(x2*f), x2*f) && this.basicallyEqual(Math.floor(y2*f), y2*f)){
                    var refX1 = this.posMod(Math.floor(x2*f), this.REPEAT_[0]);
                    var refY1 = this.posMod(Math.floor(y2*f), this.REPEAT_[1]);
                    var cellPos = this.randomCoord(refX1, refY1);
                    line(x, y, x+(cellPos[0])/f, y+(cellPos[1])/f)
                    circle(x, y, 0.1/f);
                }
    }}}

    // https://stackoverflow.com/questions/4011793/this-is-undefined-in-javascript-class-methods
    // https://www.google.com/search?q=javascript+pass+a+function+into+another+function+in+clas&client=firefox-b-d&sca_esv=f96236a721133e6f&ei=PxJUaOD1Lr2hnesP_b_fqAs&ved=0ahUKEwigkdabzf2NAxW9UGcHHf3fF7UQ4dUDCBA&uact=5&oq=javascript+pass+a+function+into+another+function+in+clas&gs_lp=Egxnd3Mtd2l6LXNlcnAiOGphdmFzY3JpcHQgcGFzcyBhIGZ1bmN0aW9uIGludG8gYW5vdGhlciBmdW5jdGlvbiBpbiBjbGFzSABQAFgAcAB4AJABAJgBAKABAKoBALgBA8gBAPgBAZgCAKACAJgDAJIHAKAHALIHALgHAMIHAMgHAA&sclient=gws-wiz-serp
    oil(n, x2=null, y2=null, x=0, y=0){
        if (x >= this.staticWidth-1 || y >= this.staticHeight -1) return n;
        if (Math.abs(this.pixelArray[y][x] - this.pixelArray[y+1][x+1]) < 3/255*this.resolution ){ 
        return n *= this.gridFactor; } // darken
        return n;
    }
    gridding(n, x=0, y=0){  /* Every cell that at interval */
        let f=this.freq;    
        // if (this.basicallyEqual(int(x2*this.freq, 2), x2*this.freq) && 
            // this.basicallyEqual(int(y2*this.freq, 2), y2*this.freq, 2)){  console.log(x, y); } // 0, 20, 40, 60, 80 etc. to 220 @f = 0.05
        if (this.basicallyEqual(int(x*f, 2, f), x*f) ||
            this.basicallyEqual(int(y*f, 2, f), y*f)){       // i guess i used round(, 2) initially but i forgot already
            // this.pixelArray[y][x] = (this.pixelArray[y][x]+0.25)%1; // cycle
            return n * this.gridFactor; } // lighten
        // corners are brighter
        // let h = this.height*this.freq-1; let w = this.width*this.freq-1;
        // for (let x2 = 0; x2 < this.width-1; x2++){ 
        //     for (let y = 0; y < h; y++){ this.pixelArray[round(y/this.freq)][x2] *= 1.5; }}
        // for (let y2 = 0; y2 < this.height-1; y2++){ 
        //     for (let x = 0; x < w; x++){ this.pixelArray[y2][round(x/this.freq)] *= 1.5; }}
        return n;
    }
    griddingSimplex(n=0, x=0, y=0, half=true){
        let f=this.freq;
        x *= f; y *= f;
        let Ref = this.unskewPoint(x, y);
        let refX1 = Math.floor(Ref[0]), refY1 = Math.floor(Ref[1]); // integer
        let Pos = [Ref[0]-refX1, Ref[1]-refY1];                
        if (this.basicallyEqual(Pos[1], 0) || this.basicallyEqual(Pos[0], 0) ) { return n *= this.gridFactor; }
        // if (this.basicallyEqual(refX1, round(x2+s, 2)) ||
        // this.basicallyEqual(refY1, round(y2+s, 2))){ 
        //     this.pixelArray[y][x] *= set; continue;}
        if (half){ // show diagonal             
            if (this.basicallyEqual(Pos[1], Pos[0])) { 
                return n *= this.gridFactor; }}
        return n;
    }  

    /* Generic functions to apply on noise */ 
    // https://www.scratchapixel.cm/lessons/procedural-generation-virtual-worlds/procedural-patterns-noise-part-1/simple-pattern-examples.html
    turbulence(n){
        // for (let x = 0; x < this.width-1; x++){ for (let y = 0; y < this.height-1; y++){
        //     this.pixelArray[y][x] = Math.abs(this.pixelArray[y][x]*2-1); }}
        return Math.abs(n*2-1); }
        // return Math.abs(n*this.turbulenceFactor-1)/(this.turbulenceFactor-1); }

    marble(n, x=0){ //  f = 0.01, FBM and this.marbles = 100;
        // failed return sin(n*100*Math.PI*2)+1;
    // why isn't this symmetric
        return (Math.sin(((x * this.resolution+this.xOffset)+100*n) * (1/this.marbles) * Math.PI*2) + 1) / 2; }
    wood(n){ return n*this.woods - Math.floor(n*this.woods); }
    // central(n, x=0, y=0) { for (let i =0; i < int(this.testFactor); i++){ n = Math.abs(n-(int(this.testFactor)/(int(this.testFactor)+1))); } return n }
    // https://web.cs.wpi.edu/~matt/courses/cs563/talks/noise/noise.html
    xPeriod = 1; yPeriod = 1;
    central(n, x=0, y=0) { 
        // return this.negNormalizer(Math.sin(this.dotHandler([ (x * this.resolution - this.staticWidth/2) * 2, y*this.resolution - this.staticHeight ])
        // * n / this.marbles) * (y*this.resolution/this.staticHeight*2));
        return this.negNormalizer(Math.sin((this.freq) * this.dotHandler([
            (x * this.resolution - this.staticWidth/2) *this.xPeriod , 
            (y * this.resolution - this.staticHeight/2)*this.yPeriod ] ) 
             * n / this.marbles));
    } 
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
        if (abs(newVal) <= 0.002) { newVal = 0; }
        if (isY){ this.yOffsetRate = newVal; sliderText.innerHTML = round(this.yOffsetRate, 4); return; }
        this.xOffsetRate = newVal; sliderText.innerHTML = round(this.xOffsetRate, 4);
    }
    changeOffset(){
        this.xOffset += this.xOffsetRate; this.yOffset += this.yOffsetRate;
        if (this.stop0) /* no -ves please :) */
        { if (this.xOffset < 0){ this.xOffset = 0; } if (this.yOffset < 0){ this.yOffset = 0; } } 
        if (this.display_Offset != null) {
            this.display_Offset.innerHTML = this.rPout(this.xOffset, 2)+" "
                                            +this.rPout(this.yOffset, 2); return; }
    }
    // sliderFactor = log(1.2+1)/log(2)/10; 
    // example: end = 4, range max = 10. log(end+1)/log(2)/(max)
    // 10^10log10(4+1)x? so factor = log(end+1)*10
    setSlider(slider, key, sliderText=null){ 
        // let newVal = 2**(slider.value * this.sliderFactor)-1;
        let newVal = (slider.value/10) ** 2;

        newVal = round(newVal, 3);
        this[key] = newVal; sliderText.innerHTML = newVal; }

    rotateGradients(){
        if ((this.rot == 0) || (this.rot%360 == 0)) {return} /* no change */
        for (var x = 0; x < (this.fixedArray.length); x++){
            for (var y = 0; y < (this.fixedArray[x].length); y++){

                var newVal = this.rot == 450? 0: 
                        this.fixedArray[x][y] + int(this.rot)/360/2/Math.PI;
                this.fixedArray[x][y] = newVal > 1? 0: newVal; /* loop back to 0 */
            }}
        // For voronoi when using the mode that repeats
        // (where 0 & 1 are the same via abs or sin)
        // if (this.displayFuncBtns == "4" || this.displayFuncBtns == "1"){ }
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
        if (this.SEED != 0 && this.nothing){ console.log("you sneaky... "); this.nothing = false; }
        
        this.fixedArray = this.noiseBase2(this.SEED); // gn.SEED = change the value :)
        this.fixedLengthArray = this.noiseBase2(this.SEED+1);
        this.xOffset = 0; this.yOffset = 0; this.freq = 0.05; this.amp = 1;}
    /* directions */
    setVal(slider, key, sliderText=null){ 
        this[key] = slider.value; 
        if (sliderText != null) {sliderText.innerHTML = this[key];} 
        // custom stuff
        if (key == "displayFunc"){ 
            if (this.clipFrameRateForIntensive && (slider.value == 7 || slider.value == 8)){ frameRate(10); console.log('clipped')} else { frameRate(60); } // insurance for when my computer had a stroke
            // too lazy to "fix" ^^ when switch while active 
        } else if (key == "resolution"){
            this.width = this.nearestFunc(this.staticWidth/this.resolution);
            this.height = this.nearestFunc(this.staticHeight/this.resolution);
            // this.width = this.width > this.staticWidth ? this.staticWidth : this.width;
            // this.height = this.height > this.staticHeight ? this.staticHeight : this.height;
        }
    }
    setAllFunc(btn, args=""){ // for quicker testing. i am not setting the buttons tho
        if (btn.value == 0){  this.setFunc({"value": "Perlin"}, "noiseFunc");  this.setFunc({"value": "On"}, "smoothFunc"); 
            this.setFunc({"value": "2"}, "moreFunc"); this.setVal({"value": "1"}, "extraMode");
            this.setFunc({"value": "1"}, "displayFunc"); this.setVal({"value": "0"}, "clickMode");
        } else if (btn.value == 1){ this.setFunc({"value": "Simplex"}, "noiseFunc"); this.setFunc({"value": "Off"}, "smoothFunc"); 
            this.setFunc({"value": "4"}, "moreFunc"); this.setVal({"value": "2"}, "extraMode");
            this.setFunc({"value": "6"}, "displayFunc"); this.setVal({"value": "2"}, "clickMode");
        } else if (btn.value == 2){ this.setFunc({"value": "Voronoi"}, "noiseFunc"); this.setFunc({"value": "Off"}, "smoothFunc"); 
            this.setFunc({"value": "2"}, "moreFunc"); this.setVal({"value": "3"}, "extraMode");
            this.setFunc({"value": "4"}, "displayFunc"); this.setVal({"value": "1"}, "clickMode");
        } else if (btn.value == 4){  this.setFunc({"value": "Perlin"}, "noiseFunc");  this.setFunc({"value": "On"}, "smoothFunc"); 
            this.setFunc({"value": "0"}, "moreFunc"); this.setVal({"value": "0"}, "extraMode");
            this.setFunc({"value": "1"}, "displayFunc"); this.setVal({"value": "0"}, "clickMode");
        } else if (btn.value == 5){ this.setFunc({"value": "Simplex2"}, "noiseFunc"); this.setFunc({"value": "Off"}, "smoothFunc"); 
            this.setFunc({"value": "0"}, "moreFunc"); this.setVal({"value": "0"}, "extraMode");
            this.setFunc({"value": "6"}, "displayFunc"); this.setVal({"value": "2"}, "clickMode");
        }  // compare simplex and perlin easily
    }
    setFunc(btn, key="noiseFunc"){  
        /* type of noise */
        if (key == "noiseFunc"){
            if (btn.value == "Value"){ this[key] = this.valueNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else if (btn.value == "Perlin"){ this[key] = this.perlinNoise.bind(this); this.normalizerFunc = this.perlinNormalizer.bind(this); }
            else if (btn.value == "Simplex"){ this[key] = this.simplexNoise.bind(this); this.normalizerFunc = this.perlinNormalizer.bind(this); }
            else if (btn.value == "Simplex2"){ this[key] = this.simplexModifiedNoise.bind(this); this.normalizerFunc = this.negNormalizer.bind(this); }
            else if (btn.value == "Voronoi"){ this[key] = this.voronoiNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else if (btn.value == "SVoronoi"){ this[key] = this.smoothvoronoiNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else if (btn.value == "FVoronoi"){ this[key] = this.flatvoronoiNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else if (btn.value == "2Voronoi"){ this[key] = this.F2voronoiNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else if (btn.value == "BVoronoi"){ this[key] = this.bordervoronoiNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else if (btn.value == "Sine"){ this[key] = this.sineNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); }
            else { this[key] = this.randomNoise.bind(this); this.normalizerFunc = this.defaultWrapper.bind(this); } /* Random */
            this.noiseFuncMode = btn.value;
            if (btn.value.search("Simplex") > -1){ this.enablePosMod = this.defaultWrapper.bind(this); } else { this.enablePosMod = this.posMod.bind(this); }
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
            else if (btn.value == "central"){ this[key] = this.central.bind(this); }
            else {this[key] = this.defaultWrapper.bind(this); }
            this.processFuncMode = btn.value;
        }
        if (key == "distFunc"){
            if (btn.value == "Manhattan"){ this[key] = this.manhattanHandler.bind(this); this.distFunc2 = this.manhattanHandler2.bind(this); }
            else if (btn.value == "Chebyshev"){ this[key] = this.chebyshevHandler.bind(this); this.distFunc2 = this.chebyshevHandler2.bind(this); }
            else if (btn.value == "Minkowski"){ this[key] = this.minkowskiHandler.bind(this); this.distFunc2 = this.minkowskiHandler2.bind(this); }
            else {this[key] = this.dotHandler.bind(this); this.distFunc2 = this.dot.bind(this); }
            this.distFuncMode = btn.value;
        }
        if (key == "moreFunc") { 
            if (btn.value == 1){ this[key] = this.oil.bind(this); // requires information from other pixels :) i.e. not standalone
            } else if (btn.value == 2) { this[key] = this.gridding.bind(this); 
            } else if (btn.value == 3) { this[key] = function (n, x, y, x2, y2){ return this.griddingSimplex(n, x, y, false) }; // this.griddingSimplex.bind(this);
            } else if (btn.value == 4) { this[key] = this.griddingSimplex.bind(this);// function (n, x, y, x2, y2){ return this.griddingSimplex(n, x, y) };
            } else {this[key] = this.defaultWrapper.bind(this); }
            this.moreMode = btn.value;
        }
        if (key == "displayFunc"){
        // switch ( this.QuickSwitchToNormalNoise? 0: int(this.displayFunc)){ // does not act like == more like ===
        // case 0: this.SingleNoiseLayer();
        // break; case 3: this.FBM();
            if (btn.value == 0){ this[key] = this.SingleNoiseLayer.bind(this); // requires information from other pixels :) i.e. not standalone
            } else if (btn.value == 3) { this[key] = this.FBM.bind(this); 
            } else if (btn.value == 7) { this[key] = this.DMW.bind(this);
            } else if (btn.value == 8) { this[key] = this.DMW2.bind(this);
            } else if (btn.value == 9) { this[key] = this.DMW3.bind(this);

            } else if (btn.value == 1) { this[key] = this.showGradientBoxes.bind(this); 
            } else if (btn.value == 2) { this[key] = this.averageGradientBoxes.bind(this); 
            } else if (btn.value == 4) { this[key] = this.closestPoint.bind(this); 
            } else if (btn.value == 5) { this[key] = this.simplexGradient.bind(this);
            } else if (btn.value == 6) { this[key] = this.simplexGradientHex.bind(this);
            } else {this[key] = this.defaultWrapper.bind(this); }
            this.displayMode = btn.value;
            if (btn.value == 6 || (this.noiseFuncMode.search("Simplex") > -1)){ this.enablePosMod = this.defaultWrapper.bind(this); } else {
                this.enablePosMod = this.posMod.bind(this); }
            // the inherent problem of "When to update a variable that is tied to multiple settings?
            //                          From hard coded conditions or each time something is changed?"
        }
        this.toggleNormalizer();
        this.toggleProcess();
    }
    toggleNoLoop(){
        this.noLoopVar = !this.noLoopVar;
        if (this.noLoopVar){ noLoop(); } else {loop(); }
        return this.noLoopVar; }
    trigger(){ loop(); noLoop(); }
    toggle(key){
        this[key] = !this[key];
        return this[key]; }
    toggleNormalizer(){ // normFunc stores normalization when enabled. to follow DMW
        if (this.norm){ this.enableNormalization = this.normalizerFunc.bind(this); }
        else { this.enableNormalization = this.defaultWrapper.bind(this); }
    }
    toggleProcess(){ 
        if (this.processFBM){ this.enableProcess = this.processFunc.bind(this); }
        else { this.enableProcess = this.defaultWrapper.bind(this); }
    }

    /* Change specific rotations */
    handlePress(){
        if (mouseX < this.staticWidth && mouseY < this.staticHeight // within canvas
            // && (Math.abs(this.xOffset) < 5) && (Math.abs(this.yOffset) < 5)
        ){
        // if (mouseX == 0 && mouseY == 0){ return; } // alert('hey'); pre v1.11.8 on firefox this triggers when selecting dropdown menu
        // var xOff = this.xOffset * this.resolution; var yOff = this.yOffset * this.resolution; var f = this.freq / this.resolution;
        var xOff = this.xOffset, yOff = this.yOffset, f = this.freq;
        var x = (mouseX+xOff)*f, y = (mouseY+yOff)*f;
        if (this.clickMode == 0){ x = round(x); y = round(y); }
        else if (this.clickMode == 1){ x = floor(x); y = floor(y); }
        // else if (this.clickMode == 2){ let s = (x+y)*this.F2;
        //     x = Math.floor(x+s), y = Math.floor(y+s); }
        this.triggerCirclesRef = [x, y]; // (Optional) update once (or each time)
        this.triggerCirclesFlag = !this.triggerCirclesFlag;
        
        if (this.clickMode == 3){ this.circlesRef = [mouseX, mouseY]; }
        }
    }
    rPout(val, n=2){ return round(val, n).toLocaleString(undefined,{ minimumFractionDigits:n}); }
    triggerCircles(logElement, logElement2=undefined){
    
    if (this.triggerCirclesFlag){
    if (this.clickMode == 3) { 
        let mx = this.circlesRef[0], my = this.circlesRef[1]; // :[ it's the way i set it up that's the problem
        logElement.innerHTML = this.rPout(mx, 2)+" "+this.rPout(my, 2);
        stroke('#FFFF00AA'); strokeWeight(15); circle(mx, my, 10);
        let refX = Math.floor(mx); // /this.resolution 
            refY = Math.floor(my); 
        // let val = this.pixelArray[refY][refX];
        let val = this.pixelArray[this.nearestFunc(refY/this.resolution)][this.nearestFunc(refX/this.resolution)];
        let RGB = this.colorFunc(val);
        let HSV = rgb_to_hsv(this.colorFunc(val));
        logElement2.innerHTML = `${this.rPout(val)}
            <br/>RGB: ${this.rPout(RGB[0], 1)} ${this.rPout(RGB[1], 1)} ${this.rPout(RGB[2], 1)}
            <br/>HSV: ${this.rPout(HSV[0],0)} ${this.rPout(HSV[1])} ${this.rPout(HSV[2])}
            <br/>Ref: ${this.rPout(refX)} ${this.rPout(refY)}
            <br/><div style="color:rgb(${RGB[0]}, ${RGB[1]}, ${RGB[2]})">This color!</div>
            `;
    } else {
        // do next time: % or vector things
        // (Optional) offset w/ current time depending on how you're zooming. (tx & ty)
        var tx = this.xOffset, ty = this.yOffset, f = this.freq;
        var mx = mouseX, my = mouseY;
        logElement.innerHTML = this.rPout(mx, 2)+" "+this.rPout(my, 2);
    if (this.clickMode == 0){
        // get the corresponding refX & refY in the fixedArray :)
        // edit the value to where the new mousePos is at
        var x = round((mx+tx)*f); var y = round((my+ty)*f); // boundary of each point will be a square
        // all target points are integers => we can round point. automatically deals with "the invisible borders"
        if (!this.triggerCirclesOnce) { this.triggerCirclesRef = [x, y]; } // (Optional) update each time
        
        var newX = this.triggerCirclesRef[0]; var newY = this.triggerCirclesRef[1];
        var endX = newX/f - tx; var endY = newY/f - ty;
        stroke('#FF00FFAA'); strokeWeight(15); circle(endX, endY, 10);
        var A = Math.atan((my-endY)/(mx-endX));
        if ((mx-endX) < 0) { A += Math.PI }  // as it doesn't work for the left side :]
        else if ((my-endY) < 0) { A += Math.PI*2 } // i forgot to not allow -ve numbers
        // console.log(A/Math.PI*180)
        var refX = this.posMod(newX, this.REPEAT_[0]); var refY = this.posMod(newY, this.REPEAT_[1]);
        // (Optional) if exactly at (x, y) it becomes black 
        // if ((mouseX == endX) && (mouseY == endY)){ A = 0; }
        try { this.fixedArray[refX][refY] = map(A, 0, Math.PI*2, 0, 1); } // map degrees/radians to 0-1
        catch( error ){ console.log(error); }
        // or set a fixed value
    } else if (this.clickMode == 1){ // Voronoi     speed is not an issue here 😅
        var x = floor((mx+tx)*f); var y = floor((my+ty)*f); // :)
        if (!this.triggerCirclesOnce) { this.triggerCirclesRef = [x, y]; }
        var newX = this.triggerCirclesRef[0]; var newY = this.triggerCirclesRef[1];
        var endX = newX/f - tx; var endY = newY/f - ty;
        stroke('#FF00FFAA'); strokeWeight(15); circle(endX, endY, 10); // bottom
        // stroke('#00FFFFAA'); circle(endX+(0.5/f), endY+(0.5/f), 10);
        strokeWeight(2); line(endX, endY, endX+(0.5/f), endY+(0.5/f))
        // https://www.desmos.com/calculator/ucaxkz2ux9
        var refX = this.posMod(newX, this.REPEAT_[0]); var refY = this.posMod(newY, this.REPEAT_[1]);
        let HX = (mx-endX-.5/f)*f, HY = (my-endY-.5/f)*f;
        var A = Math.atan(HY/HX);
        if (HX < 0) { A += Math.PI }
        else if (HY < 0) { A += Math.PI*2 }
        /* stroke('#00FF00AA'); circle((mx-endX-.5/f) + endX,(my-endY-.5/f) + endY, 10)
        console.log(((mx-endX-.5/f)*f < 0), ((my-endY-.5/f)*f < 0));
        180->270 TT  FT   270 -> 360 console.log(round(A*360));
        90->180  TF  FF   0   -> 90  (clockwise) */
        // 1. figure out the angle
        this.fixedArray[refX][refY] = map(A, 0, Math.PI*2, 0, 1);
        // 2. figure out length from origin
        let d = ((my+ty)*f - newY);
        if (A == 0 || A == 1){ } 
        else{ d = (d - 0.5)/Math.sin(A); // reversing randomcoord()   
            // d = (2*d)**2/2;  // abs version
        }
        // let t = ANGLE_VAL*(Math.PI*2), D = unknown formula;
        // return [D*cos(t)+0.5, D*sin(t)+0.5];
        d = this.WithinCircle? 
            max(min(d, sqrt(.5)), 0) // limit d%1 or this so it doesn't go outside of the circle
            :max(min(d, 1), 0);
        this.fixedLengthArray[refX][refY] = d;
        // let test = this.randomCoord(refX, refY); console.log(round(test[0], 2), round(test[1], 2),       round(d, 2), round(map(A, 0, Math.PI*2, 0, 1), 2));
    } else if (this.clickMode == 2){ // Simplex
        var x =(mx+tx)*f; var y = (my+ty)*f;
        if (!this.triggerCirclesOnce) {  this.triggerCirclesRef = [x, y]; }
        var newX = this.triggerCirclesRef[0]; var newY = this.triggerCirclesRef[1];
        let Ref = this.unskewPoint(newX, newY);
        let s = (newX+newY)*this.F2;
            newX = Math.floor(newX+s), newY = Math.floor(newY+s);

        // is there a faster way? (to find nearest hex)
        let minDist = 8, ci = 0;
        for (let i = 0; i<this.simplexGridPoints.length; i++){
            let dist = this.distQ(this.skewPoint(newX+this.simplexGridPoints[i][0], newY+this.simplexGridPoints[i][1]), 
            this.skewPoint(Ref[0], Ref[1]));
            if (dist < minDist){ minDist = dist; ci = i; }
        }
        newX += this.simplexGridPoints[ci][0],
        newY += this.simplexGridPoints[ci][1];
        // newX = this.posMod(newX, this.REPEAT_[0]), newY = this.posMod(newY, this.REPEAT_[1]); 
        let p = this.skewPoint(newX, newY); // did i mix up skew & unskew lol
        let endX = p[0]/f - tx, endY = p[1]/f - ty;
        stroke('#FF00FFAA'); strokeWeight(15); circle(endX, endY, 10);
        
        // Same process as perlin's
        var A = Math.atan((my-endY)/(mx-endX));
        if ((mx-endX) < 0) { A += Math.PI }
        else if ((my-endY) < 0) { A += Math.PI*2 }
        var refX = this.posMod(newX, this.REPEAT_[0]); var refY = this.posMod(newY, this.REPEAT_[1]);
        stroke('#00FFFF'); textSize(25); strokeWeight(1); text(`p ${refX} ${refY}`, 25, 25);
        this.fixedArray[refX][refY] = map(A, 0, Math.PI*2, 0, 1); // map degrees/radians to 0-1
    } else { // 4, Lighting
        let endX = this.staticWidth/2, endY = this.staticHeight/2;
        stroke('#FF00FFAA'); strokeWeight(15); circle(endX, endY, 10); // +screen offset
        var A = Math.atan((my-endY)/(mx-endX));
        if ((mx-endX) < 0) { A += Math.PI }
        else if ((my-endY) < 0) { A += Math.PI*2 } 
        let minWidth = min(endX, endY)*1.5;
        stroke('#00FFFFAA'); strokeWeight(1); noFill(); circle(endX, endY, minWidth); fill(255);
        let dist = Math.sqrt(this.dotHandler([mx-endX, my-endY]))/minWidth*2;
        dist = dist > Math.sqrt(2)? sqrt(2): dist; // limit length
        this.lightingVec = [dist*Math.cos(A), dist*Math.sin(A)];
    }
    stroke('#FFFF00AA'); strokeWeight(15); circle(mx, my, 10);
}}}

    /* completely unnecessary */
    closestPoint(x, y){
        var xCel = Math.floor(x); var refX1 = this.posMod(xCel, this.REPEAT_[0]); 
        var yCel = Math.floor(y); var refY1 = this.posMod(yCel, this.REPEAT_[1]);
        let cellPos = this.randomCoord(refX1, refY1);
        cellPos = [cellPos[0] + xCel, cellPos[1] + yCel];
        return this.dist(cellPos[0], cellPos[1], x, y)//Math.sqrt(2)
    }
    unskewPoint(x, y){ return [(this.F2+1)*x + this.F2*y, this.F2*x + (this.F2+1)*y]; }
    skewPoint(x, y){ return [(-this.G2+1)*x + -this.G2*y, -this.G2*x + (-this.G2+1)*y]; }
    // https://stackoverflow.com/questions/69773073/characters-for-diagonal-lines
    simplexGradient(x, y){ // not a hexagon 🤦‍♀️
        let Ref = this.unskewPoint(x, y);
        let refX1 = Math.floor(Ref[0]), refY1 = Math.floor(Ref[1]); // integer
        let Pos = [Ref[0]-refX1, Ref[1]-refY1];
        // figure out if it's nearer to origin or the next origin
        // let skewMid = this.unskewPoint(1, 1); // .5 is midpoint... dot w/ Pos to give 2*sqrt(3)
        // let distToEdge = this.dot(Pos, skewMid);
        // if (distToEdge > Math.sqrt(3)){ return distToEdge;} else{ return 0; }
        // if i try y < (1-x) will it achieve the same effect?
        // if (Pos[1] > (1-Pos[0])) { return distToEdge; } else return 0; // yes it does!
        let comparePoints = [ [refX1, refY1],
            [refX1, refY1+1]]
        if (Pos[1] > (1-Pos[0])){ comparePoints[0] = [refX1+1, refY1+1]; } // replace first point
        if (Pos[0] > Pos[1]){ comparePoints[1] = [refX1+1, refY1]; } // switch middle point
        let Pos1 = [Ref[0]-comparePoints[0][0], Ref[1]-comparePoints[0][1] ],
            Pos2 = [Ref[0]-comparePoints[1][0], Ref[1]-comparePoints[1][1] ];
        let dist1 = this.dotHandler(Pos1),
            dist2 = this.dotHandler(Pos2);

        // let tgtPos = comparePoints[1]; let whichPos = Pos2;
        // if (dist1 < dist2){ tgtPos = comparePoints[0], whichPos = Pos1 }
        // return this.dot([refX1-tgtPos[0], refY1-tgtPos[1]] , whichPos);
        // let x1= (refX1-tgtPos[0]), y1 = (refY1-tgtPos[1]); if (x1 == 0 && y1 == 0)     { return 1; } // origin

        let returnVal = 0;
        if (dist1 < dist2){ // return dist1
            returnVal = this.dot(Pos1, this.randomVector(
                    this.posMod(comparePoints[0][0], this.REPEAT_[0]), 
                    this.posMod(comparePoints[0][1], this.REPEAT_[1])));
        } else {  returnVal = this.dot(Pos2, this.randomVector(
                    this.posMod(comparePoints[1][0], this.REPEAT_[0]), 
                    this.posMod(comparePoints[1][1], this.REPEAT_[1]))); }
        // return this.dotHandler(Pos1)
        return this.perlinNormalizer(returnVal);
    }
    /*                 (0, 1)      /
              (-1, 1)      /     \    /
                          /       \  /
                         /       (1, 0)
                      (0, 0)----‾‾‾‾/
        (-1, 0)          \         /
                          \       /
                            (1, -1)
               (0, -1)
    */
    simplexGridPoints = [[0, 0], [0, 1], [1, 1], [1, 0]];
    simplexGradientHex(x, y){  
        let Ref = this.unskewPoint(x, y);
        // we have four points possible points. figure out which point is the reference point
        let refX1 = Math.floor(Ref[0]), refY1 = Math.floor(Ref[1]); // integer
        // if ((refX1 != 2) || (refY1 !=2)) return -1;
        let minDist = 8, ci = 0;
        for (let i = 0; i<this.simplexGridPoints.length; i++){
            // let Pos = [Ref[0]-refX1+this.simplexGridPoints[i][0], Ref[1]-refY1+this.simplexGridPoints[i][1]]; // position relative to ref (0, 0)
            // let dist = this.dotHandler(Pos); // nope
            let dist = this.distQ(this.skewPoint(refX1+this.simplexGridPoints[i][0], refY1+this.simplexGridPoints[i][1]), 
            this.skewPoint(Ref[0], Ref[1])); // wow what a dummy
            if (dist < minDist){ minDist = dist; ci = i; }
        }
        // return minDist;
        let Pos = [Ref[0]-refX1 - this.simplexGridPoints[ci][0], Ref[1]-refY1 - this.simplexGridPoints[ci][1]];

        let g = this.randomVector(
                    this.posMod(refX1 + this.simplexGridPoints[ci][0], this.REPEAT_[0]), 
                    this.posMod(refY1 + this.simplexGridPoints[ci][1], this.REPEAT_[1]));
        // let returnVal = this.dot(this.skewPoint(Pos[0], Pos[1]), this.skewPoint(g[0], g[1]));
        let returnVal = this.dot(this.skewPoint(Pos[0], Pos[1]), g); // the gradient was too diagonal 😡
        // there's probably a faster method somewhere BUT THIS IS TAKING ME TOO LONG!!!
        // idk the range 😋
        return this.remap(returnVal, -0.47, 0.47, 0, 1); // 0.47
    }


    showGradientBoxes(x, y){
        var refX1 = Math.round(x); var xDif = x-refX1;
        var refY1 = Math.round(y); var yDif = y-refY1; // it hits a 256 somehow, likely because of round
        var cNearest = this.distFunc2(this.randomVector(this.fit(refX1, this.REPEAT_[0]), this.fit(refY1, this.REPEAT_[1])), [xDif  ,yDif  ]); 
        return this.perlinNormalizer(cNearest); // WOW THAT'S ALL I HAVE TO CHANGE, ARE YOU KIDDING ME
    }
    averageGradientBoxes(x, y){
        var refX1 = Math.floor(x); var xDif = x-refX1; var refX2 = refX1+1; refX2 = refX2 == this.REPEAT_[0]? 0: refX2; // "fit" upper bound
        var refY1 = Math.floor(y); var yDif = y-refY1; var refY2 = refY1+1; refY2 = refY2 == this.REPEAT_[1]? 0: refY2;
        var c00 = this.distFunc2(this.randomVector(refX1, refY1), [xDif  ,yDif  ]); // dot
        var c10 = this.distFunc2(this.randomVector(refX2, refY1), [xDif-1,yDif  ]);
        var c01 = this.distFunc2(this.randomVector(refX1, refY2), [xDif  ,yDif-1]);
        var c11 = this.distFunc2(this.randomVector(refX2, refY2), [xDif-1,yDif-1]);

        c00 = this.perlinNormalizer(c00);
        c10 = this.perlinNormalizer(c10);
        c01 = this.perlinNormalizer(c01);
        c11 = this.perlinNormalizer(c11);
        return (c00+c10+c01+c11)/4; 
    }

    // Note: when I set the pixels, it loops back around so it looks like it got errors on the left. :I
    projLine(v1x, v1y, v2x, v2y, px, py){ /* confirmed https://www.sunshine2k.de/coding/java/PointOnLine/PointOnLine.html */
        var e1x = v2x - v1x; var e1y = v2y - v1y; var e2x = px - v1x; var e2y = py - v1y;
        var val = this.dot([e1x, e1y], [e2x, e2y]); var len2 = e1x * e1x + e1y * e1y;
        var p = [ (v1x + (val*e1x) / len2), (v1y + (val*e1y) / len2) ]
        return p; }
    GradientBoxCalc(x, y, xOff, yOff, f, blendFunc, blendX=0, blendY=0){
        var centerXS = blendFunc((x+xOff)*f) + blendX; var centerYS = blendFunc((y+yOff)*f) + blendY; /* center scaled */
        var centerX = Math.floor(centerXS/f - xOff); var centerY = Math.floor(centerYS/f - yOff); /* 1. Center Point */
        var refX1 = this.posMod(centerXS, this.REPEAT_[0]); var refY1 = this.posMod(centerYS, this.REPEAT_[1]);
        var v = this.randomVector(refX1, refY1); var xv = v[0]; var yv = v[1];
        var endX = Math.ceil(centerX + xv/f); var endY = Math.ceil(centerY + yv/f); /* 2. End Point */
        /* Project point to line. (dot product)
        Assume circle end value 1 and given 0.5 is center normalized to (0,0), find value: End-Proj distance */
        var proj = this.projLine(0, 0, (endX-centerX)*f, (endY-centerY)*f, (x-centerX)*f, (y-centerY)*f); /* 3. Projected line */
        var val =  this.dist((endX-centerX)*f, (endY-centerY)*f, proj[0], proj[1]);
        return {centerX, centerY, endX, endY, proj, val};
    }

    // jittery and baaaad
    // showGradientBoxes(newX, newY, x,y){ // non-smooth shows gradients between points
    //     // for each point's boundary, display its gradient.        
    //     var {centerX, centerY, endX, endY, proj, val} = this.GradientBoxCalc(x, y, this.xOffset/this.resolution, this.yOffset/this.resolution, this.f, round);
    //     val *= .5; // .5 to see clearly
    //     return 1-val;
    //     /* 4. gradient (it's reversed though.) */
    // }

    // this one fade outside of the box, huh
    // Vpairs = [[0, 0], [1, 0], [0, 1], [1, 1]]; /* lazy do for each: refX1, refX2, refY1, refY2 */
    // averageGradientBoxes(newX, newY, x, y){
    //     var total = 0 ;
    //     for (let i = 0; i < this.Vpairs.length; i++){
    //         var {centerX, centerY, endX, endY, proj, val} = this.GradientBoxCalc(x, y, this.xOffset/this.resolution, this.yOffset/this.resolution, this.f, floor, this.Vpairs[i][0], this.Vpairs[i][1]);
    //     total += val; } total /=4 * 2; /* *2 to see better */ 
    //     return 1-total;
    // }
    showGradientBoxDetails(){ /* performance will tank */
        var f = this.freq ///this.resolution;
        for (var x = 0; x < (this.staticWidth); x++){
            for (var y = 0; y < (this.staticHeight); y++){  // offset * res
                var {centerX, centerY, endX, endY, proj, val} = this.GradientBoxCalc(x, y, this.xOffset, this.yOffset, f, round); // REPEATED from showGradientBoxes()
                if (f < 0.06){ setPixel(Math.round(proj[0]/f)+centerX,Math.round(proj[1]/f)+centerY, [0,255,0,255]); } /* projected line */
                if (f < 0.06){ setPixel(int(endX), int(endY), [255, 0, 0 ,255]);} /* end point */
                if (f < 0.06){ setPixel(int(centerX), int(centerY), [255,0,255,255]);} /* target center point */
        }}}
}
