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
    if (myTargetVariables.targetLength > elements.length) { return false; }   /* does not meet length requirement. */
    return true; }
function waitPresent1(myTargetVariables){ // at least one
    if (myTargetVariables.elements == null){ return false; };
    return true;
}

var waitsettings = {timer:30, targetLength: 1, verbose: false};
class CharacterFinderUI{
    attach(gn){
        this.gn = gn

        this.inputText.then(e => { this.inputText = e
        this.scrollList.then(e => { this.scrollList = e;
            gn.updateList({"search": ""});
            this.updateList2(); 
        })
        this.inputText.addEventListener("input", (event) => { 
            gn.updateList({"search": event.target.value});
            this.updateList2(); });

        });

        this.inputTagText.then(e => {this.inputTagText = e;
            this.inputTagText.addEventListener("input", (event) => { 
            gn.updateList({"tag": event.target.value});
            this.updateList2(); });
        });

        this.tagDropdown.then(e => {this.tagDropdown = e;
            var [tagOptions, count] = gn.loadTags(this.ePrefix+"tagOptions")

            this.tagDropdown.innerHTML = tagOptions
            this.tagOptions = this.WTL(this.WPS, {timer:30, targetLength: count, verbose: false}, e, `[class*="${this.ePrefix+"tagOptions"}"]`, false);
                
            
            this.tagOptions.then(e => {this.tagOptions = e;
                for (let oi = 0; oi < this.tagOptions.length; oi++){
                    this.tagOptions[oi].addEventListener("click", (event) => { 
                        gn.updateList({"tag": event.target.value});
                        this.updateList2(); 
                    });
                }
            });
        });

    }

    constructor(parent){
        // create a input text area...
        this.WTL = waitToLoad.bind(this); 
        this.WPS = waitPresent.bind(this);
        this.WP = waitPresent1.bind(this);
        this.WS = waitsettings;

        const ePrefix = "ELEMENT_"+this.constructor.name+"_"; this.ePrefix = ePrefix;
        this.parent = parent;

this.parent.innerHTML=
String.raw`
        <input type="text" class=${ePrefix+"inputText"} placeholder="Search term"></input></br>
        <input type="text" class=${ePrefix+"inputTagText"} placeholder="Tag filter"></input>
        <select class=${ePrefix+"tagDropdown"}></select>
        <br>
        <div class=${ePrefix+"scrollList"}>loading...</div>
        `;

this.inputText = this.WTL(this.WP, this.WS, this.parent, `[class*="${ePrefix+"inputText"}"]`);
this.inputTagText = this.WTL(this.WP, this.WS, this.parent, `[class*="${ePrefix+"inputTagText"}"]`);
this.scrollList = this.WTL(this.WP, this.WS, this.parent, `[class*="${ePrefix+"scrollList"}"]`);
this.scrollList.then(e => { this.scrollList = e;   }); // required to update
this.tagDropdown = this.WTL(this.WP, this.WS, this.parent, `[class*="${ePrefix+"tagDropdown"}"]`);


}

    updateList2(){ // list is updated from CharacterFinder
/* Ex:
myDisplayList =
{"ℝ": ["real"],
"ℕ": ["natural number"],
"ℒ": ["Laplace", "curvy L"],
"∅": ["null", "empty set"],}
myTagList =
{"ℝ": ["discrete", "sets"],
"ℕ": ["discrete", "sets"],
"ℒ": ["AI"],
"∅": ["discrete"],}
*/
// console.log(this.myDisplayList)
// unordered lol

const ePrefix = this.ePrefix
// https://stackoverflow.com/questions/18679020/border-around-tr-element-doesnt-show
this.setHTML = '<table style="table-layout: fixed; border-collapse: collapse; ">'
for (const key of Object.keys(this.myDisplayList)){
    // console.log(key, this.myDisplayList[key])
    // create div. onclick event
 
    // when i nserting elements in a table, they get pushed out, how to disable? <table><div></div><tr></tr></table> becomes <div></div><table><tr></tr></table>
    this.setHTML += `<tr class="${ePrefix+"scrollElement_"+key}"><td style="min-width: 150px; max-width: 150px; text-align: center">${key}</td><td>${this.myDisplayList[key].join(" / ")}</td><td id="copyhack" style="display:none"><input value="${key}"></div></input></tr>`;
}

this.scrollList.innerHTML = this.setHTML+"</table>";

// console.log(this.scrollList, this.scrollList.innerHTML)

this.previouslySelected = null;
this.assigningHolder = [];
for (const key of Object.keys(this.myDisplayList)){
    // console.log(key)

    this.assigningHolder.push(this.WTL(this.WP, this.WS, this.parent, `[class*="${ePrefix+"scrollElement_"+key}"]`)); 
    this.assigningHolder[this.assigningHolder.length-1].then(e => { 
        
        this.assigningHolder[this.assigningHolder.length-1] = e
        let target = e.querySelector('td[id="copyhack"] > input') // first for copying
        // ⚠️ i fear the garbage collector
        e.addEventListener("click", (event) => { 
            // console.log("copy", target)
            // doesn't work on tr ;-;
            target.select();
            target.setSelectionRange(0, 99999); 
            navigator.clipboard.writeText(target.value);  //"DOMException: Clipboard write is not allowed."           

            
            if (this.previouslySelected != null){
                this.previouslySelected.setAttribute("style", "")
            }
            e.setAttribute("style", "border: 1px solid green;") 
            this.previouslySelected = e 
            // console.log(this.previouslySelected)

        });

        });
}
// console.log(this.assigningHolder)
}

}

class CharacterFinder{
    attach(gui){
        this.gui = gui
    }
    constructor(){
        this.searchStr = "";    
        this.WTL = waitToLoad.bind(this); 
        this.WP = waitPresent1.bind(this);
        this.WS = waitsettings;

        this.createDict(dict);
    }
    createDict(dict){
        var newDict = {"": [], "~~unnamed": []};

        var searchList = ["~~unnamed"];
        var tagDict = {"": []};
        
        var charDict = {}
        
        var tmp = dict.split('\n')
        for(let li = 0; li < tmp.length; li++){ // for each row in txt/csv
            let row = tmp[li]
            if (row == "" || row == undefined){ continue; } // blank
            row = row.split("\t")

            var ri = 0;
            let stage = 0;
            // 0: add keys, 1: set search terms as keys, 2: tags
            // add search term list, ordered by alphabet
            var keyList = [];

            // var isPresent = [false, false, false];
            while (ri < row.length){ // for each term...
                // console.log(ri)
                let word = row[ri]
                ri += 1;
                // await new Promise(r => setTimeout(r, 50)); // add async to see

                // if ((word=="") && (ri == row.length)){ stage = 0; break; } // you didn't do \t\t properly?
                if (word == ""){ 
                    stage += 1; 
                    continue; } // lazy /t/t separator
                if (stage > 0){ word = word.trim().trimStart();  } // remove first and last characters that are just whitespace
                // console.log(word)

                if (stage == 0){
                    // isPresent[0] = true
                    keyList.push(word);

                    if (!(word in charDict)){ // to deal with unnamed
                        charDict[word] = false // it's just a set
                    }
                
                } else if (stage == 1){
                    // isPresent[1] = true
                    if (! (word in newDict)){
                        searchList.push(word)
                        newDict[word] = []
                    }
                    newDict[word].push(...keyList) // need to copy or not? 


                    for(let ri = 0; ri < keyList.length; ri++){// to deal with unnamed
                       charDict[keyList[ri]] = true
                    } // redundancies may trigger multiple times
                    
                    // α[alpha] and 𝛼[alpha] expand the list otherwise it combines stuff
                } else {
                    // isPresent[2] = true

                    if (! (word in tagDict)){
                        tagDict[word] = []
                    }
                    tagDict[word].push(...keyList)

                    
                }
                
            }

            // if (isPresent[0] && !isPresent[1]){ // when your formatting sux (you didn't add \t\t)
            //     if (! ("~~unnamed" in newDict)){
            //     searchList.push("~~unnamed")
            //     newDict["~~unnamed"] = []
            //     }
            //     newDict["~~unnamed"].push(...keyList) // previous approach
            // }

        }
        // how to deal with unnamed? my previous approach didn't work that well due to redundant lines (which i expect and allow to have)
        for (const key of Object.keys(charDict)){
            if (!charDict[key]){ 
                
                newDict["~~unnamed"].push(key) 
            }

        }
        

        // console.log(searchList, newDict)
        searchList.sort()
        this.myDictionary = newDict
        this.searchlist = searchList
        this.tagDict = tagDict
        this.charDict = charDict
    }  
    
    updateList(searchDict){
        // console.log(help.value)  // value is only updated AFTER 😡😡😡😡😡😡😡😡😡😡😡😡
        // this.searchStr += help.data
        // need to get position of uhhhh key cuz idk if they select del or backspace... or select all...
        // console.log(help.data)
        // that sounds way too complicated rn just uh wait a while
    
        // nvm https://stackoverflow.com/questions/51144965/javascript-input-event-value-is-undefined
        // console.log(help.target.value)
        // let search = searchText.target.value
        // let searchedList = [];
        let myDisplayList = {};
        // let myDisplayOrder = [];

        // replace old so i don't have to deal with how to get value from input every time one of the inputs is updated
        if (this.searchDict == undefined){this.searchDict = {"tag": "", "search": ""}}
        for (const key of Object.keys(searchDict)){
            if (key in this.searchDict){
                this.searchDict[key] = searchDict[key]

            }
        }
        
        let tag = this.searchDict["tag"]

        // console.log(this.tagDict, tag)

        var search = this.searchDict["search"]
        search = search.toLowerCase()        
        for(let li = 0; li < this.searchlist.length; li++){
            // console.log(this.searchlist[li])
            // ⚠️  searching words within words
            if ((this.searchlist[li].indexOf(search) > -1) || (search == "") ){ // could be optimized :|
                // console.log(this.searchlist[li])

                var keyList = this.myDictionary[this.searchlist[li]]
                for(let ki = 0; ki < keyList.length; ki++){ 

                    if ((tag == "") || ((tag in this.tagDict) && (this.tagDict[tag].indexOf(keyList[ki]) > -1))){
                        if (! (keyList[ki] in myDisplayList)){
                            myDisplayList[keyList[ki]] = []

                        }
                        // whatever you want


                        myDisplayList[keyList[ki]].push(this.searchlist[li])
                    
                    }
                }
                // searchedList.push( this.searchlist[li] )
            }
        }
        
        this.gui.myDisplayList = myDisplayList;
    }

    loadTags(my_identifier){
        var returnStr = "";
        let count = 0;
        for (const key of Object.keys(this.tagDict)){
            returnStr += `<option class="${my_identifier}" value="${key}">${key}</option>`
            count += 1;
        }
        return [returnStr, count];
    }

}

/*
I have
search input that dynamically updates a list below
list prioritizes 
copies (when clicked) or ~(highlighted and enter is pressed)~ nvm tab doesn't work


I need:
excel support or some csv format
toggle sorting
bonus select multiple words "&" (BUT I HAVE NO TIME FOR THAT)
integration with latex or other formulas and a switch to turn it off: [symbols only] / [formulas only] / [all]
4th column for helpful links/explanation

i don't need p5.js for this, do I?
*/

dict = String.raw`
⤴\t⬏
⤵\t⬎
⬐\t↩
⇀\t ⃑\t\t harpoon \t vector \t ->
⟲\t\t anti-clockwise\tcounter-clockwise\tCCW
⟳\t\t clockwise\tCW
↔\t\t left right arrow\tbiconditional\thorizontal
↕\t\t up down arrow \t vertical
→\t\t right arrow \t towards \t approaches \t implication \t ->
↑\t\t up arrow \t upwards \t increase \t above
↓\t\t down arrow \t downwards \t decrease \t below
←\t\t left arrow
↘\t\t down right arrow \t bottom right
↙\t\t down left arrow \t bottom left
↗\t\t up right arrow
↖\t\t up left arrow
¬\t\t negation \t\t logic
∧\t\t conjunction \t\t logic
∨\t\t disjunction \t\t logic
⋅\t\t dot
∀\t\t universal quantifier \t for all \t\t logic
∃\t\t existential quantifier \t there exists \t\t logic
∈\t\t element of \t member of \t\t logic
∉\t\t not element of \t\t logic
∪\t\t union \t\t logic
∩\t\t intersection \t\t logic
⊂\t\t subset \t\t logic
⊆\t\t subset \t subset or equal \t\t logic
⊃\t\t superset \t\t logic
⊇\t\t superset \t subset or equal
⊕\t\t xor\t\t logic
⌊ ⌋\t\t floor \t\t logic
⌈ ⌉\t\t ceil \t\t logic
µ\t𝜇\t\t micro \t permeability \t mu
π\t𝜋\t\t pi symbol \t pie
Π\t\t large pi \t multiplication
∞\t\t infinity
≡\t\t triple equal \t defined as
−\t\t minus
±\t\t plus minus \t +-
∓\t\t minus plus \t -+
≈\t\t almost equal \t nearly \t close to \t around
≃\t\t almost or equal
≠\t\t not equal \t unequal
√\t\t sqrt
μ\t\t micro \t\t units
ε\t\t epsilon
∫\t\t integral
∲\t\t closed integral \t cyclic integral \t\t thermodynamics
α\t𝛼\t\t alpha \t\tmath
β\t𝛽\t\t beta \t\tmath
λ\t𝜆\t\t lambda\t\tmath
τ\t\t tau
Δ\tδ\t\t delta \t rate of change of \t\tmath\tderivative
∂\t𝜕\t\t partial derivative  \t\tmath\tderivative
∇\t\t nabla \t gradient \t\tmath\tderivative
γ\t\t gamma
θ\t𝜃\t\t theta\t\ttrigonometry
°\t\t degree \t\ttrigonometry
Σ\tσ\t\t sigma \t sum \t sigmoid \t standard deviation
𝜑\tΦ\tϕ\t\t phi \t flux
𝜂\tη\t\t eta \t learning rate \t efficiency \t\t thermodynamics
Ω\tω\t\t omega \t ohm \t\t electricity
𝜉\t\t Xi
ℝ\t\t real \t\tset theory
ℕ\t\t natural number \t\tset theory
ℒ\t\t Laplace \t curvy L
∅\t\t null \t empty set \t\tset theory \t\tlogic
≥\t\t more than \t greater than \t equal to \t >= \t =>
≤\t\t less than \t equal to \t <= \t =<
∝\t\t proportional
⊙\t\t element-wise operation \t out of page \t\t electricity
✖\t✗\t✘\t\t wrong \t cross
×\t\tmultiplication\t cross\t\tmath
⋮\t\tvertical ellipsis\t\tmatrices
⭙\tꕕ\t⨂\t⦻\t\t into page \t\t electricity
𝐴\t\ta


𝐀\t𝐁\t𝐂\t𝐃\t𝐄\t𝐅\t𝐆\t𝐇\t𝐈\t𝐉\t𝐊\t𝐋\t𝐌\t𝐍\t𝐎\t𝐏\t𝐐\t𝐑\t𝐒\t𝐓\t𝐔\t𝐕\t𝐖\t𝐗\t𝐘\t𝐙\t\t\t\tmath\tmathematical alphanumeric symbol (uppercase)
𝐚\t𝐛\t𝐜\t𝐝\t𝐞\t𝐟\t𝐠\t𝐡\t𝐢\t𝐣\t𝐤\t𝐥\t𝐦\t𝐧\t𝐨\t𝐩\t𝐪\t𝐫\t𝐬\t𝐭\t𝐮\t𝐯\t𝐰\t𝐱\t𝐲\t𝐳\t\t\t\tmath\tmathematical alphanumeric symbol (lowercase)

𝐢\t𝐣\t𝐤\t\t\t\tvector
𝐢\t\tunit vector i
𝐣\t\tunit vector j
𝐤\t\tunit vector k


e^(i𝜋)\te^i𝜋\te^i𝜋 + 1 = 0\t\teuler's identity\t\tmath
∟
∠
∡
∢
⊾
⊿
⋕
⟂\t⊥\t\t perpendicular
∤
∥\t\t parallel
∦\t\t not parallel

∷
∴
∵
∎
𝒜\t\t~Fancy A
ℬ\t\t~Fancy B
𝒞\t\t~Fancy C
𝒟\t\t~Fancy D
ℰ\t\t~Fancy E
ℱ\t\t~Fancy F
𝒢\t\t~Fancy G
ℋ\t\t~Fancy H
ℐ\t\t~Fancy I
𝒥\t\t~Fancy J
𝒦\t\t~Fancy K
ℒ\t\t~Fancy L
ℳ\t\t~Fancy M
𝒩\t\t~Fancy N
𝒪\t\t~Fancy O
𝒫\t\t~Fancy P
𝒬\t\t~Fancy Q
ℛ\t\t~Fancy R
𝒮\t\t~Fancy S
𝒯\t\t~Fancy T
𝒰\t\t~Fancy U
𝒱\t\t~Fancy V
𝒲\t\t~Fancy W
𝒳\t\t~Fancy X
𝒴\t\t~Fancy Y
𝒵\t\t~Fancy Z

𝒜\tℬ\t𝒞\t𝒟\tℰ\tℱ\t𝒢\tℋ\tℐ\t𝒥\t𝒦\tℒ\tℳ\t𝒩\t𝒪\t𝒫\t𝒬\tℛ\t𝒮\t𝒯\t𝒰\t𝒱\t𝒲\t𝒳\t𝒴\t𝒵\t\t\t\tFancy (uppercase)
𝓪\t𝓫\t𝓬\t𝓭\t𝓮\t𝓯\t𝓰\t𝓱\t𝓲\t𝓳\t𝓴\t𝓵\t𝓶\t𝓷\t𝓸\t𝓹\tc\t𝓻\t𝓼\t𝓽\t𝓾\t𝓿\t𝔀\t𝔁\t𝔂\t𝔃\t\t\t\t~bold cursive script (lowercase)
𝒶\t𝒷\t𝒸\t𝒹\t𝑒\t𝒻\t𝑔\t𝒽\t𝒾\t𝒿\t𝓀\t𝓁\t𝓂\t𝓃\t𝑜\t𝓅\t𝓆\t𝓇\t𝓈\t𝓉\t𝓊\t𝓋\t𝓌\t𝓍\t𝓎\t𝓏\t\t\t\t~cursive script (lowercase)

𝔸\t𝔹\tℂ\t𝔻\t𝔼\t𝔽\t𝔾\tℍ\t𝕀\t𝕁\t𝕂\t𝕃\t𝕄\tℕ\t𝕆\tℙ\tℚ\tℝ\t𝕊\t𝕋\t𝕌\t𝕍\t𝕎\t𝕏\t𝕐\tℤ\t\t\t\tdouble struck (uppercase)
𝕒\t𝕓\t𝕔\t𝕕\t𝕖\t𝕗\t𝕘\t𝕙\t𝕚\t𝕛\t𝕜\t𝕝\t𝕞\t𝕟\t𝕠\t𝕡\t𝕢\t𝕣\t𝕤\t𝕥\t𝕦\t𝕧\t𝕨\t𝕩\t𝕪\t𝕫\t\t\t\tdouble struck (lowercase)
𝟘\t𝟙\t𝟚\t𝟛\t𝟜\t𝟝\t𝟞\t𝟟\t𝟠\t𝟡\t\t\t\tdouble struck (numbers)


(╯°□°)╯︵ ┻━┻\t\ttable flip\t\ttroll
(⁄ ⁄•⁄ω⁄•⁄ ⁄)\t\tembarassed face\t\ttroll
(・_・;)\t\tnervous face\t\ttroll
¯\_(ツ)_/¯\t\tshrug face\t\ttroll
( ͡° ͜ʖ ͡°)\t\tlenny face\t\ttroll
`
// never needed to unraw a string before...
dict = dict.replaceAll('\\t', '\t')
// say copy(dict)

