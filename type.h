#ifndef TYPES_H
#define TYPES_H

#define WIDTH 60
#define HEIGHT 20
#define MAX_SHAPES 100

typedef enum {
    SHAPE_LINE,
    SHAPE_RECTANGLE,
    SHAPE_CIRCLE,
    SHAPE_TRIANGLE
} ShapeType;

typedef struct {
    int id;
    ShapeType type;
    int p1, p2, p3, p4, p5, p6; // General properties for shapes:
    /* 
     * Line:      p1=x1, p2=y1, p3=x2, p4=y2
     * Rectangle: p1=x,  p2=y,  p3=w,  p4=h
     * Circle:    p1=cx, p2=cy, p3=r
     * Triangle:  p1=x1, p2=y1, p3=x2, p4=y2, p5=x3, p6=y3
     */
} Shape;

#endif // TYPES_H