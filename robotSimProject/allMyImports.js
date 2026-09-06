function setPixel(x, y, rgba){ // taking note of row width
    var base = (x + (width)*(y)) * 4; // each pixel is 4 entries
    pixels[base] = rgba[0];   pixels[base+1] = rgba[1];
    pixels[base+2] = rgba[2]; pixels[base+3] = rgba[3];
}
function readPixel(x, y){
    var base = (x + (width)*(y)) * 4;
    return [pixels[base], pixels[base+1], pixels[base+2], pixels[base+3]];
}
function posMod(x, p){ return x - floor(x/p)*p; }
function randomBetween(min, max){
    return floor(random() * (max - min + 1) + min);
}

class RobotControlManager{
 
    // ✅ = edit freely   ⚠️ = edit cautiously
    constructor(canvasSize, size=[10,20], loc=[0,0]){ // don't use "self"
        this.canvasSize = canvasSize;
        
        this.size = size;
        this.loc = loc;                // ⚠️
        this.keys_on = false;
        this.keys_pressed = [[], []];
        this.keys_to_remove = [[], []];
        this.keys_add_to = 0;
        this.scale = [2, -2];           // ⚠️ 
        this.follow_toggle = true;      // ✅
        this.search_lim = 100;          // ✅
        this.scan_angle = 30;           // ⚠️
        this.orig_color = [255, 0, 0];  // ✅
        this.color = [255, 0, 0];       // ✅

        this.approx_size = 25;          // ⚠️
        this.hit_size = 30;             // ⚠️ effective radius for practical purposes, won't let you travel
        this.out_el = null;

        this.goal = [NaN, NaN];
        this.reached_goal = false;
        this.playing = false;
        this.heading = 0;                // ⚠️
        this.startTimes = {};
        this.domElementHack = null;
        // this.myLayer = createGraphics(...canvasSize);
        this.scanDrawBuffer = []; // placeholder version
        this.speed = 4;                  // ✅
        this.algo_speed_boost = 8;       // ✅
        this.TIMER = 0.05;                // ✅
        this.TIMER_RAY = 0.01;           // ✅
        

        
        this.default_outText = `
Settings:
    wasd to move, qe to rotate
    mouse over + x to spawn obstacles
    r to reset pos & rotation
    p to play program in goalAlgo();
    collisions do not exsit

    other settings edit in console. ex: rb.scan_angle = 60; rb.follow_toggle = false; (rectangle rotation buggy)
`;
        this.outText = this.default_outText;  // system could be more dynamic but who cares right now!
    }
    follow(){
        if (this.follow_toggle){
        // translate: (0,0) now lives there
        // ok but i need everything to move with the robot
        // so... do this first
        
        // At the start
        // translate(
        //     -this.loc[0]*this.scale[0], 
        //     this.loc[1]*-this.scale[1]); // idk man it just works
        // translate(this.canvasSize[0]/2, this.canvasSize[1]/2); // make it centered
        // scale(...this.scale); 
        
        // p5js transform around a moving and rotating object, centered to the screen
        // i don't fricking understand this and just wasted 8 hours
        
        translate(this.canvasSize[0] / 2, this.canvasSize[1] / 2);
        rotate(this.heading);
        translate(-this.loc[0] * this.scale[0], -this.loc[1] * this.scale[1]);
        scale(...this.scale);

        
    } else { translate(this.canvasSize[0] / 2, this.canvasSize[1] / 2 ); }
}

    draw(){
        fill(...this.color);

        // rotate the rectangle
        // i have no clue how to do this but thank god it now works
        push();
        if (this.follow_toggle){
            resetMatrix();
            translate(this.canvasSize[0] / 2, this.canvasSize[1] / 2 );
            translate(-this.loc[0] * this.scale[0], -this.loc[1] * this.scale[1]);
            scale(this.scale[0], this.scale[1])
            rectMode(CENTER);

            rect(...this.loc, ...this.size);
            
            pop();
        } else {
            // wrong fix later, i'm struggling okay?
            resetMatrix()

            // translate(this.loc[0], this.loc[1]);
            // rotate(this.heading);
            // translate(-this.loc[0]
            //     + canvasSize[0]/2,
            //     - this.loc[1]
            //     + canvasSize[1]/2
            // );

            // translate(canvasSize[0]/2, canvasSize[1]/2);
            // rotate(this.heading);
            // // -54, -10 heading -43
            // // translate(someX, someY)
            // translate(
            //     this.loc[0] * cos(-this.heading) - this.loc[1] * sin(-this.heading), 
            //     this.loc[0] * sin(-this.heading) + this.loc[1] * cos(-this.heading) );
            
            translate(canvasSize[0]/2, canvasSize[1]/2);
            rotate(this.heading);
            rectMode(CENTER);
            // rect(this.loc[0] + width/2, this.loc[1] + height/2, ...this.size);
            rect(...this.loc, ...this.size);
            pop();

        }

        noStroke()
        fill(...this.color, 50);
        circle(...this.loc, this.hit_size);
    }

    keys(k, to_stop=false){
        if (!to_stop){
            // print('push', k);
            this.keys_pressed[this.keys_add_to].push(k);

            // TOGGLE SETTINGS: only call once
            this.playing = (k == 'p') ? !this.playing : this.playing;
            // console.log(this.playing)



        } else { 
            // print('release', k);
            this.keys_to_remove[this.keys_add_to].push(k); // need to lock, buggy if i remove from list here and spam keys
         }
    }
    move_with_heading(k){
        var theta = this.heading;
        theta += (k == 'w')? 0: 0;
        theta += (k == 's')? 180: 0;
        theta += (k == 'a')? 90: 0;
        theta += (k == 'd')? -90: 0;
        // outText=(theta, k);
        this.loc[0] = this.loc[0] + this.speed * cos(theta + 90); // idk angle correction
        this.loc[1] = this.loc[1] + this.speed * sin(theta + 90);
        
    }

    handleControls(){
        let read_id = this.keys_add_to;
        this.keys_add_to = this.keys_add_to == 0 ? 1 : 0;
        let k_locked = this.keys_pressed[read_id].slice();
        let r_locked = this.keys_to_remove[read_id].slice();
        
        // for every key in pressed,
        // add if not in removed
        var push_remaining = [];
        for (let i = 0; i < k_locked.length; i++){ // not fast lol
            var do_add = true;
            for (let ri = 0; ri < r_locked.length; ri++){
                if ( r_locked[ri] ==  k_locked[i] ){
                    do_add = false;
                    r_locked[ri] = null;
                    break;
                }
            }
            if (do_add){ push_remaining.push(k_locked[i]); }
        }
        // console.log((push_remaining).toString())
        
        // meant to be held... or triggered once. for toggle-based settings, go directly to rb.keys()
        for (let i = 0; i < (push_remaining.length); i++){
            let k = push_remaining[i];
            this.loc = (k == 'r') ? [0, 0] : this.loc;
            this.heading = (k == 'r') ? 0 : this.heading;
            this.reached_goal = (k == 'r') ? false : true;
            
            (k == 'w')? this.move_with_heading(k): 0;
            (k == 's')? this.move_with_heading(k): 0;
            (k == 'a')? this.move_with_heading(k): 0;
            (k == 'd')? this.move_with_heading(k): 0;
            // this.loc[1] -= (k == 's')? 1: 0;
            // this.loc[0] -= (k == 'a')? 1: 0;
            // this.loc[0] += (k == 'd')? 1: 0;

            // this.loc[1] += (k == 'w')? 1: 0;
            // this.loc[1] -= (k == 's')? 1: 0;
            // this.loc[0] -= (k == 'a')? 1: 0;
            // this.loc[0] += (k == 'd')? 1: 0;

            // this.loc[1] += 1 ? k == 'w': 0; // why does this work
            // this.loc[1] -= 1 ? k == 's': 0;
            // this.loc[0] -= 1 ? k == 'a': 0;
            // this.loc[0] += 1 ? k == 'd': 0;
            
            // (k == 'p') ? console.log(this.playing) : ''
            this.outText = ((k == 'c') || (k == 'r')) ? "" : this.default_outText;
            this.heading += (k == 'q')? 1: 0;
            this.heading -= (k == 'e')? 1: 0;

        }

        if ( this.keys_to_remove[read_id].length != r_locked.length ){
            console.log("Error diff remove", this.keys_to_remove[read_id].length,r_locked.length)
        }
        if ( this.keys_pressed[read_id].length != k_locked.length ){
            console.log("Error diff add", keys_pressed[read_id].length, k_locked.length)
        }

        this.keys_pressed[this.keys_add_to].push(  ...push_remaining  );
        // push remaining pressed to other read_id
        this.keys_pressed[read_id] = [];
        this.keys_to_remove[read_id] = [];
        // clean old lists

    }
    assign(ob){ this.ob = ob; }

    // Q2 i'll check if this is true later (i really dont have time) i swear i saw this before...
    check_ray_segment_intersection(start_x, start_y, theta, x1, y1, x2, y2){
        angleMode(DEGREES);
        // Ray position start_x, start_y
        // direction vector
        var [rx, ry] = [cos(theta), sin(theta)];
        
        // Segment position and direction vector
        var [qx, qy] = [x1, y1]
        var [sx, sy] = [x2 - x1, y2 - y1]
     
        // denominator (r x s)
        var r_cross_s = rx * sy - ry * sx;
        
        // if (r_cross_s == 0): parallel or collinear
        if (abs(r_cross_s) < 1e-9) { return -1; }
        
        // numerator components (q - p)
        var qx_minus_px = qx - start_x
        var qy_minus_py = qy - start_y
        
       
        var t = (qx_minus_px * sy - qy_minus_py * sx) / r_cross_s  // Solve
        var u = (qx_minus_px * ry - qy_minus_py * rx) / r_cross_s
        
        // Check constraints
        // t >= 0 means the intersection is in the direction of the ray
        // 0 <= u <= 1 means the intersection is on the line segment
        if ((t >= 0) && (0 <= u) && (u <= 1)){
            return t; } // # It intersects!
        return -1;
    }

    // var user = {};
    // Reflect.set(user, 'age', 25);
    // console.log(user);

    // var createAcc = Reflect.set.bind(this);
    // var new_user  = {};
    // createAcc(...[new_user, 'pain', 30]); // example, it works 
    // console.log(new_user); 
    scanDraw(){
        let param_dict = {
            'c': circle.bind(this),
            's': stroke.bind(this),
            'f': fill.bind(this),
            'l': line.bind(this),
        }
        for(let i=0; i< this.scanDrawBuffer.length; i++){
            let hi = param_dict[ this.scanDrawBuffer[i][0] ];
            // console.log(this.scanDrawBuffer[i][1])
            hi( ...this.scanDrawBuffer[i][1] ) 
            // if it errors, you put params wrong
        }
    }
    scan(){
        // idk how to use createGraphics to create a second more permanent display so imma just store everything in one location
        // this.myLayer.fill(255, 0, 0);
        // this.myLayer.background(4, 4, 4, 10);
        // this.myLayer.translate(mouseX, mouseY);
        // this.myLayer.scale(...this.scale);
        // this.myLayer.clear(); 
        this.scanDrawBuffer = [];

        // how tf do i implement a raycast?
        // let's cheat
        
        
        fill(0,255,255); this.scanDrawBuffer.push(['f', [0, 255, 255]]);
        let [rx, ry] = this.loc;
        // first ignore any objects that are obviously too far away
        var x, y = 0;
        var objs = [];
        for (let i = 0; i < this.ob.maze_arr.length; i++){     
            [x, y] = this.ob.maze_arr[i]; let s = this.ob.partsize;
            if (((x-rx)**2 + (y-ry)**2)**.5 <= this.search_lim ){
                objs.push([x, y, s]);
                circle(x, y, s); this.scanDrawBuffer.push(['c', [x, y, s]]);
            }
        }
        
        // normally everything would be in triangles... uhmmmm
        angleMode(DEGREES);
        stroke(255); this.scanDrawBuffer.push(['s', [255]]);
        var tri = [];
        for (let i = 0; i < objs.length; i++){  
            if (i >= tri.length){ tri.push([]); }
            // take center
            // 360 point shit
            for (let si = 0; si <= 360; si+= this.scan_angle){
                x = objs[i][0] + objs[i][2]/2 * cos(si);
                y = objs[i][1] + objs[i][2]/2 * sin(si);
                tri[i].push([x, y]);
            }
        }
        // used below
        for (let i = 0; i < tri.length; i++){       // for each object
            for (let vi = 0; vi < tri[i].length-1; vi++){   // for each pair, except the last one
                line(...tri[i][vi], ...tri[i][vi+1]); this.scanDrawBuffer.push(['l', [...tri[i][vi], ...tri[i][vi+1]]]);
            }
        }
        
        // Q1. given theta = 30, and start location (3, 4), how to get end location with distance 5
        // Q2. given a raycast (start_x, start_y, theta), and  two vertices (x, y), how to check if the raycast passes through?
        // Q3. how can you get the distance? (just swap return w/ t lol)
        // Q4. how can i determine the direction to stop the robot from travelling if it collides? (not needed though)
        //      given a segment that would be collided with, how do i create a new force vector on robot?
        // Q5. i didn't order the vertices so now i need to find the minimum distance one
        // Q6. why isn't the top raycast first?
        // Q7. turns out, i set rayscan to run every something seconds, now it won't draw :(

        let hit_objs = [];
        let hit_tris = [];
        fill(255, 0, 255); this.scanDrawBuffer.push(['f', [255, 0, 255]]);
        // the actual part
        let raycasts = [];
        // Q6. i need to shift raycasts so they start from y hahaha
        // shuffling the array sounds too cumbersome, let's just add theta
        // for (let si = 0; si <= 360; si += this.scan_angle){
        for (let si = 90+this.heading; si <= 450+this.heading; si += this.scan_angle){
            // let break_out = false;
            // scan in that direction
            let x_end = rx + this.search_lim * cos(si); // Q1
            let y_end = ry + this.search_lim * sin(si);
            
            // Q5. starts here, cannot break!
            var ci = -1; // chosen object index
            var cti = -1; // chosen tri index
            raycasts.push(-1);
            var cd = Infinity; // chosen dist (from raycast)
            
            for (let i = 0; i < tri.length; i++){       // for each object
                for (let vi = 0; vi < tri[i].length-1; vi++){   // for each segment (for each vertex except the last one)
                    let res = this.check_ray_segment_intersection(...this.loc, si, ...tri[i][vi], ...tri[i][vi+1]) // Q2 & Q3
                    
                    // raycasted circle? refer to objs[corresponding i] for info
                    if (res != -1){ 
                        // Q5. correction, choose smaller 
                        if (res < cd){
                            raycasts[raycasts.length-1] = res;
                            ci = i;
                            cti = vi; // to track segment
                            cd = res; // take min
                        }
                        
                        // Wrong...
                        // circle(...objs[i]);  //extra
                        // hit_objs.push(objs[i]);
                        // // only return closest one for specific theta btw
                        // break_out = true;
                        // raycasts.push(res);
                        // break;
                    }
                } 
            // if (break_out){ break; }

            // didn't find any
            // if (!break_out) {  // doesn't hit at least once
                // raycasts.push(-1);
                // hit_objs.push([NaN, NaN]); //extra
            //  }
            }

            // Q5. push the best one here
            if (ci > -1){
                circle(...objs[ci]);  // extra
                    this.scanDrawBuffer.push(['c', objs[ci]]);
                hit_objs.push(objs[ci]);
                // add tri tracking here
            } else { hit_objs.push([NaN, NaN]); }


            let s2i = raycasts.length - 1;
            if (raycasts[s2i] > -1){
                let x_end2 = rx + raycasts[s2i] * cos(si); // offset 90
                let y_end2 = ry + raycasts[s2i] * sin(si);
                // console.log(raycasts[s2i], raycasts.length, s2i)
                line(...this.loc,);  this.scanDrawBuffer.push(['l', this.loc]);
                line(...this.loc, x_end2, y_end2);  this.scanDrawBuffer.push(['l', [...this.loc, x_end2, y_end2]]); // raycast line
            } else { 

                line(...this.loc, x_end, y_end);
                this.scanDrawBuffer.push(['l', [...this.loc, x_end, y_end]]); 


             }
            // this reveals that i did not properly order the vertices! oh no!
            // find the circle AND triangle segment one with the min distance, thanks!

        }
        stroke(0); this.scanDrawBuffer.push(['s', [0]]);



        // ----------------- PROCESS RAY CASTS HERE -----------------

         
        
        fill(255, 0, 0); this.scanDrawBuffer.push(['f', [255, 0, 0]]);
        for (let i = 0; i < raycasts.length; i++){ // 13 raycasts
            if ((raycasts[i] < this.approx_size/2) && raycasts[i] > -1){
                circle(...hit_objs[i]); this.scanDrawBuffer.push(['c', hit_objs[i]]);
                // Q4: to stop movement, check if future "proposed_loc" direction
                // will cause ...
                // ⚠️ TO BE CONTINUED let's put q4 on hold, i have no time i got exam
                this.outText = 'you died';
            }
        }
        
        this.rays = raycasts.slice();  // save
        // pop()
    }
    
    elapsedTime(key, num=0){
        this.startTimes[key] = (key in this.startTimes) ? this.startTimes[key]:Date.now()
        let elapsedTimeMs = Date.now() - this.startTimes[key]; // now - start 
        return (elapsedTimeMs / 1000) > num;
    }

    outputText(){
        if (this.out_el != null){ this.out_el.innerHTML = this.outText; }
    }
    outputElement(el){ this.out_el = el; } // assign output element
    assign_goal(x=NaN, y=NaN){ this.goal = [x, y]; }
    checkGoal(){
        // check location within radius
        let goalX = this.goal[0] || this.loc[0]; // because i set to NaN
        let goalY = this.goal[1] || this.loc[1];

        if (((goalX - this.loc[0])**2 
         + (goalY - this.loc[1])**2 ) 
        < (this.hit_size)**2){
            this.color = [0, 255, 0];

            this.reached_goal = true;
        } else { this.color = this.orig_color; 
            this.reached_goal = false;
        }
        
    }
    // console.log('Event received', event);
    // TBC: intended to handle keyboard movement, algo movement 
    // & collision logic here.

/* Q8. convert (x: 1, y: 0, theta: 1) to add to pos (x, y) in deg so it would go in a circle if repeated
x = 1 -> only move forward
x = 1, heading = 1 -> move in circle
y = 1, heading = 1 -> move in circle
heading = 1 -> rotate about 
how do i get x & y cordinates?

*/
    move(event){
        
        angleMode(DEGREES);
        let msg = event['detail'];
        // x = forward - strafe
        // y = forward + strafe // i have never heard of this?
        // oh, i forgot y should also be dependent on x now that's it rotated :I?
        let mov_x = (msg['x'] - msg['y']) * this.algo_speed_boost * cos(this.heading + msg['heading']+90) ;
        let mov_y = (msg['x'] + msg['y']) * this.algo_speed_boost * sin(this.heading + msg['heading']+90) ;
        this.loc = [this.loc[0] + mov_x, this.loc[1] + mov_y];
        this.heading -= msg["heading"] * this.algo_speed_boost;
        // console.log(this.loc, mov_x, mov_y);
        
        this.heading = posMod(this.heading, 360);  // heading isn't clamped lol
    }


    // =============  CUSTOM SHIT THAT CAN BE SCRAPPED ====================
    rotateAbout(theta=1){
        this.heading += theta;
    }
    insideRange(value, min=0, max=Infinity){
        return (value > min) && (value < max)
    }
    outsideRange(min, max, value){  // value < min       max >
        return !((value >= min) && (value <= max))
    }
    // choosingDirection(raycasts){
    //     // 360/30 (scan angle) + 1 = 12 + 1 = raycast_length
    //     // scan = 360/(raycast_length - 1)

    //     // [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360]
    //     //  0  1   2    3   4    5    6...

    //     var li = 0; var ri = raycasts.length-1;
    //     // look left & right one after another until meet
    //     var chosen = -1;
    //     while (li <= ri){
    //         // want to avoid raycast_i < hitsize
    //         if (li == ri){ // don't bother running twice, it's the middle. (worst case scenario backtrack)
    //             if (this.hit_size < raycasts[li]) { console.log('backtrack'); }
    //             else { console.log('you got blocked :(');}
    //         } else {
    //             if ((this.hit_size < raycasts[li]) && raycasts[li] == Infinity) { chosen = li; break; };
    //             if ((this.hit_size < raycasts[ri]) && raycasts[ri] == Infinity) { chosen = ri; break; };
    //         }
    //         li += 1; 
    //         ri -= 1;
    //     }
    //     return chosen;
    // }
    async assignEventHandler(element) {
        if (this.domElementHack == null){
            this.domElementHack = element
            this.domElementHack.addEventListener('MoveEvent', (event) => { 
                this.move(event);
            });

        }
    }
    sendMovement(dict={x: 1, y: 0, heading: 0}){
        if (this.domElementHack != null){
        let event = new CustomEvent('MoveEvent', { detail: dict});
        this.domElementHack.dispatchEvent(event);
        }
    }

    // splice removes original
    rotateList(bouqet, step){ // step >= 0
        if (bouqet.length > 0){ 
            step = posMod(step, bouqet.length)
            return bouqet.splice(step).concat(bouqet.splice(0, step))}
        return bouqet
    }

    // I might not be implementing the run loop correctly lmao 
    goalAlgo(){ // run after rb.scan() please :)
        let raycasts = this.rays;
        // console.log(raycasts);
        if (this.playing){
        // ================== IMPLEMENT HERE ==================
        // Note: the timing is going to be very inaccurate because idk how exactly it's implemented
        
        // a lot of nonsense code because i don't understand, this is VERY New to me, idk what to do
        // i'm angry so let's treat -1 as Infinity
        for (let i = 0; i<this.rays.length; i++){ if (this.rays[i] == -1){ this.rays[i] = Infinity} }
        // [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360]
        //  0  1   2    3   4    5    6   7    8    9    10   11   12
        //  include  >            no                     <       | no
        // let forward = this.rotateList(raycasts.splice(0, raycasts.length-1), -2
        // for (let si = 90+rb.heading; si <= 450+rb.heading; si += rb.scan_angle){console.log(si); }
        // rb.scan_angle = 30
        // for (let si = 0; si <= 360; si += rb.scan_angle){console.log(si); }
        
        var mov = {x: 0, y: 0, heading: 0};

        // Version 1: only one lidar at the front
        // Variables?
        if (this.added_heading == undefined){ this.added_heading = 0; } // since idk if it stores it
        if (this.state == undefined){ this.state = 'FORWARD'; }
        if (this.spin_dir == undefined){ this.spin_dir = 1; }

        if (this.counterR == undefined){ this.counterR = 0; }
        if (this.counterL == undefined){ this.counterL = 0; }
        if (this.counterF == undefined){ this.counterF = 0; }
        
        
        // after having a nightmare with not being able to rotate and forcing it to jitter between two states, i added rotation.
        // are you happy now?
        console.log(this.state)


        if (this.reached_goal){ 
            this.state == 'FINISHED'
        } else {
            this.sendMovement(mov);
        }

}}}

class ObsctaclesManager{

    constructor(canvasSize, size=[300,300], loc=[0, 200], seed=2){ // don't use "self"
        this.canvasSize = canvasSize;
        this.loc = loc;
        this.scale = [2, -2];  // ⚠️

        this.size = size;      // ✅
        this.loc = loc;        // ✅
        this.partsize = 10;    // ⚠️
        this.seed = seed;      // ✅
        // this.randomise = true        
        this.maze_arr = []; //Array.from({ length: height }, () => Array(width).fill(0));
        this.howmany = 50;      // ✅

    }

    generateMaze(){
        randomSeed(this.seed);
        this.maze_arr = [];
        for (let i = 0; i < this.howmany; i++){     
            let x = randomBetween( int(this.loc[0]-this.size[0]/2), int(this.loc[0]+this.size[0]/2))
            let y = randomBetween( int(this.loc[1]-this.size[1]/2), int(this.loc[1]+this.size[1]/2));
            this.maze_arr.push([x, y]); // about center
            // console.log(this.loc[0]-this.size[0]/2, this.size)
        }}

    draw(){
        stroke(0);
        fill(255, 255, 0);
        // circle(...this.loc, ...this.size);
        for (let i = 0; i < this.maze_arr.length; i++){     
            circle(...this.maze_arr[i], this.partsize);

        }}

    spawn(x=0, y=0){
        rectMode(CENTER);
        fill(0, 255, 255); // origin
        rect(x, y, 10, 10);

    }
    summon(x=0,y=0){ // im not removing anything becuase i cant handle it
        console.log('sum', x, y)
        this.maze_arr.push([x, y]);
    }
    assign(rb){ this.rb = rb; }
    summonKeyHandler(x, y){
        angleMode(DEGREES)
        var newX, newY;
        if (rb.follow_toggle){
            let dx = (x  - this.canvasSize[0]/2)
            let dy = (y  - this.canvasSize[1]/2)

            // (436, 0) = (62, 0), robot = (0, 0), width/2 = 320, screen_width/2 = 160 (2x scaled down)
            newX = this.rb.loc[0] 
                + (dx * cos(-this.rb.heading ) - dy * sin(-this.rb.heading))/this.scale[0]
            newY = this.rb.loc[1]
                + (dx * sin(-this.rb.heading) + dy * cos(-this.rb.heading))/this.scale[1] 

        } else {
            newX = x - this.canvasSize[0]/2;
            newY = y - this.canvasSize[1]/2;
        }
        
        this.summon(newX, newY);
    }

    keys(k, to_stop=false, mX, mY){
      
        // console.log(to_stop, mX, mY)
        if (!to_stop){
              
            // this.keys_pressed[this.keys_add_to].push(k);
            
            // TOGGLE SETTINGS: only call once
            (k == 'x') ? this.summonKeyHandler(mX, mY): null;
            
        } else { 
            // this.keys_to_remove[this.keys_add_to].push(k); 
         }
    }
}

