// src/app/mod/packageManager.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { JsonFormatter, PACKAGE_JSON_KEY_ORDER }    from './jsonFormatter';
    import { Loader }                                   from './loader';
    import * as path                                    from 'path';
    import * as fs                                      from 'fs';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class PackageManagerWrapper {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            // // Always use bun
            // private readonly pm = 'bun';

            // Default scripts
            private readonly DEFAULT_SCRIPTS = {
                build: 'tsup',
                test: 'test',
                lint: 'eslint src --ext .ts',
            };

            constructor() {
                // No need for pm parameter anymore
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

            // Install packages
            install(packages?: string[], options?: { dev?: boolean; global?: boolean }): void {
                const args: string[] = [];

                // Handle global installations differently
                if (options?.global) {
                    args.push('install', '--global');

                    if (packages && packages.length > 0) {
                        args.push(...packages);
                    } else {
                        console.error('✘ Please specify packages to install globally');
                        process.exit(1);
                    }
                } else {
                    args.push('install');

                    if (packages && packages.length > 0) {
                        args.push(...packages);
                    }

                    if (options?.dev) {
                        args.push('--dev');
                    }
                }

                console.log(`→ Installing${packages ? ` ${packages.join(', ')}` : ' dependencies'}${options?.global ? ' globally' : ''}...`);
                this.execute(args);

                // Format package.json after install (only for local installs)
                if (!options?.global) {
                    this.format();
                }
            }

            /**
             * Remove packages
             */
            remove(packages: string[], options?: { global?: boolean }): void {
                const args = ['remove'];

                if (options?.global) {
                    args.push('--global');
                }

                args.push(...packages);

                console.log(`🗑️ Removing ${packages.join(', ')}${options?.global ? ' globally' : ''}...`);
                this.execute(args);

                // Format package.json after remove (only for local removes)
                if (!options?.global) {
                    this.format();
                }
            }

            /**
             * Link package(s) globally or link global package(s) to current project
             * - No args: Links current package globally (bun link)
             * - With package name(s): Links global package(s) to current project (bun link <package1> <package2> ...)
             */
            link(packageNames?: string | string[]): void {
                if (packageNames) {
                    const packages = Array.isArray(packageNames) ? packageNames : [packageNames];
                    const packageList = packages.join(', ');
                    console.log(`🔗 Linking global package${packages.length > 1 ? 's' : ''} "${packageList}" to current project...`);
                    this.execute(['link', ...packages]);
                } else {
                    console.log('🔗 Linking current package globally...');
                    this.execute(['link']);
                }
            }

            /**
             * Unlink package(s) globally or unlink global package(s) from current project
             * - No args: Unlinks current package globally (bun unlink)
             * - With package name(s): Unlinks global package(s) from current project (bun unlink <package1> <package2> ...)
             */
            unlink(packageNames?: string | string[]): void {
                if (packageNames) {
                    const packages = Array.isArray(packageNames) ? packageNames : [packageNames];
                    const packageList = packages.join(', ');
                    console.log(`🔓 Unlinking global package${packages.length > 1 ? 's' : ''} "${packageList}" from current project...`);
                    this.execute(['unlink', ...packages]);
                } else {
                    console.log('🔓 Unlinking current package globally...');
                    this.execute(['unlink']);
                }
            }

            /**
             * Run a script from package.json (with fallback to default)
             */
            run(script: string, args?: string[]): void {
                const scriptCommand = this.getScriptCommand(script);

                if (!scriptCommand) {
                    console.error(`✘ Script "${script}" not found in package.json and no default available`);
                    process.exit(1);
                }

                // If using default script, run it directly
                if (this.isUsingDefaultScript(script)) {
                    const commandParts = scriptCommand.split(' ');
                    const command = [...commandParts];

                    if (args && args.length > 0) {
                        command.push(...args);
                    }

                    this.execute(command);
                } else {
                    // Use bun run for package.json scripts
                    const command = ['run', script];
                    if (args && args.length > 0) {
                        command.push('--', ...args);
                    }
                    this.execute(command);
                }
            }

            /**
             * Run a script from package.json silently (with fallback to default)
             */
            runSilent(script: string, args?: string[]): void {
                const scriptCommand = this.getScriptCommand(script);

                if (!scriptCommand) {
                    throw new Error(`Script "${script}" not found in package.json and no default available`);
                }

                // If using default script, run it directly
                if (this.isUsingDefaultScript(script)) {
                    const commandParts = scriptCommand.split(' ');
                    const command = [...commandParts];

                    if (args && args.length > 0) {
                        command.push(...args);
                    }

                    this.executeSilent(command);
                } else {
                    // Use bun run for package.json scripts
                    const command = ['run', script];
                    if (args && args.length > 0) {
                        command.push('--', ...args);
                    }
                    this.executeSilent(command);
                }
            }

            /**
             * Update packages
             */
            update(packages?: string[]): void {
                console.log(`🔄 Updating${packages ? ` ${packages.join(', ')}` : ' all packages'}...`);

                const args = ['update'];
                if (packages && packages.length > 0) {
                    args.push(...packages);
                }
                this.execute(args);

                // Format package.json after update
                this.format();
            }

            /**
             * List installed packages
             */
            list(options?: { global?: boolean }): void {
                const args = ['pm', 'ls'];
                if (options?.global) {
                    args.push('--global');
                }
                this.execute(args);
            }

            /**
             * Initialize a new package.json
             */
            init(): void {
                console.log('📝 Initializing package.json...');
                this.execute(['init', '-y']);

                // Format package.json after init
                this.format();
            }

            /**
             * Publish package (uses bun for publishing - simpler and more reliable)
             */
            publish(options?: { tag?: string; access?: 'public' | 'restricted' }, loader?: Loader): void {
                // Publish with bun (more reliable than npm)
                const args = ['publish'];
                if (options?.tag) {
                    args.push('--tag', options.tag);
                }
                // Always set access flag for scoped packages, default to public
                const access = options?.access || 'public';
                args.push('--access', access);

                // Stop loader before running interactive publish process
                if (loader) {
                    loader.stop('');
                }

                // Use inherit mode to allow interactive authentication
                const publishProc = Bun.spawnSync(['bun', ...args], {
                    stdout: 'inherit',
                    stderr: 'inherit',
                    stdin: 'inherit'
                });

                if (publishProc.exitCode === 0) {
                    console.log('✔ Published successfully!');
                } else {
                    console.error('✘ Publish failed!');
                    process.exit(1);
                }
            }

            /**
             * Execute bun command
             */
            execute(args: string[]): void {
                const proc = Bun.spawnSync(['bun', ...args], {
                    stdout: 'inherit',
                    stderr: 'inherit'
                });

                if (proc.exitCode !== 0) {
                    console.error(`✘ Command failed: bun ${args.join(' ')}`);
                    process.exit(1);
                }
            }

            /**
             * Execute bun command silently
             */
            executeSilent(args: string[]): void {
                const proc = Bun.spawnSync(['bun', ...args], {
                    stdout: 'pipe',
                    stderr: 'pipe'
                });

                if (proc.exitCode !== 0) {
                    // Only show errors if command failed
                    const stderr = new TextDecoder().decode(proc.stderr);
                    console.error(`✘ Command failed: bun ${args.join(' ')}`);
                    if (stderr) {
                        console.error(stderr);
                    }
                    process.exit(1);
                }
            }

            /**
             * Get package manager name
             */
            getName(): string {
                return 'bun';
            }

            /**
             * Get package manager emoji
             */
            getEmoji(): string {
                return '🥟';
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            /**
             * Format package.json after operations
             */
            private format(): void {
                try {
                    const pkgPath = path.join(process.cwd(), 'package.json');
                    if (fs.existsSync(pkgPath)) {
                        JsonFormatter.formatFile(pkgPath, { keyOrder: PACKAGE_JSON_KEY_ORDER });
                    }
                } catch {
                    // Silently ignore formatting errors
                }
            }

            /**
             * Get script command (from package.json or default)
             */
            private getScriptCommand(script: string): string | null {
                const pkgPath = path.join(process.cwd(), 'package.json');

                // Try to read package.json
                if (fs.existsSync(pkgPath)) {
                    try {
                        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

                        // Check if script exists in package.json
                        if (pkg.scripts && pkg.scripts[script]) {
                            return pkg.scripts[script];
                        }
                    } catch {
                        // If can't read package.json, fall through to defaults
                    }
                }

                // Return default script if available
                if (script in this.DEFAULT_SCRIPTS) {
                    return this.DEFAULT_SCRIPTS[script as keyof typeof this.DEFAULT_SCRIPTS];
                }

                return null;
            }

            /**
             * Check if using default script (not from package.json)
             */
            private isUsingDefaultScript(script: string): boolean {
                const pkgPath = path.join(process.cwd(), 'package.json');

                if (fs.existsSync(pkgPath)) {
                    try {
                        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

                        // If script exists in package.json, not using default
                        if (pkg.scripts && pkg.scripts[script]) {
                            return false;
                        }
                    } catch {
                        // If can't read, assume using default
                    }
                }

                // Using default if script is in DEFAULT_SCRIPTS
                return script in this.DEFAULT_SCRIPTS;
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝