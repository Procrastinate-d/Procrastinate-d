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
        this.loading = true;

        this.canvasSize = canvasSize;
        this.VarSetup(size, loc)


        this.keys_on = false;
        this.keys_pressed = [[], []];
        this.keys_to_remove = [[], []];
        this.keys_add_to = 0;
        this.scale = [2, -2];           // ⚠️ 
        this.orig_color = [255, 0, 0];  // ✅
        this.color = [255, 0, 0];       // ✅

        this.goal = [NaN, NaN];
        this.reached_goal = false;
        this.playing = false;
        
        this.startTimes = {};
        this.domElementHack = null;
        // this.myLayer = createGraphics(...canvasSize);
        this.scanDrawBuffer = {}; // placeholder version   
        
        this.out_el = null;
        this.default_outText = `
Settings:
    wasd to move, qe to rotate
    mouse over + x to spawn obstacles
    mouse move + f to pan screen
    
    r to reset pos & rotation
    p to play program in goalAlgo();
    collisions do not exist

    other settings edit in console. ex: rb.scan_angle = 60; rb.follow_toggle = false; (rectangle rotation buggy)
`;
        this.outText = this.default_outText;  // system could be more dynamic but who cares right now!
            
        this.ac = 90 // angle coorrection :I

        // difference = drag to - old drag pos (before drag)
        // new pos = old drag pos + difference (every drag and after drag)
        // actual = scaling * drag pos

        // Ex: from x=3,  x=intermediate,  x=13 (right 10 units)
        //         old       drag to
        this.startMouse = [0, 0];
        this.startView = [0, 0]
        this.moved = [0, 0]
        this.view = [0, 0]
        this.algoVarSetup()
        
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
       
        translate(this.view[0] + this.canvasSize[0] / 2, this.view[1] + this.canvasSize[1] / 2);
        rotate(this.heading);
        translate(( -this.loc[0]) * this.scale[0],
                (-this.loc[1]) * this.scale[1]);
        scale(...this.scale);

        

        
    } else {
        translate(this.view[0] + this.canvasSize[0] / 2, this.view[1] + this.canvasSize[1] / 2 );
        scale(1, -1) // flip y
    }
}

    draw(){
        fill(...this.color);

        // how to rotate rectangle about some center given its center, size which computes vertices
        angleMode(DEGREES)
        
        var tx = 0; var ty = 0;
        // var tx = 10*(this.loc[0]* cos(0) - this.loc[1] * sin(0))
        // var ty = 10*(this.loc[0]* sin(0) + this.loc[1] * cos(0))
        strokeWeight(3)
        stroke(0, 255, 0);
        line(...this.loc, this.loc[0]+40, this.loc[1])
        stroke(255, 0, 0);
        line(...this.loc, this.loc[0], this.loc[1]+40)
        strokeWeight(1)
        stroke(0)
        var vertices = [
        [ - this.size[0]/2 ,  - this.size[1]/2],
        [ - this.size[0]/2 ,  + this.size[1]/2],
        [ + this.size[0]/2 ,  + this.size[1]/2],
        [ + this.size[0]/2 ,  - this.size[1]/2],
    ]
        vertices.push(vertices[0])


        beginShape();
        for (let i=0; i<vertices.length;i++){ 
            tx = vertices[i][0]* cos(this.heading) - vertices[i][1] * sin(this.heading)
            ty = vertices[i][0]* sin(this.heading) + vertices[i][1] * cos(this.heading)
            vertex(this.loc[0] + tx, this.loc[1] + ty)} 
        endShape();

        noStroke()
        fill(...this.color, 50);
        circle(...this.loc, this.hit_size);

        
    }

    keys(k, to_stop=false){
        if (this.loading){ return; }
        if (!to_stop){
            // print('push', k);
            this.keys_pressed[this.keys_add_to].push(k);

            // TOGGLE SETTINGS: only call once
            this.playing = (k == 'p') ? !this.playing : this.playing;
            // console.log(this.playing)
            (k == 'r') ? this.algoVarSetup() : null;
            
            // implement dragging w/ x and y before, during and after dragging
            // BEFORE DRAGGING:
            this.startMouse = [mouseX, mouseY];
            this.startView = this.view
            // console.log('before', this.follow_previous)
            
        } else { 
            // print('release', k);
            this.keys_to_remove[this.keys_add_to].push(k); // need to lock, buggy if i remove from list here and spam keys
            
            // AFTER DRAGGING:
            // same affect as if you set in loop 
        }
    }
    move_with_heading(k){
        var theta = this.heading;
        theta += (k == 'w')? 0: 0;
        theta += (k == 's')? 180: 0;
        theta += (k == 'a')? 90: 0;
        theta += (k == 'd')? -90: 0;
        // outText=(theta, k);
        this.loc[0] = this.loc[0] + this.key_speed * cos(theta + this.ac); // [unchecked angle correction]
        this.loc[1] = this.loc[1] + this.key_speed * sin(theta + this.ac);
        
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

            // IS DRAGGING:
            this.moved = (k == 'f')? [mouseX - this.startMouse[0], mouseY - this.startMouse[1]] : this.moved
            this.view = (k == 'f')? [this.startView[0] + this.moved[0], this.startView[1] + this.moved[1]] : this.view



            this.loc = (k == 'r') ? [0, 0] : this.loc;
            this.heading = (k == 'r') ? 0 : this.heading;
            this.reached_goal = (k == 'r') ? false : this.reached_goal;
            
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
            
            this.pred_heading += (k == 'q')? 1: 0;
            this.pred_heading -= (k == 'e')? 1: 0;
            this.added_heading += (k == 'q')? 1: 0;
            this.added_heading -= (k == 'e')? 1: 0;
            // also do for pred_loc

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
        var [rx, ry] = [cos(theta), sin(theta)]; // [unchecked angle correction]
        
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
    scanDraw(key="scan"){
        let param_dict = {
            'c': circle.bind(this),
            's': stroke.bind(this),
            'f': fill.bind(this),
            'l': line.bind(this),
            'a': arc.bind(this),
        }
        if (this.scanDrawBuffer[key] == undefined){ return }
        for(let i=0; i< this.scanDrawBuffer[key].length; i++){
            let hi = param_dict[ this.scanDrawBuffer[key][i][0] ]; // holy not a mutex
            // console.log(this.scanDrawBuffer[i][1])
            hi( ...this.scanDrawBuffer[key][i][1] ) 
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
        let key = "scan"
        this.scanDrawBuffer[key] = []; // reset

        // how tf do i implement a raycast?
        // let's cheat
        
        
        fill(0,255,255); this.scanDrawBuffer[key].push(['f', [0, 255, 255]]);
        let [rx, ry] = this.loc;
        // first ignore any objects that are obviously too far away
        var x, y = 0;
        var objs = [];
        for (let i = 0; i < this.ob.maze_arr.length; i++){     
            [x, y] = this.ob.maze_arr[i]; let s = this.ob.partsize;
            if (((x-rx)**2 + (y-ry)**2)**.5 <= this.search_lim ){
                objs.push([x, y, s]);
                circle(x, y, s); this.scanDrawBuffer[key].push(['c', [x, y, s]]);
            }
        }
        
        // normally everything would be in triangles... uhmmmm
        angleMode(DEGREES);
        stroke(255); this.scanDrawBuffer[key].push(['s', [255]]);
        var tri = [];
        for (let i = 0; i < objs.length; i++){  
            if (i >= tri.length){ tri.push([]); }
            // take center
            // 360 point
            for (let si = 0; si <= 360; si += this.tri_segs_inc){
                x = objs[i][0] + objs[i][2]/2 * cos(si);
                y = objs[i][1] + objs[i][2]/2 * sin(si);
                tri[i].push([x, y]);
            }
        }
        // used below
        for (let i = 0; i < tri.length; i++){       // for each object
            for (let vi = 0; vi < tri[i].length-1; vi++){   // for each pair, except the last one
                line(...tri[i][vi], ...tri[i][vi+1]); this.scanDrawBuffer[key].push(['l', [...tri[i][vi], ...tri[i][vi+1]]]);
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
        fill(255, 0, 255); this.scanDrawBuffer[key].push(['f', [255, 0, 255]]);
        // the actual part
        let raycasts = [];
        // Q6. i need to shift raycasts so they start from y hahaha
        // shuffling the array sounds too cumbersome, let's just add theta
        // for (let si = 0; si <= 360; si += this.scan_angle){
        for (let si = 0+this.heading+this.ac; si <= 360+this.heading+this.ac; si += this.scan_angle){
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
                    this.scanDrawBuffer[key].push(['c', objs[ci]]);
                hit_objs.push(objs[ci]);
                // add tri tracking here
            } else { hit_objs.push([NaN, NaN]); }


            let s2i = raycasts.length - 1;
            if (raycasts[s2i] > -1){
                let x_end2 = rx + raycasts[s2i] * cos(si); // offset 90
                let y_end2 = ry + raycasts[s2i] * sin(si);
                // console.log(raycasts[s2i], raycasts.length, s2i)
                // line(...this.loc,);  this.scanDrawBuffer[key].push(['l', this.loc]);
                line(...this.loc, x_end2, y_end2); this.scanDrawBuffer[key].push(['l', [...this.loc, x_end2, y_end2]]); // raycast line
            } else {
                line(...this.loc, x_end, y_end); this.scanDrawBuffer[key].push(['l', [...this.loc, x_end, y_end]]); // unblocked raycast line
             }
            // this reveals that i did not properly order the vertices! oh no!
            // find the circle AND triangle segment one with the min distance, thanks!

        }
        stroke(0); this.scanDrawBuffer[key].push(['s', [0]]);



        // ----------------- PROCESS RAY CASTS HERE -----------------

         
        
        fill(255, 0, 0); this.scanDrawBuffer[key].push(['f', [255, 0, 0]]);
        for (let i = 0; i < raycasts.length; i++){ // 13 raycasts
            if ((raycasts[i] < this.approx_size/2) && raycasts[i] > -1){
                circle(...hit_objs[i]); this.scanDrawBuffer[key].push(['c', hit_objs[i]]);
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
        < (this.hit_size/2)**2){ // forgot /2
            this.color = [0, 255, 0];

            this.reached_goal = true;
        } else { this.color = this.orig_color; 
            this.reached_goal = false;
        }
        
    }
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
        // if (event['detail']['heading'] != 0) console.log('event')
        // console.log('Event received', event);
        angleMode(DEGREES);
        let msg = event['detail'];

        // msg['x'] = 2
        // msg['y'] = 0
        // msg['heading'] = 2

        // x = forward - strafe
        // y = forward + strafe // i have never heard of this?
        // oh, i forgot y should also be dependent on x now that's it rotated :I?
        let mov_x = 0//(msg['x'] - msg['y']) * cos(this.heading + msg['heading']+ this.ac) * this.algo_speed_boost ;
        let mov_y = 0//(msg['x'] + msg['y']) * sin(this.heading + msg['heading']+ this.ac) * this.algo_speed_boost ;

        let idk_x = msg['x'] * cos(this.heading + msg['heading']+ this.ac) - msg['y'] * sin(this.heading + msg['heading']+ this.ac)
        let idk_y = msg['x'] * sin(this.heading + msg['heading']+ this.ac) + msg['y'] * cos(this.heading + msg['heading']+ this.ac)
        
        this.loc = [this.loc[0] + mov_x + idk_x, this.loc[1] + mov_y + idk_y];
        this.heading += msg["heading"] * this.algo_speed_boost;
        // console.log(this.loc, mov_x, mov_y);
        
        // this.heading = posMod(this.heading, 360);  // heading isn't clamped lol
    }

    drawGoal(){
        fill(0, 125, 0);
        stroke(0, 125, 0);
        strokeWeight(3);
        // console.log(this.goal)
        if ((this.goal[0] != this.goal[0]) && (this.goal[1] != this.goal[1])){ }
        else if (this.goal[0] != this.goal[0]){ 
            line(-1000000, this.goal[1], 1000000, this.goal[1]); }
        else if (this.goal[1] != this.goal[0]){ 
            line(this.goal[0], -1000000, this.goal[0], 1000000); }
        else { rect(...this.goal, 10, 10); }
        strokeWeight(1);
    }
    async assignEventHandler(element) {
        // console.log('checking listener...')
        if (this.domElementHack == null){
            // console.log('assigning listener...');
            this.domElementHack = element
            element.addEventListener('MoveEvent', (event) => { this.move(event); });

        }
    }
    // =============  CUSTOM CODE THAT CAN BE SCRAPPED ====================

    sendMovement(dict={x: 1, y: 0, heading: 0}){
        // if (dict['heading'] != 0) console.log('send', dict['id'])
        if (this.domElementHack != null){
        let event = new CustomEvent('MoveEvent', { detail: dict});
        this.domElementHack.dispatchEvent(event);
        }
    }

    AInRange(a, l, u){ // idk how to check if angle between 
        return posMod(a - l, 360) <= posMod(u - l, 360)
    }

    analyseGeneralRays(startT, endT, hitDist=this.hit_size){ // ex: 190 - 250
    let arrL = this.raysTemp.length
    let s = floor(startT / this.scan_angle)  // 6
    let e = floor(endT / this.scan_angle)    // 8
    // console.log(posMod(s, arrL), posMod(e, arrL)) // oh, need to add arrL instead of 12 oops
    let i = s
    
    while(posMod(i, arrL) != posMod(e + 1, arrL)){ // make sure it increments in the right direction
        let check = 0;
        let id = posMod(i, arrL);
        let start = this.scan_angle * (id);
        let target = this.scan_angle * posMod(id+1, arrL);
        let current = this.scan_angle * (id) + this.added_heading
        // 180: only consider 190 - 210
        if (i == s) {if (this.AInRange(current, startT, target)){         
            // console.log('start', current, id);
            check = 1; }}
        // 240: only consider 240 - 250
        else if (i == e){ if (this.AInRange(current, start, endT)){ 
// if (id == 1) { console.log([s, e] , '(',posMod(e+1, 12),')', i, '->', id,'->', posMod(i, 12), 
//     current, startT, target) }
            // console.log('end', current, id)
            check = 2; }}
        // in between: consider the full range
        else { 
            // console.log('id', id, current)
            check = 3; }
        if ((check>0) && (this.raysTemp[id] < hitDist)){
            // console.log('Hit', id, start, current, target,'(gate=',check,')', 'within',    s, e); // 🧪
            return false;
        }
        i++;
    }
    return true;
    }

    // I might not be implementing the run loop correctly lmao 
    registerState(state, counter=1){
        this.stateQ.push(state)
        if (this.states[state] == undefined){ this.states[state] = [] }
        this.states[state].push(counter) 
    }
    endState(state){ // simply remove the first element in each list
        this.states[state] = this.states[state].slice(1); // stop the counter and change
        this.stateQ = this.stateQ.slice(1); // watch out for over it
    }
    decState(state){
        this.states[state][0] -= 1
    }
    // ❓ how would interrupt state destroy a pre-added state?
    
    displayRange(startT, endT, hitDist)    {
        // Line to direction?
        // console.log(this.pred_heading - this.added_heading) // ideally cancel if start at 0
        
        let key = 'algo';
        
        stroke(125); this.scanDrawBuffer[key].push(['s', [125]]);
        angleMode(DEGREES);
        let h_offset = this.pred_heading - this.added_heading + this.ac
        
        // full search lim
        fill(255, 0, 0, 20); this.scanDrawBuffer[key].push(['f', [255, 0, 0, 20]]);
        arc(...this.loc, 
            2*this.search_lim, 2*this.search_lim,
            startT + h_offset, endT + h_offset)
        this.scanDrawBuffer[key].push(['a', [...this.loc, 
            2*this.search_lim, 2*this.search_lim,
            startT + h_offset, endT + h_offset]]);

        let x = this.search_lim*cos(startT + h_offset)
        let y = this.search_lim*sin(startT + h_offset)
        line( ...this.loc, this.loc[0]+x, this.loc[1] +y ); this.scanDrawBuffer[key].push(['l', [...this.loc, this.loc[0]+x, this.loc[1] +y]]);
        let x2 = this.search_lim*cos(endT + h_offset)
        let y2 = this.search_lim*sin(endT + h_offset)
        line( ...this.loc, this.loc[0]+x2, this.loc[1] +y2 ); this.scanDrawBuffer[key].push(['l', [...this.loc, this.loc[0]+x2, this.loc[1] +y2]]);


        // hit distance
        fill(0, 0, 255, 20); this.scanDrawBuffer[key].push(['f', [0, 0, 255, 20]]);
        arc(...this.loc, 
            2*hitDist, 2*hitDist,
            startT + h_offset, endT + h_offset)
        this.scanDrawBuffer[key].push(['a', [...this.loc, 
            2*hitDist, 2*hitDist,
            startT + h_offset, endT + h_offset]]);

        stroke(0); this.scanDrawBuffer[key].push(['s', [0]]);
    } 
    displayAlgo(){
        if (this.rangesCurrent[0] != null)
            { this.displayRange(...this.ranges[this.rangesCurrent])}
    }
    VarSetup(size, loc){
        this.size = size;
        this.loc = loc;                 // ⚠️

        this.follow_toggle = true;      // ✅
        this.search_lim = 100;          // ✅
        this.scan_angle = 1;           // ⚠️
        this.tri_segs_inc = 20          // angle increment for triangle segments circle
        
        this.heading = 0;                // ⚠️
        this.key_speed = 4;              // ✅
        this.approx_size = 25;           // ⚠️
        this.hit_size = 30;              // ⚠️ effective radius for practical purposes, won't let you travel   
    }
    // if i were smarter, i would allow each state to store specific variables so changing one process manually doesn't brick another
    algoVarSetup(){
        this.states = {
            'SCAN FORWARD': [this.scan_angle, ], // counter
            // 'BLOCKED': [], // assign default here
        }
        this.stateQ = ['SCAN FORWARD'];
        this.ambient_walk = 10;
        this.algo_speed_boost = 1;       // ⚠️ will break stuff
        this.TIMER     = 0.01;           // ✅
        this.TIMER_RAY = 0.01;           // ✅
        // this.vert_angle = 30; // starts from front, move left/right. calculate if you want >_>
        // this.horz_angle = 70; // starts fron 90
        this.ranges={
            "FORWARD":       [330     , 360+30  , 30], // please make sure ranges move forward
            "BACKWARD":      [150     , 210     , 30],
            "RIGHT":         [210     , 330     , 20],
            "LEFT":          [30      , 150     , 20],
            "BACK RIGHT":    [210 -10 , 240 + 10, 30],
            "BACK LEFT":     [120 -10 , 150 + 10, 30],
            "FORWARD RIGHT": [30 - 10 , 60 + 10 , 30],
            "FORWARD LEFT":  [300 - 10, 330 + 10, 30],
            "ALL": [0, 359],
            "NONE": [null, null]
        }
        this.rangesCurrent = 'NONE'
        
        this.pred_loc = this.loc;
        this.pred_heading = this.heading;
        this.added_heading = 0;

        this.scan_complete = true; 

    }

    goalAlgo(){ // run after rb.scan() please :)
        // console.log(this.rays);
        let key = 'algo';
        this.scanDrawBuffer[key] = []; // drawing purposes

        // Init Variables?
        if (this.playing && (this.domElementHack != null)){
            if (this.states == undefined){ 
                this.algoVarSetup(); 
            } // cuz i don't wanna put up there. deal with updated variables *before* playing

        // ================== IMPLEMENT HERE ==================
        // Note: the timing is going to be very inaccurate because idk how exactly it's implemented
        
        // a lot of nonsense code because i don't understand, this is VERY New to me, idk what to do
        // i'm angry so let's treat -1 as Infinity
        for (let i = 0; i<this.rays.length; i++){ if (this.rays[i] == -1){ this.rays[i] = Infinity} }
        var mov = {x: 0, y: 0, heading: 0};
        // [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360]
        //  0  1   2    3   4    5    6   7    8    9    10   11   12
        //  include  >            no                     <       | no
        // let forward = this.rotateList(raycasts.splice(0, raycasts.length-1), -2
        // for (let si = 90+rb.heading; si <= 450+rb.heading; si += rb.scan_angle){console.log(si); }
        // rb.scan_angle = 30
        // for (let si = 0; si <= 360; si += rb.scan_angle){console.log(si); 
        this.raysTemp = this.rays.slice(0, this.rays.length - 1) // ✅ exclude last 
        // after having a nightmare with not being able to rotate and forcing it to jitter between two states, i added rotation.
        // are you happy now?
        
        // current bug: P too early breaks stuff sometimes

let state = this.stateQ[0];
let count = this.states[state][0];
// console.log(this.stateQ, this.states);
console.log(state)
// console.log(count);
// console.log(state, count);

mov = this.STATE_SCAN(mov, state, count)
// mov = {'x':2,'y':0, 'heading':0}

// remove any state @0 and YOU HAVEN'T, after updating
// console.log(this.states, this.stateQ)
// if (this.states[state][0] == 0){ this.endState(state); }
        this.PRED_MOVE(mov)
        if (this.reached_goal){ 
            this.registerState('FINISHED', 1000000000000)
            // this.sendMovement(mov);
        } else {
            this.sendMovement(mov);
        }      
}
        this.displayAlgo()

}

PRED_MOVE(msg){   // basically move
    angleMode(DEGREES);

    // this is wrong, stupid
    // let mov_x = (msg['x'] - msg['y']) * this.algo_speed_boost * cos(this.pred_heading + msg['heading']+this.ac) ;
    // let mov_y = (msg['x'] + msg['y']) * this.algo_speed_boost * sin(this.pred_heading + msg['heading']+this.ac) ;
    // this.pred_loc = [this.loc[0] + mov_x, this.loc[1] + mov_y];
    // this.pred_heading += msg["heading"] * this.algo_speed_boost;
    let mov_x = 0//(msg['x'] - msg['y']) * cos(this.heading + msg['heading']+ this.ac) * this.algo_speed_boost ;
    let mov_y = 0//(msg['x'] + msg['y']) * sin(this.heading + msg['heading']+ this.ac) * this.algo_speed_boost ;

    let idk_x = msg['x'] * cos(this.heading + msg['heading']+ this.ac) - msg['y'] * sin(this.heading + msg['heading']+ this.ac)
    let idk_y = msg['x'] * sin(this.heading + msg['heading']+ this.ac) + msg['y'] * cos(this.heading + msg['heading']+ this.ac)
    this.pred_loc = [this.loc[0] + mov_x + idk_x, this.loc[1] + mov_y + idk_y];
    this.pred_heading += msg["heading"] * this.algo_speed_boost;

}

// V2 sorta working?
STATE_SCAN(mov, state, count){
if (state == "SCAN FORWARD"){
    if (count > 0){ // [counter] for this process
    this.rangesCurrent = "FORWARD"
    let did_it_hit = this.analyseGeneralRays(...this.ranges["FORWARD"])
    
    // return mov; // bypass to test
    // console.log('move')
    // mov['id'] = this.added_heading 
    if (did_it_hit){ // [continue]
        // console.log('still safe...');
        
        if (this.scan_angle != 1){  // don't bother
            mov['heading'] = 1; this.added_heading += 1; // turn left (to capture full if limited # of rays)
        }

        this.decState(state)
    } else { // [interrupt] hit something that way so it's blocked
        // console.log('stop!!');
        let add = this.scan_angle - this.states[state] // pass counter to undo rotation
        this.registerState("UNDO SCAN", add)
        // this.registerState("BLOCKED", 10000)
        
        // [B1] need an indicator if previous is scan right, then continuously scan right
        this.registerState("SCAN LEFT") // next stage
        // but i lazy create another varible

        this.endState(state);
    }}
    else { // [pass] counter over - it's safe
        // console.log('pass')
        this.registerState("UNDO SCAN", this.scan_angle)
        this.registerState("MOVE FORWARD", this.ambient_walk) // idk how much
        this.endState(state);
    }

} else if (state == "MOVE FORWARD"){
    if (count > 0){ // [counter]
        mov["x"] = 1
        this.decState(state)
    }
    else { // [pass]
        this.registerState("SCAN FORWARD", this.scan_angle)
        this.endState(state);
    }
} 

else if (state == "UNDO SCAN"){
    if (count > 0){ // [counter] 
        // this.registerState("BLOCKED", 1000000000000000000000)
        // return mov;

        if (this.scan_angle != 1){  // don't bother
        mov['heading'] = -1; this.added_heading -= 1;
        }
        this.decState(state)
        
    }
    else { // [pass]
        // no registering state
        this.endState(state);
    }
}

else if (state == "BLOCKED"){
    if (count > 0){ // [counter] 
        // ================== go left?
        // let ranges = [this.AInRange(posMod(this.heading, 360), 360]

        // this.registerState("TURN LEFT", 10)
        // this.registerState("SCAN FORWARD", this.scan_angle)
        // this.registerState("MOVE FORWARD", this.ambient_walk)
        // this.registerState("TURN RIGHT", 90)
        
        // this.endState(state);   
        // ==================


    }
    else { // [pass]
        this.registerState("SCAN FORWARD", this.scan_angle)
        this.endState(state);
    }
} // ------------------------------------------------------
else if (state == "SCAN LEFT"){ // pretty much same as other scans btw
    if (count > 0){ // [counter] for this process
    this.rangesCurrent = "LEFT"
    let did_it_hit = this.analyseGeneralRays(...this.ranges["LEFT"])
    if (did_it_hit){ // [continue]
        if (this.scan_angle != 1){  // don't bother
            mov['heading'] = 1; this.added_heading += 1; // turn left 
        }
        this.decState(state)
    } else { // [interrupt]
        let add = this.scan_angle - this.states[state] // pass counter to undo rotation
        this.registerState("UNDO SCAN", add) // p.s. this would effectively do nothing if scan_angle = 1
        this.registerState("SCAN RIGHT") // next stage
        this.endState(state);
    }}
    else { // [pass]
        this.registerState("UNDO SCAN", this.scan_angle)
        this.registerState("MOVE LEFT", this.ambient_walk)
        this.endState(state);
    }
}
else if (state == "SCAN RIGHT"){ 
    if (count > 0){ // [counter] for this process
    this.rangesCurrent = "RIGHT"
    let did_it_hit = this.analyseGeneralRays(...this.ranges["RIGHT"])
    if (did_it_hit){ // [continue]
        if (this.scan_angle != 1){  // don't bother
            mov['heading'] = 1; this.added_heading += 1; // turn left 
        }
        this.decState(state)
    } else { // [interrupt]
        let add = this.scan_angle - this.states[state] 
        this.registerState("UNDO SCAN", add)
        this.registerState("BLOCKED", 100000000) // you promise no backtracking 😡
        this.endState(state);
    }}
    else { // [pass]
        this.registerState("UNDO SCAN", this.scan_angle)
        this.registerState("MOVE RIGHT", this.ambient_walk)
        this.endState(state);
    }
}
else if (state == "MOVE LEFT"){
    if (count > 0){ // [counter]
        mov["y"] = 1
        this.decState(state)
    }
    else { // [pass]
        this.registerState("SCAN FORWARD", this.scan_angle)
        this.endState(state);
    }
} 
else if (state == "MOVE RIGHT"){
    if (count > 0){ // [counter]
        mov["y"] = -1
        this.decState(state)
    }
    else { // [pass]
        this.registerState("SCAN FORWARD (RIGHT)", this.scan_angle)
        this.endState(state);
    }
}
else if (state == "SCAN FORWARD (RIGHT)"){
    if (count > 0){ // [counter] for this process
    this.rangesCurrent = "FORWARD"
    let did_it_hit = this.analyseGeneralRays(...this.ranges["FORWARD"])
    if (did_it_hit){ // [continue]
        if (this.scan_angle != 1){  // don't bother
            mov['heading'] = 1; this.added_heading += 1; // turn left
        }
        this.decState(state)
    } else { // [interrupt]
        let add = this.scan_angle - this.states[state] 
        this.registerState("UNDO SCAN", add)
        // [B1] right bias
        this.registerState("SCAN RIGHT") // next stage
        this.endState(state);
    }}
    else { // [pass] counter over - it's safe
        this.registerState("UNDO SCAN", this.scan_angle)
        this.registerState("MOVE FORWARD", this.ambient_walk) // idk how much
        this.endState(state);
    }

} 

// unused?
else if (state == "TURN LEFT"){
    if (count > 0){ // [counter] 
        mov['heading'] = 1; this.added_heading += 1;
        this.decState(state)
    }
    else { // [pass]
        this.endState(state);
    }
}

else if (state == "TURN RIGHT"){
    if (count > 0){ // [counter] 
        mov['heading'] = -1; this.added_heading -= 1;
        this.decState(state)
    }
    else { // [pass]
        this.endState(state);
    }
}

return mov;
}




}

class ObsctaclesManager{

    constructor(canvasSize, size=[300,300], loc=[0, 200], seed=random(0, 100)){ // don't use "self"
        this.canvasSize = canvasSize;
        this.loc = loc;
        this.scale = [2, -2];  // ⚠️

        this.size = size;      // ✅
        this.loc = loc;        // ✅
        this.partsize = 7;    // ⚠️
        this.seed = seed;      // ✅
        // this.randomise = true        
        this.maze_arr = []; //Array.from({ length: height }, () => Array(width).fill(0));
        this.howmany = 50;      // ✅

        this.test()

    }
    // Draw then copy ob.maze_arr object in the console and paste here
    test(){ 
        this.maze_arr = [[-120,116],[-120,137],[-122,161],[-122,180],[-98,183],[-68,183],[-48,183],[-23,183],[-4,186],[19,183],[38,184],[61,188],[119,186],[121,170],[120,148],[119,127],[119,198],[119,222],[118,233],[62,206],[62,225],[118,253],[90,275],[88,290],[89,303],[84,310],[65,320],[48,331],[30,343],[-58,340],[-38,352],[-25,368],[-11,383],[1,392]]
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
        // console.log('sum', x, y)
        this.maze_arr.push([x, y]);
    }
    assign(rb){ this.rb = rb; }
    summonKeyHandler(x, y){
        angleMode(DEGREES)
        var newX, newY;
        if (rb.follow_toggle){
            let dx = (x  - this.canvasSize[0]/2   -this.rb.view[0])
            let dy = (y  - this.canvasSize[1]/2   -this.rb.view[1])

            // (436, 0) = (62, 0), robot = (0, 0), width/2 = 320, screen_width/2 = 160 (2x scaled down)
            newX = this.rb.loc[0] 
                + (dx * cos(-this.rb.heading ) - dy * sin(-this.rb.heading))/this.scale[0]
            newY = this.rb.loc[1]
                + (dx * sin(-this.rb.heading) + dy * cos(-this.rb.heading))/this.scale[1] 

        } else {
            newX = x - this.canvasSize[0]/2   -this.rb.view[0];
            newY = y - this.canvasSize[1]/2   -this.rb.view[1];
            newY *= -1 // i flipped the view with scale(1, -1)
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
/*

    😱😱😱😱 p.s. i got the angles in reverse order, oops

                 70                                 -70
                  |                                  |              
    [0,   30,  60,  90,  120, 150, 180, 210, 240, 270, 300, 330, 360] <- (CCW) ⚠️ ignore last one, remove from list
     0    1    2    3    4    5    6    7    8    9    10   11   12
    [360, 330, 300, 270, 240, 210, 180, 150, 120, 90,  60,  30]      <- from my POV (CW)
     0    1    2    3    4    5    6    7    8    9    10   11  
                  |                                  |              
                70 (left, first)                290/-70 (right, last) (CCW)

    i * scan_angle  len(rays)

    posMod(floor(this.vert_angle / this.scan_angle), 12)

    scan so that (CCW)
        270 -> 300, only 290-300 must be clear
        300 -> 330, all must be clear
        330 -> 360, all must be clear 
        0  -> 30, all must be clear  <--- ⚠️ if fwd smaller than 30, modify to min later
        30 -> 60, all must be clear
        60 -> 90, only 60-70 must be clear

    // ⚠️ assuming heading adds to left
    // ⚠️ before doing anything, %, add 360°, % lazily so the ranges work properly
    analyseFirstRay()
        # find where 65 lies on the indices line as a float
            wanted id * scan 30 = vert 70
        # floor it
            id = 2.333 = 2
        # fit within 0 - 11 indices (%12)
            id = id%12

        id = 2     correspond to first angle before/equal <= -70°/290° from my POV (CW)
        start = 60°   ❗(= id * scan 30°)   
        target = 70°    (= vert)   ⚠️ idk yet
        current = start + added heading
        consider = if (start <= current <= target)
        if (consider){
            if (ray[id] < hit_dist){ return false }
            return true
        }
        return true // not considered

    analyseLastRay()
        # find where -70/290 lies on the indices line as a float
            wanted id * scan 30 = vert 290
        # floor it
            id = 9.667 = 9
        # fit within 0 - 11 indices (%12)
            id = id%12

        id = -3 or 9           correspond to last angle before/equal <= 70° from my POV (CW)
        start = 270°   ❗(= id * scan 30)   
        target = 300°     (= start + scan 30)
        actual start = 290° (= 360° - vert)  ⚠️ idk yet
        current = start + added heading
        consider = if (actual start <= current <= target) <-- 2nd constrains
        if (consider){
            if (ray[id] < hit_dist){ return false }
            return true
        }
        return true // not considered

    analyseMiddleRays()
        copy from above to find range
        id = [-3+1 to 2-1] 

        for (let i = id[0]; i <= id[1]; i++){
            let t_id = i%12
            start = t_id * scan
            target = start + scan

            current = start + added heading
            consider = start <= current <= target // technically don't need
            if (ray[id] < hit_dist){ return false }                
        }
        return true // once all passed, safe
*/

/*  HOW TO SCAN WITHIN CERTAIN RANGE GENERAL FUNCTION BECAUSE I AM VERY INSISTENT
    [0,   30,  60,  90,  120, 150, 180, 210, 240, 270, 300, 330]
     0    1    2    3    4    5    6    7    8    9    10   11 
                                      |         |
                                     id 1      id 2
    can use the full array list but im really really stubborn
    Ex: input range 190° - 250° (CCW)

    // Range of IDs:
    let s = floor([190] / this.scan_angle)
    let e = floor([250] / this.scan_angle) 

    let i = 0
    while(i != e){ // make sure it increments in the right direction
        let check = false;
        let id = i%12; // correction, use posMod
        let start = this.scan_angle * (id);
        let target = this.scan_angle * (id+1)%12;
        let current = this.scan_angle * (id) + this.added_heading
        // 180: only consider 190 - 210
        if ((i == s) && ([190] <= current <= target)){ check = true; }
        // 240: only consider 240 - 250
        else if ((i == e) && (start <= current <= [250])){ check = true; }
        // in between: consider the full range
        else { check = true; }

        if (check && (this.raysTemp[id] < this.hit_dist)){
            console.log('Hit', id, start, current, target, r_id); // 🧪
            return false;
        }
        i++;
    }

*/
