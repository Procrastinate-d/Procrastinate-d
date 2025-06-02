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
myRange = [30, 45]
steps = 200
REPEAT_ = 20
def perlinBase1(seed=None, maxX=REPEAT_):
    fixedArray = np.zeros((maxX)) # 1D array
    if seed is not None: random.seed(seed) 
    for x in range(maxX): fixedArray[x] = random.random()
    return fixedArray
fixedArray = perlinBase1(seed=0)

def interRange(myRange, steps):
    s, e = myRange[0], myRange[1]
    plotMeX = []; plotMeY = []
    for i in range(steps+1):
        x = 1.0*i*(e-s)/steps + s # linspace in disguise

        xi = math.floor(x)
        refX1 = xi%REPEAT_ # has to be integer
        refX2 = refX1+1
        if (refX2 == REPEAT_): refX2 = 0 # wrap around
        t = x - xi
        # if (t > 1) or (t < 0): print('impossible')

        newt = smoothie(t)
        n = lerp1D(fixedArray[refX1], fixedArray[refX2], newt)
        plotMeX.append(x); plotMeY.append(n)
        plt.plot(x, n, color='red', marker='o', markersize=2)
        # n = lerp1D(fixedArray[refX1], fixedArray[refX2], t)
        # plt.plot(x, n, color='blue', marker='o', markersize=2)
    plt.plot(plotMeX, plotMeY)
    plt.show()
# interRange(myRange, steps)

# OK SO
# For a given seed and coordinates, we expect the same field of random vectors.
# After setting random seed, the value is dependent on the number of times random is called.
# Ideally, the noise of a 3x3 grid should look the same as in a 3x4 grid of the same seed.
# Hence, besides seed, the base size of the grid is also a factor.
# By setting a fixed grid size, any value beyond the grid can be tiled. (may not be desired)
# There's also a fixed easing function in "fade".

# 2D Noise...
myRange = [[0, 0], [250, 250]]  # bottom left, top right. weird things happen with -ve
REPEAT_ = [256, 256]
frequency = 0.9  # smaller = chunkier, bigger = zebra

def perlinBase2(seed=None, maxX=REPEAT_[0], maxY=REPEAT_[1]):
    fixedArray = np.zeros((maxX, maxY)) # 2D array
    if seed is not None: random.seed(seed)  # assuming number
    for y in range(maxY):
        for x in range(maxX):
            fixedArray[x][y] = random.random() # w- what happened to gradient vectors?
    return fixedArray
fixedArray = perlinBase2(seed=0) # map

sizeRange = [myRange[1][0] - myRange[0][0], myRange[1][1] - myRange[0][1]]
# offsetRange will be the bottom left coordinate
pixels = np.zeros((sizeRange[0], sizeRange[1], 3), dtype=np.uint8) # width x height x color (grey) cannot be bothered to use lists :) 

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

for x in range(sizeRange[0]):
    for y in range(sizeRange[1]):
        n = noise2D((x+myRange[0][0])*frequency, (y+myRange[0][1])*frequency)
        c = n * 255
        pixels[x+myRange[0][0]][y+myRange[0][1]] = (c, c, c)
img = Image.fromarray(pixels) 
img.save('./perlinNoiseSample.png')
