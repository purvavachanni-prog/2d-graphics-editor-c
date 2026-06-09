#include "editor.h"
#include "drawing.h"
#include <stdio.h>
#include <string.h>

Shape shapes[MAX_SHAPES];
int shape_count = 0;
int next_shape_id = 1;

void init_editor() {
    shape_count = 0;
    next_shape_id = 1;
}

int add_shape(ShapeType type, int p1, int p2, int p3, int p4, int p5, int p6) {
    if (shape_count >= MAX_SHAPES) {
        return 0;
    }
    Shape s;
    s.id = next_shape_id++;
    s.type = type;
    s.p1 = p1;
    s.p2 = p2;
    s.p3 = p3;
    s.p4 = p4;
    s.p5 = p5;
    s.p6 = p6;
    shapes[shape_count++] = s;
    return s.id;
}

int delete_shape(int id) {
    int index = -1;
    for (int i = 0; i < shape_count; i++) {
        if (shapes[i].id == id) {
            index = i;
            break;
        }
    }
    if (index == -1) return 0; // Not found
    
    // Shift elements down
    for (int i = index; i < shape_count - 1; i++) {
        shapes[i] = shapes[i + 1];
    }
    shape_count--;
    return 1;
}

int modify_shape(int id, int p1, int p2, int p3, int p4, int p5, int p6) {
    Shape *s = find_shape_by_id(id);
    if (s == NULL) return 0;
    s->p1 = p1;
    s->p2 = p2;
    s->p3 = p3;
    s->p4 = p4;
    s->p5 = p5;
    s->p6 = p6;
    return 1;
}

Shape* find_shape_by_id(int id) {
    for (int i = 0; i < shape_count; i++) {
        if (shapes[i].id == id) {
            return &shapes[i];
        }
    }
    return NULL;
}

void render_shapes(char canvas[HEIGHT][WIDTH]) {
    clear_canvas(canvas);
    for (int i = 0; i < shape_count; i++) {
        Shape *s = &shapes[i];
        switch (s->type) {
            case SHAPE_LINE:
                draw_line(canvas, s->p1, s->p2, s->p3, s->p4);
                break;
            case SHAPE_RECTANGLE:
                draw_rectangle(canvas, s->p1, s->p2, s->p3, s->p4);
                break;
            case SHAPE_CIRCLE:
                draw_circle(canvas, s->p1, s->p2, s->p3);
                break;
            case SHAPE_TRIANGLE:
                draw_triangle(canvas, s->p1, s->p2, s->p3, s->p4, s->p5, s->p6);
                break;
        }
    }
}

void get_shape_name(ShapeType type, char *buffer) {
    switch (type) {
        case SHAPE_LINE: strcpy(buffer, "Line"); break;
        case SHAPE_RECTANGLE: strcpy(buffer, "Rectangle"); break;
        case SHAPE_CIRCLE: strcpy(buffer, "Circle"); break;
        case SHAPE_TRIANGLE: strcpy(buffer, "Triangle"); break;
        default: strcpy(buffer, "Unknown"); break;
    }
}

void print_shape_details(Shape *s) {
    char name[20];
    get_shape_name(s->type, name);
    switch (s->type) {
        case SHAPE_LINE:
            printf("ID %d: %s from (%d, %d) to (%d, %d)", s->id, name, s->p1, s->p2, s->p3, s->p4);
            break;
        case SHAPE_RECTANGLE:
            printf("ID %d: %s at (%d, %d), W:%d, H:%d", s->id, name, s->p1, s->p2, s->p3, s->p4);
            break;
        case SHAPE_CIRCLE:
            printf("ID %d: %s centered at (%d, %d), R:%d", s->id, name, s->p1, s->p2, s->p3);
            break;
        case SHAPE_TRIANGLE:
            printf("ID %d: %s with vertices (%d, %d), (%d, %d), (%d, %d)", s->id, name, s->p1, s->p2, s->p3, s->p4, s->p5, s->p6);
            break;
    }
}

void list_shapes() {
    if (shape_count == 0) {
        printf("  (No shapes created yet)\n");
        return;
    }
    for (int i = 0; i < shape_count; i++) {
        printf("  - ");
        print_shape_details(&shapes[i]);
        printf("\n");
    }
}

void display_canvas(char canvas[HEIGHT][WIDTH]) {
    // Print top border in Cyan
    printf("\033[36m+");
    for (int x = 0; x < WIDTH; x++) {
        printf("-");
    }
    printf("+\033[0m\n");

    for (int y = 0; y < HEIGHT; y++) {
        // Left border
        printf("\033[36m|\033[0m");
        
        int current_color = -1; // -1 = unset, 0 = dim gray (_), 1 = bright yellow (*)
        
        for (int x = 0; x < WIDTH; x++) {
            char c = canvas[y][x];
            if (c == '*') {
                if (current_color != 1) {
                    printf("\033[93;1m");
                    current_color = 1;
                }
                putchar('*');
            } else {
                if (current_color != 0) {
                    printf("\033[90m");
                    current_color = 0;
                }
                putchar('_');
            }
        }
        
        // Reset color before printing the right border
        printf("\033[0m");
        
        // Right border
        printf("\033[36m|\033[0m\n");
    }

    // Print bottom border
    printf("\033[36m+");
    for (int x = 0; x < WIDTH; x++) {
        printf("-");
    }
    printf("+\033[0m\n");
}