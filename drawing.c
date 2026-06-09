#include "drawing.h"
#include <stdlib.h>

void clear_canvas(char canvas[HEIGHT][WIDTH]) {
    for (int y = 0; y < HEIGHT; y++) {
        for (int x = 0; x < WIDTH; x++) {
            canvas[y][x] = '_';
        }
    }
}

void plot_pixel(char canvas[HEIGHT][WIDTH], int x, int y) {
    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
        canvas[y][x] = '*';
    }
}

void draw_line(char canvas[HEIGHT][WIDTH], int x1, int y1, int x2, int y2) {
    int dx = abs(x2 - x1);
    int dy = -abs(y2 - y1);
    int sx = x1 < x2 ? 1 : -1;
    int sy = y1 < y2 ? 1 : -1;
    int err = dx + dy;
    int e2;

    while (1) {
        plot_pixel(canvas, x1, y1);
        if (x1 == x2 && y1 == y2) break;
        e2 = 2 * err;
        if (e2 >= dy) {
            err += dy;
            x1 += sx;
        }
        if (e2 <= dx) {
            err += dx;
            y1 += sy;
        }
    }
}

void draw_rectangle(char canvas[HEIGHT][WIDTH], int x, int y, int w, int h) {
    if (w <= 0 || h <= 0) return;
    
    // Draw top and bottom edges
    for (int i = 0; i < w; i++) {
        plot_pixel(canvas, x + i, y);
        plot_pixel(canvas, x + i, y + h - 1);
    }
    // Draw left and right edges
    for (int i = 0; i < h; i++) {
        plot_pixel(canvas, x, y + i);
        plot_pixel(canvas, x + w - 1, y + i);
    }
}

// Static helper to plot the 8 symmetric points of a circle
static void plot_circle_points(char canvas[HEIGHT][WIDTH], int cx, int cy, int x, int y) {
    plot_pixel(canvas, cx + x, cy + y);
    plot_pixel(canvas, cx - x, cy + y);
    plot_pixel(canvas, cx + x, cy - y);
    plot_pixel(canvas, cx - x, cy - y);
    plot_pixel(canvas, cx + y, cy + x);
    plot_pixel(canvas, cx - y, cy + x);
    plot_pixel(canvas, cx + y, cy - x);
    plot_pixel(canvas, cx - y, cy - x);
}

void draw_circle(char canvas[HEIGHT][WIDTH], int cx, int cy, int r) {
    if (r < 0) return;
    if (r == 0) {
        plot_pixel(canvas, cx, cy);
        return;
    }
    
    int x = 0;
    int y = r;
    int d = 3 - 2 * r;
    
    plot_circle_points(canvas, cx, cy, x, y);
    while (y >= x) {
        x++;
        if (d > 0) {
            y--;
            d = d + 4 * (x - y) + 10;
        } else {
            d = d + 4 * x + 6;
        }
        plot_circle_points(canvas, cx, cy, x, y);
    }
}

void draw_triangle(char canvas[HEIGHT][WIDTH], int x1, int y1, int x2, int y2, int x3, int y3) {
    draw_line(canvas, x1, y1, x2, y2);
    draw_line(canvas, x2, y2, x3, y3);
    draw_line(canvas, x3, y3, x1, y1);
}