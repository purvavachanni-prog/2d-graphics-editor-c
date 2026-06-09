#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "types.h"
#include "drawing.h"
#include "editor.h"

#ifdef _WIN32
#include <windows.h>
void enable_ansi() {
    HANDLE hOut = GetStdHandle(STD_OUTPUT_HANDLE);
    if (hOut == INVALID_HANDLE_VALUE) return;
    DWORD dwMode = 0;
    if (!GetConsoleMode(hOut, &dwMode)) return;
    dwMode |= ENABLE_VIRTUAL_TERMINAL_PROCESSING;
    SetConsoleMode(hOut, dwMode);
}
#else
void enable_ansi() {}
#endif

// Safe integer input helper
int get_int(const char *prompt, int *val) {
    char buffer[256];
    while (1) {
        printf("%s", prompt);
        if (fgets(buffer, sizeof(buffer), stdin) == NULL) {
            return 0;
        }
        // Trim newline
        buffer[strcspn(buffer, "\n")] = '\0';
        
        char *endptr;
        long parsed = strtol(buffer, &endptr, 10);
        if (endptr != buffer && *endptr == '\0') {
            *val = (int)parsed;
            return 1;
        }
        printf("\033[91mError: Input must be a valid integer.\033[0m\n");
    }
}

void press_enter_to_continue() {
    printf("\nPress Enter to continue...");
    char buffer[10];
    fgets(buffer, sizeof(buffer), stdin);
}

void clear_screen() {
    // Standard ANSI screen clear
    printf("\033[H\033[J");
    fflush(stdout);
}

void handle_add() {
    int choice = 0;
    while (1) {
        clear_screen();
        printf("\033[36;1m=== Add a New Shape ===\033[0m\n");
        printf("1. Line\n");
        printf("2. Rectangle\n");
        printf("3. Circle\n");
        printf("4. Triangle\n");
        printf("5. Back to Main Menu\n\n");
        
        if (!get_int("Choose a shape type (1-5): ", &choice)) return;
        
        if (choice < 1 || choice > 5) {
            printf("\033[91mInvalid choice. Please enter 1-5.\033[0m\n");
            press_enter_to_continue();
            continue;
        }
        
        if (choice == 5) return;
        
        int p1 = 0, p2 = 0, p3 = 0, p4 = 0, p5 = 0, p6 = 0;
        
        switch (choice) {
            case 1: // Line
                printf("\n\033[93mDrawing Line:\033[0m\n");
                get_int("  Start X (0-59): ", &p1);
                get_int("  Start Y (0-19): ", &p2);
                get_int("  End X (0-59): ", &p3);
                get_int("  End Y (0-19): ", &p4);
                add_shape(SHAPE_LINE, p1, p2, p3, p4, 0, 0);
                break;
            case 2: // Rectangle
                printf("\n\033[93mDrawing Rectangle:\033[0m\n");
                get_int("  Top-Left X (0-59): ", &p1);
                get_int("  Top-Left Y (0-19): ", &p2);
                get_int("  Width (1-60): ", &p3);
                get_int("  Height (1-20): ", &p4);
                add_shape(SHAPE_RECTANGLE, p1, p2, p3, p4, 0, 0);
                break;
            case 3: // Circle
                printf("\n\033[93mDrawing Circle:\033[0m\n");
                get_int("  Center X (0-59): ", &p1);
                get_int("  Center Y (0-19): ", &p2);
                get_int("  Radius: ", &p3);
                add_shape(SHAPE_CIRCLE, p1, p2, p3, 0, 0, 0);
                break;
            case 4: // Triangle
                printf("\n\033[93mDrawing Triangle:\033[0m\n");
                get_int("  Vertex 1 X (0-59): ", &p1);
                get_int("  Vertex 1 Y (0-19): ", &p2);
                get_int("  Vertex 2 X (0-59): ", &p3);
                get_int("  Vertex 2 Y (0-19): ", &p4);
                get_int("  Vertex 3 X (0-59): ", &p5);
                get_int("  Vertex 3 Y (0-19): ", &p6);
                add_shape(SHAPE_TRIANGLE, p1, p2, p3, p4, p5, p6);
                break;
        }
        
        printf("\n\033[92mShape added successfully!\033[0m\n");
        press_enter_to_continue();
        return;
    }
}

void handle_modify() {
    clear_screen();
    printf("\033[36;1m=== Modify an Existing Shape ===\033[0m\n");
    list_shapes();
    printf("\n");
    
    if (shape_count == 0) {
        press_enter_to_continue();
        return;
    }
    
    int id;
    if (!get_int("Enter the ID of the shape to modify: ", &id)) return;
    
    Shape *s = find_shape_by_id(id);
    if (s == NULL) {
        printf("\033[91mShape with ID %d not found.\033[0m\n", id);
        press_enter_to_continue();
        return;
    }
    
    printf("\n\033[93mModifying: ");
    print_shape_details(s);
    printf("\033[0m\n\n");
    
    int p1 = 0, p2 = 0, p3 = 0, p4 = 0, p5 = 0, p6 = 0;
    
    switch (s->type) {
        case SHAPE_LINE:
            get_int("  New Start X: ", &p1);
            get_int("  New Start Y: ", &p2);
            get_int("  New End X: ", &p3);
            get_int("  New End Y: ", &p4);
            break;
        case SHAPE_RECTANGLE:
            get_int("  New Top-Left X: ", &p1);
            get_int("  New Top-Left Y: ", &p2);
            get_int("  New Width: ", &p3);
            get_int("  New Height: ", &p4);
            break;
        case SHAPE_CIRCLE:
            get_int("  New Center X: ", &p1);
            get_int("  New Center Y: ", &p2);
            get_int("  New Radius: ", &p3);
            break;
        case SHAPE_TRIANGLE:
            get_int("  New Vertex 1 X: ", &p1);
            get_int("  New Vertex 1 Y: ", &p2);
            get_int("  New Vertex 2 X: ", &p3);
            get_int("  New Vertex 2 Y: ", &p4);
            get_int("  New Vertex 3 X: ", &p5);
            get_int("  New Vertex 3 Y: ", &p6);
            break;
    }
    
    modify_shape(id, p1, p2, p3, p4, p5, p6);
    printf("\n\033[92mShape modified successfully!\033[0m\n");
    press_enter_to_continue();
}

void handle_delete() {
    clear_screen();
    printf("\033[36;1m=== Delete a Shape ===\033[0m\n");
    list_shapes();
    printf("\n");
    
    if (shape_count == 0) {
        press_enter_to_continue();
        return;
    }
    
    int id;
    if (!get_int("Enter the ID of the shape to delete: ", &id)) return;
    
    if (delete_shape(id)) {
        printf("\n\033[92mShape ID %d deleted successfully.\033[0m\n", id);
    } else {
        printf("\n\033[91mShape ID %d not found.\033[0m\n", id);
    }
    press_enter_to_continue();
}

int main() {
    enable_ansi();
    init_editor();
    
    char canvas[HEIGHT][WIDTH];
    int choice = 0;
    
    while (1) {
        clear_screen();
        
        // Title banner
        printf("\033[95;1m============================================================\033[0m\n");
        printf("\033[95;1m*                2D ASCII GRAPHICS EDITOR                  *\033[0m\n");
        printf("\033[95;1m============================================================\033[0m\n\n");
        
        // Render and display canvas
        render_shapes(canvas);
        display_canvas(canvas);
        
        // List active shapes
        printf("\n\033[33;1mActive Shapes List:\033[0m\n");
        list_shapes();
        printf("\n");
        
        // Show main menu options
        printf("\033[36;1m=== Main Menu ===\033[0m\n");
        printf("1. Add a shape (Line, Rectangle, Circle, Triangle)\n");
        printf("2. Modify an existing shape\n");
        printf("3. Delete a shape\n");
        printf("4. Clear drawing canvas (Delete all shapes)\n");
        printf("5. Exit program\n\n");
        
        if (!get_int("Select option (1-5): ", &choice)) {
            break;
        }
        
        switch (choice) {
            case 1:
                handle_add();
                break;
            case 2:
                handle_modify();
                break;
            case 3:
                handle_delete();
                break;
            case 4:
                // Double check confirmation
                printf("\n\033[91;1mAre you sure you want to delete all shapes? (1 for Yes, 0 for No): \033[0m");
                int confirm = 0;
                get_int("", &confirm);
                if (confirm == 1) {
                    init_editor();
                    printf("\033[92mCanvas cleared.\033[0m\n");
                    press_enter_to_continue();
                }
                break;
            case 5:
                clear_screen();
                printf("Thank you for using the 2D ASCII Graphics Editor! Goodbye!\n");
                return 0;
            default:
                printf("\033[91mInvalid option. Please enter 1-5.\033[0m\n");
                press_enter_to_continue();
                break;
        }
    }
    
    return 0;
}