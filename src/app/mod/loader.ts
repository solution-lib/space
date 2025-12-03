// src/app/mod/loader.ts
//
// Developed with ❤️ by Maysara.


// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Loader {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            private frames: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            private currentFrame: number = 0;
            private interval: NodeJS.Timeout | null = null;

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

            start(message: string): void {
                process.stdout.write(`\n${message}`);
                this.interval = setInterval(() => {
                    process.stdout.write(`\r${this.frames[this.currentFrame]} ${message}`);
                    this.currentFrame = (this.currentFrame + 1) % this.frames.length;
                }, 80);
            }

            stop(successMessage: string): void {
                if (this.interval) {
                    clearInterval(this.interval);
                    this.interval = null;
                }

                if (successMessage === '') {
                    // Clear the current line and move cursor up to remove the loader completely
                    process.stdout.write('\r\x1b[K\x1b[1A\x1b[K');
                } else {
                    process.stdout.write(`\r${successMessage}                          \n\n`);
                }
            }

            stopWithError(errorMessage: string): void {
                if (this.interval) {
                    clearInterval(this.interval);
                    this.interval = null;
                }
                process.stdout.write(`\r✘ ${errorMessage}                          \n\n`);
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝