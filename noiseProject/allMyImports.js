function setPixel(x, y, rgba){ // taking note of row width
    var base = (x + (width)*(y)) * 4; // each pixel is 4 entries
    pixels[base] = rgba[0];   pixels[base+1] = rgba[1];
    pixels[base+2] = rgba[2]; pixels[base+3] = rgba[3];
}
function readPixel(x, y){
    var base = (x + (width)*(y)) * 4;
    return [pixels[base], pixels[base+1], pixels[base+2], pixels[base+3]];
}
// ========== [NOISE] =============
class GraphNoise{
    constructor(canvasSize){
        this.width = canvasSize[0]; this.height = canvasSize[1];
        this.REPEAT_ = [256, 256];
        this.fixedArray = this.noiseBase2();
        /* dynamic variables */
        this.f = 0.03; this.rotFactor = 0.005;
        this.xOff = 0; this.yOff = 0; this.xt = 0; this.yt = 0;
        this.triggerCirclesFlag = false; this.triggerCirclesOnce = false;
        this.triggerCirclesRef = [null, null];
        this.smooth = true; this.showGradient = true; this.showBoxes = false; this.boxDetails = false;
        
        this.contours = 0; this.N_Directions = 0; this.boxBlend = false;
    }
    /* Functions */
    noiseBase2(seed=undefined, maxX=this.REPEAT_[0], maxY=this.REPEAT_[1]){
        if (seed == undefined){ randomSeed(0); } /* from p5js, no native 🥲 */
        var fixedArray = [];
        for (var y = 0; y < maxY; y++){ fixedArray.push([]);
            for (var x = 0; x < maxX; x++){ fixedArray[y].push(random()) }}
        return fixedArray; }

    remap(val, a, b, c, d) { return (val - a) / (b-a) * (d-c) + c; }
    roundInt(val, mn, mx){ return Math.floor(val * (mx-mn+1) + mn); }
    randomVector(refX, refY){
        var val = this.fixedArray[refX][refY] * 2 * Math.PI;
        /* (Optional) */
        if (this.N_Directions != 0){ val = this.remap(this.roundInt(this.fixedArray[refX][refY], 0, this.N_Directions)/this.N_Directions, 0, 1, 0, 2*Math.PI) }
        return [Math.cos(val), Math.sin(val)]; }
    smoothie(t){ return t * t * t * (t * (t * 6 - 15) + 10)}
    dot(A, B){ return (A[0]*B[0] + A[1]*B[1]); }
    myNoise2D(x, y, smooth=true){  
        var xi = Math.floor(x); var tx = x-xi; var refX1 = xi%this.REPEAT_[0]; var refX2 = refX1+1;
        if (refX2 == this.REPEAT_[0]){ refX2 = 0; }
        var yi = Math.floor(y); var ty = y-yi; var refY1 = yi%this.REPEAT_[1]; var refY2 = refY1+1;
        if (refY2 == this.REPEAT_[1]){ refY2 = 0; }
        var c00 = this.dot(this.randomVector(refX1, refY1), [tx-0,ty-0]);
        var c10 = this.dot(this.randomVector(refX2, refY1), [tx-1,ty-0]);
        var c01 = this.dot(this.randomVector(refX1, refY2), [tx-0,ty-1]);
        var c11 = this.dot(this.randomVector(refX2, refY2), [tx-1,ty-1]);
        if (smooth) { tx = this.smoothie(tx); ty = this.smoothie(ty); }
        var x1 = lerp(c00, c10, tx); var x2 = lerp(c01, c11, tx); var val = lerp(x1, x2, ty);
        return val; }
    generateImage(xOff=0, yOff=0){
        if (this.showBoxes || this.boxBlend) return;
        let f = this.f;
        for (var x = 0; x < this.width; x++){
            for (var y = 0; y < this.height; y++){
                var n = this.myNoise2D((x+xOff)*f, (y+yOff)*f, this.smooth); n = (n+1)*0.5;
                var c = n*255; setPixel(x, y, [c, c, c, 255]);
                // if (y > (1/f)){ break; } // 1/f = target pixels for 1 grid cell
        }}
    }
    /* Extra functions */
    oil(){
        if (this.showBoxes) return; for (var x = 0; x < this.width; x++){ for (var y = 0; y < this.height; y++){
            if (Math.abs(readPixel(x, y)[0] - readPixel(x+1, y+1)[0]) > 0.1 ){  
                setPixel(x, y, [0, 0, 0, 255]);
        }}}}

    activateContours(){ /* somehow I don't think this is correct */
        // if (this.showBoxes || this.boxBlend) return; 
        let contours = int(this.contours); 
        if (contours < 1){ return; } // 1x = 0.5, 2x = 0.33, 0.66, 3x = 0.25, 0.5, 0.75
        // possible: check if surrounding pixels difference too high. calculate gradient?
        let allowance = 1; let black = [0, 0, 0, 255];
        for (var x = 0; x < this.width; x++){
        for (var y = 0; y < this.height; y++){
            var targetPixel = readPixel(x, y)[0];
            for (let i = 0; i < contours; i++){
                var tgt = ((i+1)/(contours+1))*255;
                if ((targetPixel == Math.round(tgt)) ||
                    (targetPixel == Math.round(tgt+allowance)) || 
                    (targetPixel == Math.round(tgt-allowance))){
                    setPixel(x, y, black); break; 
                }} 
        }}
    }
    basicallyEqual(a, b){ return Math.abs(a-b) < this.f*0.9999; } /* can't do fixed value because of f=0.03 */
    showGradients(xOff=0, yOff=0){
        if (!this.showGradient){return;}
        var f = this.f; if (f > 0.5) { console.log('no gradients 4 u>:('); return;}
        strokeWeight(2); fill(0,0); stroke('#DDDDDD88');
        for (var x = 0; x < (this.width); x++){
            for (var y = 0; y < (this.height); y++){
                var x2 = (x+xOff); var y2 = (y+yOff); // console.log(Math.abs(int(x*f)-x*f));
                /* Every cell that at interval */
                if (this.basicallyEqual(int(x2*f, 2), x2*f) && this.basicallyEqual(int(y2*f, 2), y2*f, 2)){
                    var refX1 = Math.floor(x2*f)%this.REPEAT_[0]; //if (refX1 >= this.REPEAT_[0]){ refX1 = 0; }
                    var refY1 = Math.floor(y2*f)%this.REPEAT_[1];// if (refY1 >= this.REPEAT_[1]){ refY1 = 0; }
                    var l = this.randomVector(refX1, refY1); var xf = l[0]; var yf = l[1];
                    
                    var x1 = Math.floor(x+xf); var y1 = Math.floor(y+yf);
                    // stroke([random()*64+128, random()*5+50, random()*64+128, 128])
                    line(x1, y1, Math.ceil(x+xf/f), Math.ceil(y+yf/f)); circle(x, y, 0.1/f);
                } // if (y >= (1/f)){ break; }
            } // if (x >= (1/f)){ break; }
        }}
    rotateGradients(){ /* it glitches if offset :| */
        var rotFactor = this.rotFactor;
        if ((rotFactor == 0) || (rotFactor%1 == 0)) {return} /* no change */
        for (var x = 0; x < (this.fixedArray.length); x++){
            for (var y = 0; y < (this.fixedArray[x].length); y++){
                var newVal = this.fixedArray[x][y];
                newVal += rotFactor; if (newVal > 1){ newVal = 0; } /* loop back to 0 */
                this.fixedArray[x][y] = newVal;
            }
    }}
    /* Change specific rotations */
    handlePress(){
        if (mouseX < this.width && mouseY < this.height
            // && (Math.abs(this.xOff) < 5) && (Math.abs(this.yOff) < 5)
        ){
            var tx = this.xt; var ty = this.yt; var f = this.f;
            this.triggerCirclesFlag = !this.triggerCirclesFlag;
            var x = round((mouseX+tx)*f); var y = round((mouseY+ty)*f); 
            this.triggerCirclesRef = [x, y]; // (Optional) update once (or each time) 
        }
    }
    triggerCircles(){
    if (this.triggerCirclesFlag){
        // (Optional) offset w/ current time depending on how you're zooming. (tx & ty)
        var tx = this.xt; var ty = this.yt; var f = this.f; 
        var mx = mouseX; var my = mouseY;
        document.querySelector("#log").innerHTML = mx +" "+my;
        stroke('#FFFF0088'); strokeWeight(15); circle(mx, my, 10);
        // get the corresponding refX & refY in the fixedArray :)
        // edit the value to where the new mousePos is at
        var x = round((mx+tx)*f); var y = round((my+ty)*f); // boundary of each point will be a square
        // all target points are integers => we can round point. automatically deals with "the invisible borders"
        if (!this.triggerCirclesOnce) { this.triggerCirclesRef = [x, y]; } // (Optional) update each time
        var newX = this.triggerCirclesRef[0]; var newY = this.triggerCirclesRef[1];
        var endX = newX/f - tx; var endY = newY/f - ty;
        stroke('#FF00FF88'); circle(endX, endY, 10);

        var A = Math.atan((my-endY)/(mx-endX));
        if ((mx-endX) < 0) { A += Math.PI }  // as it doesn't work for the left side :]
        var refX = newX%this.REPEAT_[0]; var refY = newY%this.REPEAT_[1];

        // (Optional) if exactly at (x, y) it becomes black 
        // if ((mouseX == endX) && (mouseY == endY)){ A = 0; }
        this.fixedArray[refX][refY] = map(A, 0, 2*Math.PI, 0, 1); // map degrees/radians to 0-1
        // or set a fixed value
    }}
    changeOffset(){
        this.xt += this.xOff; this.yt += this.yOff;
        if (this.xt < 0){ this.xt = 0; } if (this.yt < 0){ this.yt = 0; }
    }
    // Note: when I set the pixels, it loops back around so it looks like it got errors on the left. :I
    dist(A, B, C, D){ return Math.sqrt((C-A)**2 + (D-B)**2); }
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
        if (!this.showBoxes || this.boxBlend) { return; }
        // for each point's boundary, display its gradient.
        var xOff = this.xt; var yOff = this.yt; var f = this.f; 
        for (var x = 0; x < (this.width); x++){
            for (var y = 0; y < (this.height); y++){
            var {centerX, centerY, endX, endY, proj, val} = this.GradientBoxCalc(x, y, xOff, yOff, f, round);
            // if (centerX == 33 && centerY == 33){}  else{ continue; }
            val *= .5; // .5 to see clearly
            var c = (1-val)*255; setPixel(x, y, [c,c,c, 255]); /* 4. gradient (it's reversed though.) */
    }}}
    averageGradientBoxes(){
        if (!this.boxBlend) { return; }
        let Vpairs = [[0, 0], [1, 0], [0, 1], [1, 1]]; /* lazy do for each: refX1, refX2, refY1, refY2 */
        var xOff = this.xt; var yOff = this.yt; var f = this.f; 
        for (var x = 0; x < (this.width); x++){
            for (var y = 0; y < (this.height); y++){     
            var total = 0 ;
            for (let i = 0; i < Vpairs.length; i++){
                var {centerX, centerY, endX, endY, proj, val} = this.GradientBoxCalc(x, y, xOff, yOff, f, floor, Vpairs[i][0], Vpairs[i][1]);
            total += val; } total /=4 * 2; /* *2 to see better */ 
            var c = (1-total)*255; setPixel(x, y, [c,c,c, 255]);
            }}}
    showGradientBoxDetails(){ /* performance will tank */
        if (!this.boxDetails) { return; }
        var xOff = this.xt; var yOff = this.yt; var f = this.f; 
        for (var x = 0; x < (this.width); x++){
            for (var y = 0; y < (this.height); y++){ 
                var {centerX, centerY, endX, endY, proj, val} = this.GradientBoxCalc(x, y, xOff, yOff, f, round); // REPEATED from showGradientBoxes()
                if (f < 0.05){ setPixel(Math.round(proj[0]/f)+centerX,Math.round(proj[1]/f)+centerY, [0,255,0,255]); } /* projected line */
                if (f < 0.05){ setPixel(int(endX), int(endY), [255, 0, 0 ,255]);} /* end point */
                if (f < 0.05){ setPixel(int(centerX), int(centerY), [255,0,255,255]);} /* target center point */
        }}}
}
class GraphNoiseUI{
    constructor(graphNoise){ this.graphNoise = graphNoise; }
    rot(evt, sliderText=null){ 
        var newVal = Math.E**(8*evt.value/1000.0 -7); if (newVal < 0.001) {newVal = 0;}
        this.graphNoise.rotFactor = newVal; sliderText.innerHTML = round(newVal, 5); }
    freq(evt, sliderText=null){ 
        var newVal = Math.E**(8*evt.value/1000.0 -7); if (newVal < 0.001) {newVal = 0;}
        this.graphNoise.f = newVal; sliderText.innerHTML = round(newVal, 5); }
    triggerSetting(evt, key){ 
        this.graphNoise[key] = !this.graphNoise[key];
        if (this.graphNoise[key]){ evt.innerHTML = "On"; }
        else { evt.innerHTML = "Off"; }}
    resetVar(){ this.graphNoise.fixedArray = this.graphNoise.noiseBase2();
        this.graphNoise.xt = 0;this.graphNoise.yt = 0; }
    move(evt, sliderText, isY=false){
        var newVal = Math.E**(8*Math.abs(evt.value)/1000.0 -7); if (evt.value < 0) {newVal = -newVal;}
        if (isY){ this.graphNoise.yOff = newVal; sliderText.innerHTML = round(this.graphNoise.yOff, 3); return; }
        this.graphNoise.xOff = newVal; sliderText.innerHTML = round(this.graphNoise.xOff, 3);
    }
    setVal(evt, sliderText, key){ this.graphNoise[key] = evt.value; sliderText.innerHTML = this.graphNoise[key]; }
}
