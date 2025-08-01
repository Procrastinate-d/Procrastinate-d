function setPixel(x, y, rgba){ // taking note of row width
    var base = (x + (width)*(y)) * 4; // each pixel is 4 entries
    pixels[base] = rgba[0];   pixels[base+1] = rgba[1];
    pixels[base+2] = rgba[2]; pixels[base+3] = rgba[3];
}

function posMod(x, p){ return x - floor(x/p)*p; } // P1c: value noise (tiling)

class NoiseProgramManager {
    constructor(canvasSize){
        this.width = canvasSize[0]; this.height = canvasSize[1];
        // P0: store values in fixed array
        this.REPEAT = [256, 256]; // please don't dynamically change it to be bigger :)
        this.fixedArray = this.noiseBase2(this.SEED);
        this.fixedLengthArray = this.noiseBase2(this.SEED+1);
        this.freq = 0.05; // P1: frequency 
        
    }
    // P0: fixed array
    noiseBase2(seed=undefined, maxX=this.REPEAT[0], maxY=this.REPEAT[1]){
        if (seed == undefined){ randomSeed(0); } /* from p5js, no native 🥲 */
        else { randomSeed(seed); }

        var fixedArray = []; // 2d array, can use 1d if you want
        for (var x = 0; x < maxX; x++){ fixedArray.push([]);
             for (var y = 0; y < maxY; y++){ fixedArray[x].push(random()) }}
        return fixedArray; }

    // P0: convert to color
    noiseFunc = this.FBM.bind(this);

    diffScaled = 0.01;
    lightingVec = [1.0, 1.0];
    loadImage(){
        // let fx, fy, n2, n3, n4;
        for (var y = 0; y < 256; y++){
            for (var x = 0; x < 256; x++){ 
                var n = this.noiseFunc(posMod(x*this.freq, this.REPEAT[0]), posMod(y*this.freq, this.REPEAT[1])); // P1: tiling
                // P6d: lighting
                // fx = x*this.freq;
                // fy = y*this.freq;

                // n  = this.noiseFunc(posMod(fx+this.diffScaled, this.REPEAT[0]), posMod(fy, this.REPEAT[1]));
                // n2 = this.noiseFunc(posMod(fx-this.diffScaled, this.REPEAT[0]), posMod(fy, this.REPEAT[1]));
                // n3 = this.noiseFunc(posMod(fx, this.REPEAT[0]), posMod(fy+this.diffScaled, this.REPEAT[1]));
                // n4 = this.noiseFunc(posMod(fx, this.REPEAT[0]), posMod(fy-this.diffScaled, this.REPEAT[1]));
                // n = max(0, this.dot([n-n2, n3-n4], this.lightingVec) + this.diffScaled)*100; // dot normal w/ [1, 1, 1]?
                
                // n = this.marble(n, x);
                let color = [n*255, n*255, n*255, 255];
                setPixel(x, y, color);
            }}
    }
    // P5: FBM
    lacunarity = 2;
    gain = 1/this.lacunarity;
    layers = 2;
    FBM(x, y){
        let divider = 0; 
        for (let l=0; l<this.layers; l++){ divider += this.gain**l } // normalizer

        let n = 0, amplitude = 1, frequencyX = x; var frequencyY = y; // start w/ amplitude = 1 to avoid re-calculating rate**(layer-1) 
        for (let l=0; l<this.layers; l++){
            n +=
                // this.marble( 
                this.perlinNoise(posMod(frequencyX, this.REPEAT[0]), posMod(frequencyY, this.REPEAT[1])) 
                // , x)
                * amplitude;    
            amplitude *= this.gain; 
            frequencyX *= this.lacunarity; frequencyY *= this.lacunarity;
            
        }
        n = (divider != 1.)? n /= divider: n;
        return n;
    }
    
    // P6a: turbulence
    turbulence(n){ return Math.abs(n*2-1); }
    // P6b: marble
    marbles = 100
    marble(n, x=0){ return (Math.sin(((x)+100*n) * (1/this.marbles) * Math.PI*2) + 1) / 2; }
    // P6c: domain warping
    dmwStrength = 4;
    DMW(fx, fy, x, y){
        let n1, n2, n;
        n1 = this.FBM(fx    , fy    , x, y); // mix & match         
        n2 = this.FBM(fx+5.2, fy+1.3, x, y); 
        n  = this.FBM(n1*this.dmwStrength, n2*this.dmwStrength, x, y);   
        return n;
    }

    // ============================================================
    // P4: simplex noise
    F2 = 0.5*(Math.sqrt(3)-1); //  0.36602540378 
    G2 = (3-Math.sqrt(3))/6; // 0.2113248654 
    staticSimplexOffset = -(3**-.5); //-1+2*this.G2 = -0.5773502691896257 which a google search reveals is -tan(30) or -1/sqrt(3)
    staticFalloff = 2/3;
    staticFalloffOrig = 0.5;
    simplexNoise(x, y){
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
        // return this.fixedArray[this.fit(i, this.REPEAT[0])][this.fit(j, this.REPEAT[1])]; // see grid
        let t = (i+j)*-this.G2; // unskew
        let X0 = i+t,   Y0 = j+t;
        let x0 = x-X0,  y0 = y-Y0; // return this.dotHandler([x0, y0]); // distance from cell origin (0, 0)
        
        // [1] Determine if upper or lower triangle through the halfway point. Diagonal seperation by y=x (but the square is skewed)
        let i1, j1; // basically a bool
        if (x0 > y0){ i1 = 1; j1 = 0; } // lower: (0,0)->(1,0)->(1,1)
        else { i1 = 0; j1 = 1;}         // upper: (0,0)->(0,1)->(1,1)
                
        // [2] Distance to vertex points
        let x1 = x0-i1 + this.G2,              // middle (depends on upper/lower tri)
            y1 = y0-j1 + this.G2; 
        let x2 = x0+this.staticSimplexOffset,  // opposite. offset unskewPoint(1, 1) 
            y2 = y0+this.staticSimplexOffset;
        
        let ii = posMod(i, this.REPEAT[0]), jj = posMod(j, this.REPEAT[1]); // is there an easier way to loop it back around?
        let g0 = this.randomVector(ii, jj);                                                // gradients of origin corner (0,0)
        let g1 = this.randomVector(this.fit(ii+i1, this.REPEAT[0]), this.fit(jj+j1, this.REPEAT[1])); // middle corner (depends on upper/lower tri)
        let g2 = this.randomVector(this.fit(ii+1, this.REPEAT[0]), this.fit(jj+1, this.REPEAT[1]));   // opposite corner (1,1)
        
        // [3] Get noise contribution from each corner.
        // weight = max(0.5 - d^2, 0)^4
        // as d increases, weight decreases.
        // when < 0 then no value is added because you crossed the boundary. (so there are corners where each circle doesn't reach :| )
        let t0 = this.staticFalloffOrig - x0*x0-y0*y0; //x0*x0-y0*y0 vs this.dot([x0, y0]) looks worse 
        let t1 = this.staticFalloffOrig - x1*x1-y1*y1;
        let t2 = this.staticFalloffOrig - x2*x2-y2*y2;
        let n = 0;
        if (t0 > 0){ t0 *= t0; n += t0*t0 * this.dot(g0, [x0, y0]); } // if (t0 < 0) {} else { ... }
        if (t1 > 0){ t1 *= t1; n += t1*t1 * this.dot(g1, [x1, y1]); }
        if (t2 > 0){ t2 *= t2; n += t2*t2 * this.dot(g2, [x2, y2]); }
        // return n*70; // idk where the 70 comes from or how to get it... yet
        return (n*70) *Math.sqrt(0.5)+0.5; // normalize
    }
    // P4b: modified :)
    simplexModifiedNoise(x, y){
        let s = (x+y)*this.F2; let i = Math.floor(x+s), j = Math.floor(y+s);
        let t = (i+j)*-this.G2;
        let X0 = i+t,   Y0 = j+t; 
        let x0 = x-X0,  y0 = y-Y0;
        let i1, j1; 
        if (x0 > y0){ i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1;}
        let x1 = x0-i1 + this.G2, y1 = y0-j1 + this.G2; 
        let x2 = x0+this.staticSimplexOffset, y2 = y0+this.staticSimplexOffset;
        let ii = posMod(i, this.REPEAT[0]), jj = posMod(j, this.REPEAT[1]);
        let g0 = this.randomVector(ii, jj);
        let g1 = this.randomVector(this.fit(ii+i1, this.REPEAT[0]), this.fit(jj+j1, this.REPEAT[1]));
        let g2 = this.randomVector(this.fit(ii+1, this.REPEAT[0]), this.fit(jj+1, this.REPEAT[1]));
        
        let n=0; 
        let t0 = this.staticFalloff - x0*x0-y0*y0; 
        let t1 = this.staticFalloff - x1*x1-y1*y1;
        let t2 = this.staticFalloff - x2*x2-y2*y2;        
        t0 *= 1.5, t1 *= 1.5, t2 *= 1.5; //then n *2.5 but i like the hex it produces :)
        t2 = this.smoothie(t2);
        t1 = this.smoothie(t1);
        t0 = this.smoothie(t0);

        if (t0 > 0){ t0 *= t0; n += t0*t0*this.dot(g0, [x0, y0]); } // if t0 == 0 then there's no need to add anything right? :)
        if (t1 > 0){ t1 *= t1; n += t1*t1*this.dot(g1, [x1, y1]); }
        if (t2 > 0){ t2 *= t2; n += t2*t2*this.dot(g2, [x2, y2]); }
        n *= 5*sqrt(.5);
        return n *Math.sqrt(0.5)+0.5; 
    }

    // P2: voronoi noise
    // P2e: distance measures
    manhattan(A, B){ return Math.abs(B[0]-A[0]) + Math.abs(B[1]-A[1]); }
    chebyshev(A, B){ return Math.max(Math.abs(B[0]-A[0]), Math.abs(B[1]-A[1])); }
    minkowski(A, B, h=float(this.minkowskiFactor)){ return ((B[0]-A[0])**h + (B[1]-A[1])**h)**(1/h); } // -ves should be illegal, no? odd powers don't work either
    
    WithinCircle = true;
    sqrtH = Math.sqrt(.5);
    distQ(A, B){ return Math.sqrt((B[0]-A[0])**2 + (B[1]-A[1])**2); }
    randomCoord(refX, refY){
        let t = this.fixedArray[refX][refY]*Math.PI*2
        let D = this.fixedLengthArray[refX][refY];
        D = this.WithinCircle? D*this.sqrtH: D;
        let newX = D*Math.cos(t)+0.5, newY = D*Math.sin(t)+0.5;
        // return [newX, newY]; 
        // return [max(min(newX, 1), 0), max(min(newY, 1), 0)]; // limit it so you don't get 12 cells in one.
                                                                // this is so slow omg
        return [(newX > 1 ? 1: newX) < 0 ? 0: newX,
            (newY > 1 ? 1: newY) < 0 ? 0: newY];
    }
    gridPoints = [[-1, -1], [0, -1], [1, -1], 
                            [-1, 0], [0, 0], [1, 0],
                            [-1, 1], [0, 1], [1, 1]];
    fit(val, REPEAT=1){                   // keep within bounds
        return val >= REPEAT ? val-REPEAT // if (val >= REPEAT){ return val-REPEAT; }
                    : val < 0? REPEAT+val // else if (val < 0){ return REPEAT+val; } 
                    : val;                // return val;
    }
    dotSelf(A){ return (A[0]*A[0] + A[1]*A[1]); }
    voronoiNoise(x, y){
        const refX1 = Math.floor(x), xDif = x-refX1; 
        const refY1 = Math.floor(y), yDif = y-refY1; 
        // [1] Distance to point in same cell (radial gradient)
        // let cellPos = this.randomCoord(refX1, refY1);
        // return this.distQ([cellPos[0], cellPos[1]], [xDif, yDif])///Math.sqrt(2)
        // return this.dotSelf([cellPos[0]-xDif, cellPos[1]-yDif])**.5

        // [2] Distance to Nth nearest point
        var cellPos, n, minDistance = 4;        
        for (let i=0; i<this.gridPoints.length; i++){
            // let offset = this.gridPoints[i];
            cellPos = this.randomCoord(this.fit(refX1+this.gridPoints[i][0], this.REPEAT[0]), this.fit(refY1+this.gridPoints[i][1], this.REPEAT[1]));
            cellPos = [cellPos[0] + this.gridPoints[i][0] - xDif, cellPos[1] + this.gridPoints[i][1] - yDif ]; // + offset for position relative to center cell at (RefX, RefY) 
            n = this.dot(cellPos, cellPos);
            // n = this.manhattan([0, 0], cellPos); // may not be correct lol
            // n = this.chebyshev([0, 0], cellPos);
            // n = this.minkowski([0, 0], cellPos, 4); // floats are bad. 1 is bad. odd numbers are bad.
            minDistance = minDistance < n? minDistance:n; //  min(minDistance, n)
            // lag central
            // cellPos = [cellPos[0] + offset[0] , cellPos[1] + offset[1] ];
            // var n = dist(cellPos[0], cellPos[1], xDif, yDif)/Math.sqrt(2);
            // if (n < minDistance){ minDistance = n; }
        };
        // return this.smoothie(Math.sqrt(minDistance));
        return Math.sqrt(minDistance)
        // [3] Distance to nearest border
        // for (let i=0; i<this.gridPoints.length; i++){ ... }        
    }
    // P2b: flat
    flatvoronoiNoise(x, y){
        const refX1 = Math.floor(x), xDif = x-refX1; 
        const refY1 = Math.floor(y), yDif = y-refY1; 
        // [2] Distance to Nth nearest point
        var cellPos, n, minDistance = 4;
        var minCellVal = 0;        
        for (let i=0; i<this.gridPoints.length; i++){
            cellPos = this.randomCoord(this.fit(refX1+this.gridPoints[i][0], this.REPEAT[0]), this.fit(refY1+this.gridPoints[i][1], this.REPEAT[1]));
            cellPos = [cellPos[0] + this.gridPoints[i][0] - xDif, cellPos[1] + this.gridPoints[i][1] - yDif ]; // + offset for position relative to center cell at (RefX, RefY) 
            n = this.dot(cellPos, cellPos);
            // change
            minCellVal = minDistance < n? minCellVal:this.fixedLengthArray[this.fit(refX1+this.gridPoints[i][0], this.REPEAT[0])]
                                                                            [this.fit(refY1+this.gridPoints[i][1], this.REPEAT[1])];
            minDistance = minDistance < n? minDistance:n;
        };
        return minCellVal;
    }
    // P2c: border
    bordervoronoiNoise(x,y){
        const refX1 = Math.floor(x), xDif = x-refX1; 
        const refY1 = Math.floor(y), yDif = y-refY1; 
        let cellPos = []; // the 9 looped calculations stored in array.
        let minCell = -1, n, fitted, minDistance = 4; // minCell is index. n temporary
        var toCenter, cellDiff, edgeDist, minEdgeDistance=10;
        for (let i=0; i<this.gridPoints.length; i++){
            fitted = [this.fit(refX1+this.gridPoints[i][0], this.REPEAT[0]), this.fit(refY1+this.gridPoints[i][1], this.REPEAT[1])];
            cellPos.push(this.randomCoord(fitted[0], fitted[1]));
            cellPos[i] = [cellPos[i][0] + this.gridPoints[i][0] - xDif, cellPos[i][1] + this.gridPoints[i][1] - yDif ];
            n = this.dot(cellPos[i], cellPos[i]);
            // change
            minCell = minDistance < n? minCell:i;
            minDistance = minDistance < n? minDistance:n;
        }
        
        // [3] Distance to nearest border
        for (let i=0; i<this.gridPoints.length; i++){
            if (minCell == i){ continue; } // skip. excluding closest cell
            // toCenter = [(cellPos[i][0]+cellPos[minCell][0])*.5, // center of closest feature and current feature
            //             (cellPos[i][1]+cellPos[minCell][1])*.5];
            toCenter = [(cellPos[i][0]+cellPos[minCell][0]),   // do you really need to /2? i guess to avoid the flat surfaces.
                        (cellPos[i][1]+cellPos[minCell][1])];
            cellDiff = [cellPos[i][0]-cellPos[minCell][0],  // feature - closest feature
                        cellPos[i][1]-cellPos[minCell][1] ];
            edgeDist = this.dot(toCenter, cellDiff)
            cellPos.push(this.randomCoord(fitted[0], fitted[1]));
            minEdgeDistance = minEdgeDistance < edgeDist? minEdgeDistance : edgeDist
        }
        minEdgeDistance *= .5;
        return minEdgeDistance; 
    }
    // P2d: f2
    F2voronoiNoise(x, y){ // Extremly slow
        const refX1 = Math.floor(x), xDif = x-refX1; 
        const refY1 = Math.floor(y), yDif = y-refY1; 
        var minDistances = [], cellPos, n;
        for (let i=0; i<this.gridPoints.length; i++){
            cellPos = this.randomCoord(this.fit(refX1+this.gridPoints[i][0], this.REPEAT[0]), this.fit(refY1+this.gridPoints[i][1], this.REPEAT[1])); // fitted
            cellPos = [cellPos[0] + this.gridPoints[i][0] - xDif, cellPos[1] + this.gridPoints[i][1] - yDif ];
            n = this.dotSelf(cellPos);
            minDistances.push(n);
        }
        let firstMin = min(minDistances);
        let firstMinID = minDistances.indexOf(firstMin);  // ouch
        
        // let secMinID = minDistances.indexOf(min(minDistances.slice(0, firstMinID).concat(minDistances.slice(firstMinID+1)))); // without slicing
        // return this.fixedLengthArray[this.fit(refX1+this.gridPoints[secMinID][0], this.REPEAT[0])] // fitted variable
        //     [this.fit(refY1+this.gridPoints[secMinID][1], this.REPEAT[1])];

        minDistances = minDistances.slice(0, firstMinID).concat(minDistances.slice(firstMinID+1)); // get rid of minimum distance
        // return Math.sqrt(min(minDistances) )/2
        return Math.sqrt((min(minDistances) - firstMin) )/2
    } 

    // P3: perlin noise
    dot(A, B){ return (A[0]*B[0] + A[1]*B[1]); }
    randomVector(refX, refY){
        var val = this.fixedArray[refX][refY] * Math.PI*2;
        return [Math.cos(val), Math.sin(val)]; }
        // return [Math.sqrt(2)*Math.cos(val), Math.sqrt(2)*Math.sin(val)]; } /* for 0.999 range */
    perlinNoise(x, y){  
        // var xCel = Math.floor(x); var xDif = x-xCel; var refX1 = xCel%this.REPEAT_[0]; var refY1 = yCel%this.REPEAT_[1];
        // this.posMod() func keeps it within 0-255 so i got rid of this
        var refX1 = Math.floor(x); var xDif = x-refX1; var refX2 = refX1+1; refX2 = refX2 == this.REPEAT[0]? 0: refX2; // "fit" upper bound
        var refY1 = Math.floor(y); var yDif = y-refY1; var refY2 = refY1+1; refY2 = refY2 == this.REPEAT[1]? 0: refY2;
        var c00 = this.dot(this.randomVector(refX1, refY1), [xDif  ,yDif  ]); // dot
        var c10 = this.dot(this.randomVector(refX2, refY1), [xDif-1,yDif  ]);
        var c01 = this.dot(this.randomVector(refX1, refY2), [xDif  ,yDif-1]);
        var c11 = this.dot(this.randomVector(refX2, refY2), [xDif-1,yDif-1]);        
        xDif = this.smoothie(xDif); yDif = this.smoothie(yDif);
        var x1 = lerp(c00, c10, xDif); var x2 = lerp(c01, c11, xDif); var val = lerp(x1, x2, yDif);
        
        return val *Math.sqrt(0.5)+0.5; 
    }

    // P1: value noise
    smoothie(t){ return t * t * t * (t * (t * 6 - 15) + 10)}
    valueNoise(x, y){
        var refX1 = Math.floor(x); var xDif = x-refX1; var refX2 = refX1+1; refX2 = refX2 == this.REPEAT[0]? 0: refX2; // this is for tiling btw
        var refY1 = Math.floor(y); var yDif = y-refY1; var refY2 = refY1+1; refY2 = refY2 == this.REPEAT[1]? 0: refY2;
        var c00 = this.fixedArray[refX1][refY1];
        var c10 = this.fixedArray[refX2][refY1];
        var c01 = this.fixedArray[refX1][refY2];
        var c11 = this.fixedArray[refX2][refY2];
        xDif = this.smoothie(xDif); yDif = this.smoothie(yDif); // smoothing function
        var x1 = lerp(c00, c10, xDif); var x2 = lerp(c01, c11, xDif); var val = lerp(x1, x2, yDif); // bilinear interpolation
        return val
    }

    // P0: "white noise"
    whiteNoise(x, y) { return this.fixedArray[floor(x)][floor(y)]; }
}
