function setPixel(x, y, rgba){ // taking note of row width
    var base = (x + (width)*(y)) * 4; // each pixel is 4 entries
    pixels[base] = rgba[0];   pixels[base+1] = rgba[1];
    pixels[base+2] = rgba[2]; pixels[base+3] = rgba[3];
}
// ========== [NOISE] =============
class GraphNoise{
    constructor(canvasSize){
        this.width = canvasSize[0]; this.height = canvasSize[1];
        this.REPEAT_ = [256, 256];
        this.fixedArray = this.noiseBase2();
        /* dynamic variables */
        this.f = 0.05; this.rotFactor = 0.005;
        this.xOff = 0; this.yOff = 0; this.xt = 0; this.yt = 0;
        this.triggerCirclesFlag = false; this.triggerCirclesOnce = false;
        this.triggerCirclesRef = [null, null];
        this.smooth = true; this.showGradient = true;
    }
    /* Functions */
    noiseBase2(seed=undefined, maxX=this.REPEAT_[0], maxY=this.REPEAT_[1]){
        if (seed == undefined){ randomSeed(0); } /* from p5js, no native 🥲 */
        var fixedArray = [];
        for (var y = 0; y < maxY; y++){ fixedArray.push([]);
            for (var x = 0; x < maxX; x++){ fixedArray[y].push(random()) }}
        return fixedArray; }
    randomVector(refX, refY){
        var val = this.fixedArray[refX][refY] * 2 * Math.PI;
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
    generateImage(xOff=0, yOff=0){ let f = this.f;
        for (var x = 0; x < this.width; x++){
            for (var y = 0; y < this.height; y++){
                var n = this.myNoise2D((x+xOff)*f, (y+yOff)*f, this.smooth); n = (n+1)*0.5;
                var c = n*255; setPixel(x, y, [c, c, c, 255]);
                // if (y > (1/f)){ break; } // 1/f = target pixels for 1 grid cell
        }}}
    /* Extra functions */
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
        this.fixedArray[refX][refY] = map(A, 0, 2*Math.PI, 0, 1); // map degrees/radians to 0-1
        // or set a fixed value
    }}
    changeOffset(){
        this.xt += this.xOff; this.yt += this.yOff;
        if (this.xt < 0){ this.xt = 0; } if (this.yt < 0){ this.yt = 0; }
    }
    showGradientBoxes(){
            // TBA 
        }
}

class GraphNoiseUI{
    constructor(graphNoise){ this.graphNoise = graphNoise; }
    rot(evt, sliderText=null){ 
        var newVal = Math.E**(8*evt.value/1000.0 -7); if (newVal < 0.001) {newVal = 0;}
        this.graphNoise.rotFactor = newVal; sliderText.innerHTML = round(newVal, 5); }
    freq(evt, sliderText=null){ 
        var newVal = Math.E**(8*evt.value/1000.0 -7); if (newVal < 0.001) {newVal = 0;}
        this.graphNoise.f = newVal; sliderText.innerHTML = round(newVal, 5); }
    triggerSmooth(evt){
        this.graphNoise.smooth = !this.graphNoise.smooth;
        if (this.graphNoise.smooth){ evt.innerHTML = "On"; }
        else { evt.innerHTML = "Off"; }}
    triggerGradients(evt){
        this.graphNoise.showGradient = !this.graphNoise.showGradient;
        if (this.graphNoise.showGradient){ evt.innerHTML = "On"; }
        else { evt.innerHTML = "Off"; }}
    triggerHook(evt){
        this.graphNoise.triggerCirclesOnce = !this.graphNoise.triggerCirclesOnce;
        if (this.graphNoise.triggerCirclesOnce){ evt.innerHTML = "On"; }
        else { evt.innerHTML = "Off"; }}
    resetVar(){ this.graphNoise.fixedArray = this.graphNoise.noiseBase2();
        this.graphNoise.xt = 0;this.graphNoise.yt = 0; }
    move(evt, sliderText, isY=false){
        var newVal = Math.E**(8*Math.abs(evt.value)/1000.0 -7); if (evt.value < 0) {newVal = -newVal;}
        if (isY){ this.graphNoise.yOff = newVal; sliderText.innerHTML = round(this.graphNoise.yOff, 5); return; }
        this.graphNoise.xOff = newVal; sliderText.innerHTML = round(this.graphNoise.xOff, 5);
    }}
