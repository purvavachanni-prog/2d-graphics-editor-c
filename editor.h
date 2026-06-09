#ifndef EDITOR_H
#define EDITOR_H

#include "types.h"

// Global state variables for managing shapes
extern Shape shapes[MAX_SHAPES];
extern int shape_count;
extern int next_shape_id;

// Initialize editor state
void init_editor();

// Add, delete, and modify shapes
int add_shape(ShapeType type, int p1, int p2, int p3, int p4, int p5, int p6);
int delete_shape(int id);
int modify_shape(int id, int p1, int p2, int p3, int p4, int p5, int p6);

// Render all shapes to the character canvas
void render_shapes(char canvas[HEIGHT][WIDTH]);

// Display the canvas and borders with ANSI colors
void display_canvas(char canvas[HEIGHT][WIDTH]);

// Utility shape helpers
void get_shape_name(ShapeType type, char *buffer);
void print_shape_details(Shape *shape);
void list_shapes();
Shape* find_shape_by_id(int id);

#endif // EDITOR_H