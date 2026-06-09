#ifndef DRAWING_H
#define DRAWING_H

#include "types.h"

// Clear the canvas by filling it with the underscore ('_') character.
void clear_canvas(char canvas[HEIGHT][WIDTH]);

// Plot a pixel on the canvas (handles bounds checking safely).
void plot_pixel(char canvas[HEIGHT][WIDTH], int x, int y);

// Drawing algorithms
void draw_line(char canvas[HEIGHT][WIDTH], int x1, int y1, int x2, int y2);
void draw_rectangle(char canvas[HEIGHT][WIDTH], int x, int y, int w, int h);
void draw_circle(char canvas[HEIGHT][WIDTH], int cx, int cy, int r);
void draw_triangle(char canvas[HEIGHT][WIDTH], int x1, int y1, int x2, int y2, int x3, int y3);

#endif // DRAWING_H