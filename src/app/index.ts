// src/app/index.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { cli }                          from '@je-es/cli';
    import { AppConfig, InitCommandParams } from "../types.d";
    import { SpaceManager }                 from './mod/spaceManager';
    import { PackageManagerWrapper }        from './mod/packageManager';
    import { PromptHelper }                 from './mod/promptHelper';
    import { spawnSync }                    from 'child_process';
    import * as path                        from 'path';
    import * as fs                          from 'fs';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ LOADER ════════════════════════════════════════╗

    class Loader {

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



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class App {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            private spaceManager    : SpaceManager;
            private pm              : PackageManagerWrapper | null = null;

            constructor(
                public config       : AppConfig
            ) {
                this.spaceManager   = new SpaceManager();
                this.initPackageManager();
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

            static create(config: AppConfig): App {
                return new App(config);
            }

            run() {
                // CLI Setup
                cli(this.config.name, this.config.version).description(this.config.desc)

                // ═══════════════════════════ SPACE COMMANDS ═══════════════════════════

                // 'init' command - create new spaces
                .command({
                    name            : 'init',
                    description     : 'Create a new space (lib or cli)',

                    args: [
                        {
                            name        : 'name',
                            required    : false,
                            default     : 'my-space',
                            description : 'Name of the space (supports @org/name format)'
                        }
                    ],

                    options: [
                        {
                            name        : 'type',
                            flag        : '-t',
                            type        : 'string',
                            required    : false,
                            description : 'Type of space (lib or cli)'
                        },
                        {
                            name        : 'description',
                            flag        : '--desc',
                            type        : 'string',
                            required    : false,
                            description : 'Description of the space'
                        }
                    ],

                    action: (params: InitCommandParams) => this.createNewSpaceOnGroundViaCLI(params)
                })

                // 'info' command - show space information
                .command({
                    name            : 'info',
                    description     : 'Show current space information',
                    action          : () => this.showSpaceInfo()
                })

                // ═══════════════════════════ PACKAGE MANAGER COMMANDS ═══════════════════════════

                // 'install' or 'i' command - install packages
                .command({
                    name            : 'install',
                    aliases         : ['i'],
                    description     : 'Install packages',

                    args: [
                        {
                            name        : 'packages',
                            required    : false,
                            description : 'Packages to install (space-separated)'
                        }
                    ],

                    options: [
                        {
                            name        : 'dev',
                            flag        : '--dev',
                            type        : 'boolean',
                            required    : false,
                            description : 'Install as dev dependency'
                        },
                        {
                            name        : 'global',
                            flag        : '--global',
                            type        : 'boolean',
                            required    : false,
                            description : 'Install globally'
                        }
                    ],

                    action: (params: any) => this.installPackages(params)
                })

                // 'remove' or 'r' command - remove packages
                .command({
                    name            : 'remove',
                    aliases         : ['r'],
                    description     : 'Remove packages',

                    args: [
                        {
                            name        : 'packages',
                            required    : true,
                            description : 'Packages to remove (space-separated)'
                        }
                    ],

                    options: [
                        {
                            name        : 'global',
                            flag        : '--global',
                            type        : 'boolean',
                            required    : false,
                            description : 'Remove globally'
                        }
                    ],

                    action: (params: any) => this.removePackages(params)
                })

                // 'update' or 'up' command - update packages
                .command({
                    name            : 'update',
                    aliases         : ['up'],
                    description     : 'Update packages',

                    args: [
                        {
                            name        : 'packages',
                            required    : false,
                            description : 'Packages to update (space-separated, or all if empty)'
                        }
                    ],

                    action: (params: any) => this.updatePackages(params)
                })

                // 'link' command - link package globally OR link global package to project
                .command({
                    name            : 'link',
                    description     : 'Link package globally (no args) or link global package to project (with package name)',
                    
                    args: [
                        {
                            name        : 'package',
                            required    : false,
                            description : 'Package name to link from global (optional)'
                        }
                    ],
                    
                    action: (params: any) => this.linkPackage(params)
                })

                // 'unlink' command - unlink package globally OR unlink global package from project
                .command({
                    name            : 'unlink',
                    description     : 'Unlink package globally (no args) or unlink global package from project (with package name)',
                    
                    args: [
                        {
                            name        : 'package',
                            required    : false,
                            description : 'Package name to unlink from global (optional)'
                        }
                    ],
                    
                    action: (params: any) => this.unlinkPackage(params)
                })

                // 'list' or 'ls' command - list installed packages
                .command({
                    name            : 'list',
                    aliases         : ['ls'],
                    description     : 'List installed packages',

                    options: [
                        {
                            name        : 'global',
                            flag        : '--global',
                            type        : 'boolean',
                            required    : false,
                            description : 'List global packages'
                        }
                    ],

                    action: (params: any) => this.listPackages(params)
                })

                // ═══════════════════════════ BUILD & TEST COMMANDS ═══════════════════════════

                // 'build' command - build the space
                .command({
                    name            : 'build',
                    description     : 'Build the current space',
                    action          : () => this.buildSpace()
                })

                // 'test' command - run tests
                .command({
                    name            : 'test',
                    description     : 'Run tests for the current space',

                    args: [
                        {
                            name        : 'path',
                            required    : false,
                            description : 'Specific test file or folder (optional)'
                        }
                    ],

                    options: [
                        {
                            name        : 'coverage',
                            flag        : '--coverage',
                            type        : 'boolean',
                            required    : false,
                            description : 'Generate code coverage report'
                        },
                        {
                            name        : 'watch',
                            flag        : '--watch',
                            type        : 'boolean',
                            required    : false,
                            description : 'Run tests in watch mode'
                        },
                        {
                            name        : 'bail',
                            flag        : '--bail',
                            type        : 'boolean',
                            required    : false,
                            description : 'Exit on first test failure'
                        },
                        {
                            name        : 'timeout',
                            flag        : '--timeout',
                            type        : 'string',
                            required    : false,
                            description : 'Set test timeout in milliseconds'
                        },
                        {
                            name        : 'rerun-each',
                            flag        : '--rerun-each',
                            type        : 'string',
                            required    : false,
                            description : 'Re-run each test N times'
                        },
                        {
                            name        : 'concurrent',
                            flag        : '--concurrent',
                            type        : 'boolean',
                            required    : false,
                            description : 'Run tests concurrently'
                        },
                        {
                            name        : 'coverage-reporter',
                            flag        : '--coverage-reporter',
                            type        : 'string',
                            required    : false,
                            description : 'Coverage reporter format (text, lcov, etc.)'
                        },
                        {
                            name        : 'test-name-pattern',
                            flag        : '-t',
                            type        : 'string',
                            required    : false,
                            description : 'Filter tests by name pattern'
                        }
                    ],

                    action: (params: any) => this.runTests(params)
                })

                // 'run' command - run any script from package.json
                .command({
                    name                : 'run',
                    description         : 'Run any script from package.json',

                    args: [
                        {
                            name        : 'script',
                            required    : true,
                            description : 'Script name from package.json'
                        }
                    ],

                    allowDynamicArgs    : true,    // Allow additional arguments
                    allowDynamicOptions : true,    // Allow additional options

                    action: (params: any) => this.runScript(params)
                })

                // 'clean' command - clean build artifacts
                .command({
                    name            : 'clean',
                    description     : 'Clean build artifacts',
                    action          : () => this.clean()
                })

                // 'start' command - start the main file
                .command({
                    name                : 'start',
                    description         : 'Start the main file',
                    allowDynamicArgs    : true,    // Allow any arguments to pass through
                    allowDynamicOptions : true,    // Allow any options to pass through
                    action              : (params: any) => this.startMain(params)
                })

                // ═══════════════════════════ PUBLISH COMMAND ═══════════════════════════

                // 'publish' command - publish to npm
                .command({
                    name            : 'publish',
                    description     : 'Publish space to npm registry',

                    options: [
                        {
                            name        : 'tag',
                            flag        : '--tag',
                            type        : 'string',
                            required    : false,
                            description : 'Publish with tag (e.g., beta, next)'
                        },
                        {
                            name        : 'access',
                            flag        : '--access',
                            type        : 'string',
                            required    : false,
                            description : 'Access level (public or restricted)'
                        }
                    ],

                    action: (params: any) => this.publish(params)
                })

                // Build and run CLI
                .build().run();
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            static defaultConfig(): AppConfig {
                return {
                    name    : 'Space',
                    version : '0.0.1',
                    desc    : 'Build flexible spaces for any platform',
                };
            }

            /**
             * Initialize package manager based on space config
             */
            private initPackageManager() {
                if (this.spaceManager.isSpace()) {
                    // Always use bun - no need to check config
                    this.pm = new PackageManagerWrapper();
                }
            }

            /**
             * Ensure we're in a space directory
             */
            private ensureSpace(): boolean {
                if (!this.spaceManager.isSpace()) {
                    console.error('✘ Not a space directory. Run "space init <name> -t lib|cli" first.');
                    return false;
                }
                return true;
            }

            /**
             * Parse package name to extract org and name
             * Examples:
             *   "@je-es/ast" -> { org: "je-es", name: "ast" }
             *   "my-package" -> { org: "", name: "my-package" }
             */
            private parsePackageName(fullName: string): { org: string; name: string } {
                const orgRegex = /^@([a-z0-9-_]+)\/([a-z0-9-_]+)$/i;
                const match = fullName.match(orgRegex);

                if (match) {
                    return {
                        org: match[1],
                        name: match[2]
                    };
                }

                return {
                    org: '',
                    name: fullName
                };
            }

            /**
             * Delete directory with retry logic for Windows file locking issues
             */
            private async deleteDirectoryWithRetry(dirPath: string, maxRetries: number = 3): Promise<void> {
                for (let i = 0; i < maxRetries; i++) {
                    try {
                        // Try to delete
                        fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });

                        // Verify deletion
                        if (!fs.existsSync(dirPath)) {
                            return; // Success!
                        }
                    } catch (error: any) {
                        if (i === maxRetries - 1) {
                            // Last attempt failed
                            throw error;
                        }

                        // Wait before retry (increasing delay)
                        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
                    }
                }

                throw new Error('Failed to delete directory after multiple attempts');
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── SPACE ──────────────────────────────┐

            /**
             * Create a new space via CLI
             */
            private async createNewSpaceOnGroundViaCLI(params: InitCommandParams) {
                try {
                    // Prompt for missing parameters
                    const answers = await PromptHelper.promptInit({
                        type            : params.options.type,
                        template        : params.options.template,

                        org             : '',
                        name            : params.args.name,
                        desc            : params.options.desc,
                    });

                    // Parse package name to extract org and actual name
                    const { org, name } = this.parsePackageName(answers.name);

                    // Validate type
                    if (!['lib', 'cli', 'server'].includes(answers.type)) {
                        PromptHelper.showError('Invalid space type. Must be lib, cli or server.');
                        process.exit(1);
                    }

                    // Validate template
                    const { TemplateRegistry } = await import('./mod/templateRegistry');
                    if (!TemplateRegistry.isValidTemplate(answers.type as any, answers.template as any)) {
                        PromptHelper.showError('Invalid template for this space type.');
                        process.exit(1);
                    }

                    // Check if template is ready
                    if (!TemplateRegistry.isTemplateReady(answers.type as any, answers.template as any)) {
                        PromptHelper.showError('This template is not ready yet. Please choose another template.');
                        process.exit(1);
                    }

                    // Determine the target space path
                    let spacePath: string | undefined;

                    // Get current directory name
                    const currentDirName = path.basename(process.cwd());

                    // Check if name is empty and ask if user wants to use current directory
                    if (!name || name.trim() === '') {
                        const useCurrentDir = await PromptHelper.promptUseCurrentDir(currentDirName);

                        if (useCurrentDir) {
                            spacePath = process.cwd();
                        } else {
                            PromptHelper.showError('Space name is required when not using current directory');
                            process.exit(1);
                        }
                    }
                    // Check if folder name matches project name
                    else if (currentDirName === name) {
                        const useCurrentDir = await PromptHelper.promptUseCurrentDir(name);

                        if (useCurrentDir) {
                            spacePath = process.cwd();
                        }
                    }

                    // If spacePath not set, use default (create subdirectory)
                    if (!spacePath) {
                        spacePath = path.join(process.cwd(), name);
                    }

                    // Check if space path already exists
                    if (fs.existsSync(spacePath)) {
                        const isDir = fs.statSync(spacePath).isDirectory();
                        if (!isDir) {
                            PromptHelper.showError(`Path "${spacePath}" exists but is not a directory`);
                            process.exit(1);
                        }

                        // Directory exists, ask user what to do
                        const shouldDelete = await PromptHelper.promptDeleteExistingDir(spacePath);

                        if (!shouldDelete) {
                            PromptHelper.showInfo('Space creation cancelled');
                            process.exit(0);
                        }

                        // Delete the directory with retry logic
                        try {
                            await this.deleteDirectoryWithRetry(spacePath);
                        } catch (error: any) {
                            const isLockError = error.message &&
                                (error.message.includes('EBUSY') ||
                                error.message.includes('EPERM') ||
                                error.message.includes('resource busy'));

                            if (isLockError) {
                                PromptHelper.showError(
                                    `Cannot delete directory - it's being used by another program.\n\n` +
                                    `Please try:\n` +
                                    `  1. Close any terminals/editors with "${spacePath}" open\n` +
                                    `  2. Navigate out of the directory in all terminals\n` +
                                    `  3. Run PowerShell/Terminal as Administrator\n` +
                                    `  4. Wait a few seconds and try again`
                                );
                            } else {
                                PromptHelper.showError(
                                    `Failed to delete existing directory.`,
                                    error
                                );
                            }
                            process.exit(1);
                        }
                    }

                    // // Show info about org detection
                    // if (org) {
                    //     console.log(`― Detected organization: @${org}`);
                    //     console.log(`― Package name: ${name}`);
                    // }

                    // // Show template info
                    // const templateInfo = TemplateRegistry.getTemplate(answers.type as any, answers.template as any);
                    // if (templateInfo?.deps) {
                    //     console.log(`― Includes: ${templateInfo.deps.join(', ')}`);
                    // }

                    await this.spaceManager.createSpace({
                        type            : answers.type as any,
                        template        : answers.template as any,
                        pm              : 'bun', // Always use bun

                        repo           : {
                            org        : org,
                            name       : name,
                            version    : '0.0.1',
                            desc       : answers.description,
                            kw         : answers.keywords.length > 0 ? answers.keywords : [],
                            license    : answers.license || 'MIT',
                        },

                        author          : {
                            id          : answers.githubId,
                            name        : answers.author,
                            email       : answers.authorEmail,
                            url         : '', // Will be generated in spaceManager
                        },

                        createdAt       : new Date().toISOString()
                    }, spacePath);

                    PromptHelper.showSuccess(name, [
                        spacePath === process.cwd() ? 'space install' :
                        `cd ${name}`,
                        `space install`,
                        'space build'
                    ]);
                } catch (error) {
                    PromptHelper.showError('Failed to create space', error as Error);
                    process.exit(1);
                }
            }

            /**
             * Show information about current space
             * Safely handles template placeholders and unexpected data types
             */
            private showSpaceInfo() {
                if (!this.ensureSpace()) return;

                const config = this.spaceManager.loadSpaceConfig();
                if (!config) {
                    console.error('✘ Could not load space configuration.');
                    return;
                }

                console.log('');

                // Safe access to org - check if it exists and is not empty
                const hasOrg = config.repo?.org && config.repo.org.trim() !== '';
                const fullName = hasOrg
                    ? `${config.repo.org}/${config.repo.name}`
                    : config.repo.name;

                console.log(`Name:            ${fullName}`);
                console.log(`Type:            ${config.type}`);
                console.log(`Version:         ${config.repo.version}`);

                // Safe description handling
                if (config.repo.desc && config.repo.desc !== '{{desc}}' && config.repo.desc !== '{{description}}') {
                    console.log(`Description:     ${config.repo.desc}`);
                }

                // Safe keywords handling - check if it's an array and not empty
                if (config.repo.kw) {
                    // Normalize to array if it's a string
                    let keywords: string[] = [];

                    if (Array.isArray(config.repo.kw)) {
                        keywords = config.repo.kw.filter((k: any) =>
                            k &&
                            typeof k === 'string' &&
                            k.trim() !== '' &&
                            k !== '{{kw}}' &&
                            k !== '{{keywords}}'
                        );
                    } else if (typeof config.repo.kw === 'string') {
                        const kwString = config.repo.kw as string;
                        if (kwString !== '{{kw}}' &&
                            kwString !== '{{keywords}}' &&
                            kwString.trim() !== '') {
                            // If it's a string, try to split by comma
                            keywords = kwString
                                .split(',')
                                .map((k: string) => k.trim())
                                .filter((k: string) => k !== '');
                        }
                    }

                    if (keywords.length > 0) {
                        console.log(`Keywords:        ${keywords.join(', ')}`);
                    }
                }

                // Safe license handling
                if (config.repo.license && config.repo.license !== '{{license}}') {
                    console.log(`License:         ${config.repo.license}`);
                }

                console.log(`PackageManager:  bun`);

                // Safe author name handling
                if (config.author?.name &&
                    config.author.name !== '{{author}}' &&
                    config.author.name !== '{{author_name}}') {
                    console.log(`Author:          ${config.author.name}`);
                }

                console.log(`Created:         ${new Date(config.createdAt).toLocaleDateString()}`);

                console.log('');
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── PKG MGR ────────────────────────────┐

            /**
             * Install packages
             */
            private async installPackages(params: any) {
                if (!this.ensureSpace()) return;
                if (!this.pm) this.initPackageManager();

                try {
                    let packages = params.args.packages
                        ? params.args.packages.split(' ').filter((p: string) => p.trim())
                        : undefined;

                    let isDev = params.options.dev || false;

                    // If no packages provided, prompt
                    if (!packages || packages.length === 0) {
                        const shouldInstallAll = await PromptHelper.promptConfirm(
                            'No packages specified. Install all dependencies from package.json?',
                            true
                        );

                        if (!shouldInstallAll) {
                            const installAnswers    = await PromptHelper.promptInstall();
                            packages                = installAnswers.packages;
                            isDev                   = installAnswers.isDev;
                        }
                    }

                    this.pm!.install(packages, {
                        dev: isDev,
                        global: params.options.global
                    });
                } catch (error) {
                    PromptHelper.showError('✘ Installation failed', error as Error);
                    process.exit(1);
                }
            }

            /**
             * Remove packages
             */
            private async removePackages(params: any) {
                if (!this.ensureSpace()) return;
                if (!this.pm) this.initPackageManager();

                try {
                    const packages = params.args.packages.split(' ').filter((p: string) => p.trim());

                    if (packages.length === 0) {
                        PromptHelper.showError('Please specify packages to remove');
                        return;
                    }

                    // Confirm removal
                    const removeAnswers = await PromptHelper.promptRemove(packages);

                    if (!removeAnswers.confirm) {
                        PromptHelper.showInfo('Removal cancelled');
                        return;
                    }

                    this.pm!.remove(packages, {
                        global: params.options.global
                    });
                } catch (error) {
                    PromptHelper.showError('✘ Removal failed', error as Error);
                    process.exit(1);
                }
            }

            /**
             * Update packages
             */
            private async updatePackages(params: any) {
                if (!this.ensureSpace()) return;
                if (!this.pm) this.initPackageManager();

                try {
                    let packages = params.args.packages
                        ? params.args.packages.split(' ').filter((p: string) => p.trim())
                        : undefined;

                    // If no packages specified, prompt
                    if (!packages || packages.length === 0) {
                        const updateAnswers = await PromptHelper.promptUpdate();
                        packages            = updateAnswers.updateAll ? undefined : updateAnswers.packages;
                    }

                    this.pm!.update(packages);
                } catch (error) {
                    PromptHelper.showError('✘ Update failed', error as Error);
                    process.exit(1);
                }
            }

            /**
             * Link package globally or link global package to project
             */
            private linkPackage(params?: any) {
                if (!this.ensureSpace()) return;
                if (!this.pm) this.initPackageManager();

                const packageName = params?.args?.package;
                this.pm!.link(packageName);
            }

            /**
             * Unlink package globally or unlink global package from project
             */
            private unlinkPackage(params?: any) {
                if (!this.ensureSpace()) return;
                if (!this.pm) this.initPackageManager();

                const packageName = params?.args?.package;
                this.pm!.unlink(packageName);
            }

            /**
             * List packages
             */
            private listPackages(params: any) {
                if (!this.ensureSpace()) return;
                if (!this.pm) this.initPackageManager();

                this.pm!.list({
                    global: params.options.global
                });
            }

            /**
             * Run any script from package.json
             */
            private runScript(params: any) {
                if (!this.ensureSpace()) return;
                if (!this.pm) this.initPackageManager();

                const scriptName = params?.args?.script;

                if (!scriptName) {
                    PromptHelper.showError('Please specify a script name');
                    return;
                }

                try {
                    // Collect dynamic args and options
                    let args: string[] = [];

                    if (params?.dynamicArgs && Array.isArray(params.dynamicArgs)) {
                        args.push(...params.dynamicArgs);
                    }

                    if (params?.dynamicOptions && typeof params.dynamicOptions === 'object') {
                        for (const [key, value] of Object.entries(params.dynamicOptions)) {
                            args.push(`--${key}`);
                            if (value !== true && value !== false) {
                                args.push(String(value));
                            }
                        }
                    }

                    // console.log(`🚀 Running script: ${scriptName}${args.length > 0 ? ' ' + args.join(' ') : ''}\n`);
                    this.pm!.run(scriptName, args.length > 0 ? args : undefined);
                } catch (error) {
                    PromptHelper.showError(`Failed to run script "${scriptName}"`, error as Error);
                    process.exit(1);
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── BUILD ──────────────────────────────┐

            /**
             * Build the current space
             */
            private buildSpace(silently?: boolean) {
                if (!this.ensureSpace()) return;
                if (!this.pm) this.initPackageManager();

                const loader = new Loader();
                loader.start('Building space...');

                try {
                    this.pm!.runSilent('build');
                    loader.stop(silently ? '' : '✔ Build succeeded');
                } catch (error) {
                    loader.stopWithError('✘ Build failed');
                    process.exit(1);
                }
            }

            private buildSpaceBool(silently?: boolean) : boolean{
                if (!this.ensureSpace()) return false;
                if (!this.pm) this.initPackageManager();

                const loader = new Loader();
                loader.start('Building space...');

                try {
                    this.pm!.runSilent('build');
                    loader.stop(silently ? '' : '✔ Build succeeded');
                    return true
                } catch (error) {
                    loader.stopWithError('✘ Build failed!');
                    return false
                }
            }

            /**
             * Run tests
             */
            private runTests(params?: any) {
                if (!this.ensureSpace()) return;
                if (!this.pm) this.initPackageManager();

                // Build args array for bun test
                const args: string[] = [];

                // Add test path if specified
                const testPath = params?.args?.path;
                if (testPath) {
                    args.push(testPath);
                }

                // Add coverage flag
                if (params?.options?.coverage) {
                    args.push('--coverage');
                }

                // Add coverage reporter
                if (params?.options?.['coverage-reporter']) {
                    args.push('--coverage-reporter', params.options['coverage-reporter']);
                }

                // Add watch flag
                if (params?.options?.watch) {
                    args.push('--watch');
                }

                // Add bail flag
                if (params?.options?.bail) {
                    args.push('--bail');
                }

                // Add timeout
                if (params?.options?.timeout) {
                    args.push('--timeout', params.options.timeout);
                }

                // Add rerun-each
                if (params?.options?.['rerun-each']) {
                    args.push('--rerun-each', params.options['rerun-each']);
                }

                // Add concurrent
                if (params?.options?.concurrent) {
                    args.push('--concurrent');
                }

                // Add test name pattern
                if (params?.options?.['test-name-pattern']) {
                    args.push('-t', params.options['test-name-pattern']);
                }

                // Run tests with args
                if (args.length > 0) {
                    this.pm!.run('test', args);
                } else {
                    this.pm!.run('test');
                }
            }

            /**
             * Clean build artifacts
             */
            private clean() {
                if (!this.ensureSpace()) return;
                if (!this.pm) this.initPackageManager();

                const loader = new Loader();
                loader.start('Cleaning build artifacts...');

                try {
                    this.pm!.run('clean');
                    loader.stop('✔ Clean complete!');
                } catch (error) {
                    loader.stopWithError('✘ Clean failed!');
                    process.exit(1);
                }
            }

            /**
             * Start the main file - builds silently first, then runs
             */
            private startMain(params?: any) {
                if (!this.buildSpaceBool(true)) return;

                try {
                    // Step 1: Find the built main file
                    const mainFile = this.findBuiltMainFile();

                    if (!mainFile) {
                        PromptHelper.showError(
                            'Could not find built entry point.\n' +
                            'Expected to find dist/main.js or dist/index.js after build.'
                        );
                        process.exit(1);
                    }

                    // Step 2: Collect ALL arguments (dynamic args from CLI)
                    let args: string[] = [];

                    // Get dynamic args (all unnamed args passed after 'start')
                    if (params?.dynamicArgs && Array.isArray(params.dynamicArgs)) {
                        args.push(...params.dynamicArgs);
                    }

                    // Get dynamic options (all --flags passed)
                    if (params?.dynamicOptions && typeof params.dynamicOptions === 'object') {
                        for (const [key, value] of Object.entries(params.dynamicOptions)) {
                            args.push(`--${key}`);
                            if (value !== true && value !== false) {
                                args.push(String(value));
                            }
                        }
                    }

                    // Step 3: Show what we're running
                    if (args.length > 0) {
                        // console.log(`🚀 Running: bun ${mainFile} ${args.join(' ')}\n`);
                    } else {
                        // console.log(`🚀 Running: bun ${mainFile}\n`);
                    }

                    // Step 4: Run the built file with bun
                    const result = spawnSync('bun', [mainFile, ...args], {
                        stdio: 'inherit',
                        cwd: process.cwd()
                    });

                    if (result.error) {
                        PromptHelper.showError('Failed to start process', result.error as Error);
                        process.exit(1);
                    }

                    if (result.status !== 0 && result.status !== null) {
                        console.error('\n✘ Process exited with error');
                        process.exit(result.status);
                    }
                } catch (error) {
                    PromptHelper.showError('Failed to start', error as Error);
                    process.exit(1);
                }
            }

            /**
             * Find the built main entry file (after build)
             */
            private findBuiltMainFile(): string | null {
                const possiblePaths = [
                    'dist/main.js',
                    'dist/index.js',
                    'dist/app.js'
                ];

                // Try built files first
                for (const filePath of possiblePaths) {
                    if (fs.existsSync(path.join(process.cwd(), filePath))) {
                        return filePath;
                    }
                }

                // Fallback: Check package.json main field
                try {
                    const packageJsonPath = path.join(process.cwd(), 'package.json');
                    if (fs.existsSync(packageJsonPath)) {
                        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

                        if (packageJson.main && fs.existsSync(packageJson.main)) {
                            return packageJson.main;
                        }
                    }
                } catch (error) {
                    // Ignore package.json errors
                }

                return null;
            }

            /**
             * Publish to npm
             */
            private async publish(params: any) {
                if(!this.buildSpaceBool(true)) return;
                try {
                    const config = this.spaceManager.loadSpaceConfig();
                    if (!config) {
                        PromptHelper.showError('Could not load space configuration');
                        return;
                    }

                    const fullName = config.repo.org
                        ? `@${config.repo.org}/${config.repo.name}`
                        : config.repo.name;

                    // Prompt for publish options if not provided
                    let tag     = params.options.tag;
                    let access  = params.options.access;

                    if (!tag && !access) {
                        const publishAnswers = await PromptHelper.promptPublish(fullName);

                        if (!publishAnswers.confirm) {
                            PromptHelper.showInfo('Publish cancelled');
                            return;
                        }

                        tag     = publishAnswers.tag;
                        access  = publishAnswers.access;
                    }

                    const loader = new Loader();
                    loader.start('Publishing package...');

                    this.pm!.publish({
                        tag,
                        access: access as any
                    }, loader);
                } catch (error) {
                    PromptHelper.showError('Publish failed', error as Error);
                    process.exit(1);
                }
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝