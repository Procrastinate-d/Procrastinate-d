import math
import random
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image    # visuaization
# https://www.scratchapixel.com/lessons/procedural-generation-virtual-worlds/procedural-patterns-noise-part-1/creating-simple-1D-noise.html

if False:  # unnecessary testing for permutations later
    myRange = [[0, 0], [20, 10]]
    x0, y0, x1, y1 = myRange[0][0], myRange[0][1], myRange[1][0], myRange[1][1]
    xArr, yArr = [], []
    x = x0
    while x <= x1:
        plt.plot([x, x], [y0, y1]) # columns
        y = y0
        while y <= y1:
            plt.plot([x0, x1], [y, y]) # rows
            y+=1
        x+=1
    x = x0
    while x <= x1:
        y = y0
        while y <= y1:
            xArr.append(x); yArr.append(y)
            # if x == x1 or y == y1: # last row and last column to loop back around

            y+=1
        x+=1
    plt.plot(xArr, yArr, color='black', marker='o', markersize='3', linestyle='none')
    plt.show()
    exit()

def easeSin(t):
    return -(math.cos(math.pi * t) -1)/2.
def smoothie(t): # smoothstep function 6x^5 - 15x^4 + 10x^3
    return t * t * t * (t * (t * 6 - 15) + 10)
def smoothie2(t):
    return t * t * t * (3 - 2 * t)
def lerp1D(s, e, t): return (e-s)*t+s # t betw/ 0 to 1
# return lerp2D(c00, c10, c01, c11, sx, sy)
# def lerp2D(c00, c10, c01, c11, tx, ty): 
#     x0 = (c10-c00)*tx+c10
#     x1 = (c11-c01)*tx+c01
#     return (x1-x0)*ty+x0

# 1D Noise...
myRange = [-15, 45]
steps = 100
REPEAT_ = 20
def noiseBase1(seed=None, maxX=REPEAT_):
    fixedArray = np.zeros((maxX)) # 1D array
    if seed is not None: random.seed(seed) 
    for x in range(maxX): fixedArray[x] = random.random()
    return fixedArray
fixedArray = noiseBase1(seed=0)

def noise1D(x):
    xi = math.floor(x)
    refX1 = xi%REPEAT_ # has to be integer
    refX2 = refX1+1
    if (refX2 == REPEAT_): refX2 = 0 # wrap around
    t = x - xi
    # if (t > 1) or (t < 0): print('impossible')
    newt = smoothie(t)
    n = lerp1D(fixedArray[refX1], fixedArray[refX2], newt)
    # n2 = lerp1D(fixedArray[refX1], fixedArray[refX2], t)
    # plt.plot(x, n2, color='blue', marker='o', markersize=2)
    return n

def interRange(myRange, steps, layer=3, rate=2.):
    s, e = myRange[0], myRange[1]
    plotMeX = []; plotMeY = []

    divider = 0 
    for i in range(layer): divider += 1/(rate**i)
    
    for i in range(steps+1):
        x = 1.0*i*(e-s)/steps + s # linspace in disguise
        n = 0
        # n = noise1D(x)
        for i in range(layer):
            n += noise1D(x*(rate**i))/(rate**i)

        if divider != 1.: n /= divider # is this fbm? how to normalize betw/ 0-1 lol?
        plotMeX.append(x); plotMeY.append(n)
    return plotMeX, plotMeY

def test1DNoise():
    rate = 2. # intended to be >=1
    plotMeX, plotMeY = interRange(myRange, steps, layer=30, rate=rate)
    plt.plot(plotMeX, plotMeY, marker='o', markersize=2, markeredgecolor='black', color='grey')
    plotMeX, plotMeY = interRange(myRange, steps, layer=5, rate=rate)
    plt.plot(plotMeX, plotMeY, marker='o', markersize=2, markeredgecolor='maroon', color='red')
    plotMeX, plotMeY =  interRange(myRange, steps, layer=3, rate=rate)
    plt.plot(plotMeX, plotMeY, marker='o', markersize=2, markeredgecolor='darkgreen', color='green')
    plotMeX, plotMeY =  interRange(myRange, steps, layer=1, rate=rate)
    plt.plot(plotMeX, plotMeY, marker='o', markersize=2, markeredgecolor='darkblue', color='royalblue')
    plt.show()
# test1DNoise()
# exit()
# OK SO
# For a given seed and coordinates, we expect the same field of random vectors.
# After setting random seed, the value is dependent on the number of times random is called.
# Ideally, the noise of a 3x3 grid should look the same as in a 3x4 grid of the same seed.
# Hence, besides seed, the base size of the grid is also a factor.
# By setting a fixed grid size, any value beyond the grid can be tiled. (may not be desired)
# There's also a fixed easing function in "fade".

# 2D Noise...
myRange = [[0, 0], [200, 200]]  # bottom left, top right. weird things happen with -ve
REPEAT_ = [256, 256]
frequency = 0.06 # smaller = chunkier, bigger (past 1) = it's tiles again?!

def noiseBase2(seed=None, maxX=REPEAT_[0], maxY=REPEAT_[1]):
    fixedArray = np.zeros((maxX, maxY)) # 2D array
    if seed is not None: random.seed(seed)  # assuming number
    for y in range(maxY):
        for x in range(maxX):
            fixedArray[x][y] = random.random() # w- what happened to gradient vectors?
    return fixedArray
fixedArray = noiseBase2(seed=0) # map

def noise2D(x, y):
    xi = math.floor(x)
    yi = math.floor(y)
    tx = x - xi  # change to y1 for funky results
    ty = y - yi
    
    refX1 = xi%REPEAT_[0] # has to be integer
    refX2 = refX1+1
    if (refX2 == REPEAT_[0]): refX2 = 0 # wrap around
    refY1 = yi%REPEAT_[1]
    refY2 = refY1+1
    if (refY2 == REPEAT_[1]): refY2 = 0

    c00 = fixedArray[refX1][refY1]  # either do 1 long array or (x, y). to be replaced w/ permutation
    c10 = fixedArray[refX2][refY1]
    c01 = fixedArray[refX1][refY2]
    c11 = fixedArray[refX2][refY2]
    # if (tx > 1) or (tx < 0) or (ty > 1) or (ty < 0): print('impossible')
    newtx = smoothie(tx)
    newty = smoothie(ty)
    nx0 = lerp1D(c00, c10, newtx) # 2D interpolation
    nx1 = lerp1D(c01, c11, newtx)
    return lerp1D(nx0, nx1, newty)

def generateImage(myRange, layer=5, rate=2., single=False):
    sizeRange = [myRange[1][0] - myRange[0][0], myRange[1][1] - myRange[0][1]]
    # offsetRange will be the bottom left coordinate
    pixels = np.zeros((sizeRange[0], sizeRange[1], 3), dtype=np.uint8) # width x height x color (grey) cannot be bothered to use lists :) 
    
    divider = 0 
    for i in range(layer): divider += 1/(rate**i)

    for x in range(sizeRange[0]):
        for y in range(sizeRange[1]):
            newx = x+myRange[0][0]
            newy = y+myRange[0][1]
            n = 0  # ====== Fun =====
            if single: # just wanna see for one layer :)   it looks darker... (i didn't normalize this)
                newF = frequency*rate**(layer-1)
                n = noise2D(newx*newF, newy*newF)/(rate**(layer-1))
            else: 
                for i in range(layer):
                    newF = frequency*rate**i #frequency/(i+1)
                    n += noise2D(newx*newF, newy*newF)/(rate**i)
                if divider != 1.: n /= divider
            # ================

            c = (n * 255)
            pixels[newx][newy] = (c, c, c)
    img = Image.fromarray(pixels) 
    img.save('./noiseSample.png')

generateImage(myRange)
# To be continuned hahaha

"""
What's the divider for? The output isn't normalized >:(

Amateur eqn
x to inf, y to 1, rate 1        => 0     
x to inf, y to 2, rate 2        => 1     (1/1)  ==> -1/x + 2
x to inf, y to 1.5, rate 3      => 0.5   (1/2)
x to inf, y to 1.333, rate 4    => 0.333 (1/3)
x to inf, y to 1.25, rate 5     => 0.25  (1/4)  ==> w/ 1/(rate-1)
 n /= -(1./layer) + (1/(rate-1) + 1)
nvm this doesnt work because i realize the rest of the fractions are missing 🫠
after fixing it, some white pixels became black and the whole thing got darker

Min-Max is affected by adding extra layers
R  L1   L2    L3     L4      L5    
1  1  + 1/1 + haha you get it
2  1  + 1/2 + 1/4  + 1/8   + 1/16 + ...
3  1  + 1/3 + 1/9  + 1/27  + 1/81
4  1  + 1/4 + 1/16 + 1/64  + 1/256
5  1  + 1/5 + 1/25 + 1/125 + 1/625

Ex: R2 L2 is 1.5x so should be /1.5.
is there an easy way to calculate partial sum? since it's infinite i presume not...
"""
