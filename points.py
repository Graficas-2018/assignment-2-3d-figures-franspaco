import math

def d2r(val):
    return (val/180)*math.pi

for d in range(0, 360, 72):
    print(f"{math.cos(d2r(d))}, 0.0, {math.sin(d2r(d))},")