import math
import random
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image    # visuaization
# https://www.scratchapixel.com/lessons/procedural-generation-virtual-worlds/procedural-patterns-noise-part-1/creating-simple-1D-noise.html
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
def lerp1D(s, e, t): return (e-s)*t+s # t betw/ 0 to 1
def easeSin(t):
    return -(math.cos(math.pi * t) -1)/2.
def smoothie(t): # smoothstep function 6x^5 - 15x^4 + 10x^3
    return t * t * t * (t * (t * 6 - 15) + 10)

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
interRange(myRange, steps)
