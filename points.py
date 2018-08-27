import math

def d2r(val):
    return (val/180)*math.pi

for d in range(0, 360, 60):
    d += 30
    print(f"{math.cos(d2r(d))}, 1.0, {math.sin(d2r(d))},")



