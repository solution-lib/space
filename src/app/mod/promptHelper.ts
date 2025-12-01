// src/app/mod/promptHelper.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { input, select, confirm } from '@inquirer/prompts';
    import { TemplateRegistry } from './templateRegistry';
    import type { SpaceType, TemplateVariant } from '../../types.d';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export interface InitPromptAnswers {
        name            : string;
        type            : 'lib' | 'cli' | 'server';
        template        : string;
        description     : string;
        packageManager  : 'bun' | 'npm';
        author          : string;
        authorEmail     : string;
        githubId        : string;
        keywords        : string[];
        license         : string;
    }

    export interface PublishPromptAnswers {
        confirm         : boolean;
        tag?            : string;
        access?         : 'public' | 'restricted';
    }

    export interface RemovePromptAnswers {
        packages        : string[];
        confirm         : boolean;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class PromptHelper {

        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

            /**
             * Prompt for init command parameters
             */
            static async promptInit(params: {
                name?       : string;
                org?        : string;
                type?       : string;
                template?   : string;
                desc?       : string;
            }): Promise<InitPromptAnswers> {

                let name                = params.name;
                let type                = params.type;
                let template            = params.template;
                let description         = params.desc;
                let author              = '';

                // Name (supports @org/name format)
                if (!name || name === 'my-space') {
                    name = await input({
                        message: 'name:',
                        default: 'my-space',
                        validate: (value: string) => {
                            if (!value || value.trim() === '') {
                                return 'Space name is required';
                            }
                            // Check for @org/name format
                            const orgRegex = /^@([a-z0-9-_]+)\/([a-z0-9-_]+)$/;
                            const simpleRegex = /^[a-z0-9-_]+$/;

                            if (!orgRegex.test(value) && !simpleRegex.test(value)) {
                                return 'Name must be either "package-name" or "@org/package-name" (lowercase, numbers, hyphens, underscores only)';
                            }
                            return true;
                        }
                    });
                }

                // Type
                if (!type) {
                    // Check which space types have ready templates
                    const libReady = TemplateRegistry.getTemplatesForType('lib', false).length > 0;
                    const cliReady = TemplateRegistry.getTemplatesForType('cli', false).length > 0;
                    const serverReady = TemplateRegistry.getTemplatesForType('server', false).length > 0;
                    const webReady = TemplateRegistry.getTemplatesForType('web', false).length > 0;

                    type = await select({
                        message: 'type:',
                        choices: [
                            {
                                name: `→ Library    - TypeScript library for npm${!libReady ? ' (Coming Soon)' : ''}`,
                                value: 'lib',
                                disabled: !libReady ? 'No templates ready yet' : false
                            },
                            {
                                name: `→ CLI        - Command-line tool${!cliReady ? ' (Coming Soon)' : ''}`,
                                value: 'cli',
                                disabled: !cliReady ? 'No templates ready yet' : false
                            },
                            {
                                name: `→ Server     - Backend server application${!serverReady ? ' (Coming Soon)' : ''}`,
                                value: 'server',
                                disabled: !serverReady ? 'No templates ready yet' : false
                            },
                            {
                                name: `→ Web App    - Full-stack web application${!webReady ? ' (Coming Soon)' : ''}`,
                                value: 'web',
                                disabled: !webReady ? 'No templates ready yet' : false
                            }
                        ]
                    });
                }

                // Template Variant (based on type) - show all templates with status
                if (!template) {
                    const allTemplates = TemplateRegistry.getTemplatesForType(type as SpaceType, true);
                    const readyTemplates = allTemplates.filter(t => t.ready);

                    // Check if there are any ready templates
                    if (readyTemplates.length === 0) {
                        throw new Error(`No templates are ready yet for "${type}" spaces. This space type is coming soon!`);
                    }

                    const templateChoices = allTemplates.map(t => {
                        const statusEmoji = t.ready ? '✔' : '🚧';
                        const statusText = t.ready ? '' : ' (Coming Soon)';
                        return {
                            name: `${statusEmoji} ${t.label}${statusText} - ${t.description}`,
                            value: t.name,
                            short: t.label,
                            disabled: !t.ready ? 'Not ready yet' : false
                        };
                    });

                    template = await select({
                        message: 'template:',
                        choices: templateChoices,
                        default: TemplateRegistry.getDefaultTemplate(type as SpaceType)
                    });
                }

                // Description
                if (!description) {
                    const defaultDesc = type === 'lib'
                        ? `A TypeScript library`
                        : type === 'cli'
                            ? `A command-line tool`
                            : `A backend server`;

                    description = await input({
                        message: 'desc:',
                        default: defaultDesc
                    });
                }

                // Package Manager - Always use bun (removed from prompt)
                const packageManager = 'bun';

                // Author name
                author = await input({
                    message: 'author name:',
                    default: ''
                });

                // Author email
                const authorEmail = await input({
                    message: 'author email:',
                    default: '',
                    validate: (value: string) => {
                        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                            return 'Please enter a valid email address or leave empty';
                        }
                        return true;
                    }
                });

                // GitHub username
                const githubId = await input({
                    message: 'github username:',
                    default: '',
                    validate: (value: string) => {
                        if (value && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(value)) {
                            return 'Please enter a valid GitHub username or leave empty';
                        }
                        return true;
                    }
                });

                // Keywords
                const keywordsInput = await input({
                    message: 'keywords (comma-separated):',
                    default: '',
                });

                const keywords = keywordsInput
                    ? keywordsInput.split(',').map(k => k.trim()).filter(k => k)
                    : [];

                // License
                const license = await input({
                    message: 'license:',
                    default: 'MIT'
                });

                return {
                    name,
                    type: type as 'lib' | 'cli' | 'server',
                    template,
                    description,
                    packageManager: packageManager as 'bun' | 'npm',
                    author,
                    authorEmail,
                    githubId,
                    keywords,
                    license
                };
            }

            /**
             * Prompt for publish confirmation and options
             */
            static async promptPublish(spaceName: string): Promise<PublishPromptAnswers> {
                const shouldPublish = await confirm({
                    message: `Are you sure you want to publish "${spaceName}" to npm?`,
                    default: false
                });

                if (!shouldPublish) {
                    return {
                        confirm: false
                    };
                }

                const tag = await input({
                    message: 'Publish with a tag (e.g., beta, next) or leave empty for latest:',
                    default: ''
                });

                const access = await select({
                    message: '🔐 Access level:',
                    choices: [
                        { name: 'Public - Anyone can install', value: 'public' },
                        { name: 'Restricted - Requires authentication', value: 'restricted' }
                    ],
                    default: 'public'
                });

                return {
                    confirm: true,
                    tag: tag || undefined,
                    access: access as 'public' | 'restricted'
                };
            }

            /**
             * Prompt for package removal confirmation
             */
            static async promptRemove(packages: string[]): Promise<RemovePromptAnswers> {
                const shouldRemove = await confirm({
                    message: `Remove ${packages.join(', ')}?`,
                    default: true
                });

                return {
                    packages,
                    confirm: shouldRemove
                };
            }

            /**
             * Simple confirmation prompt helper
             */
            static async promptConfirm(message: string, defaultValue: boolean = false): Promise<boolean> {
                const readline = await import('readline');
                const rl = readline.createInterface({
                    input   : process.stdin,
                    output  : process.stdout
                });

                const defaultText = defaultValue ? ' (Y/n)' : ' (y/N)';

                return new Promise((resolve) => {
                    rl.question(`${message}${defaultText} `, (answer: string) => {
                        rl.close();

                        if (answer.trim() === '') {
                            resolve(defaultValue);
                        } else {
                            resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
                        }
                    });
                });
            }

            /**
             * Prompt for package installation
             */
            static async promptInstall(currentPackages?: string): Promise<{
                packages: string[];
                isDev: boolean;
            }> {
                const packagesInput = await input({
                    message: 'Enter package names (space-separated):',
                    default: currentPackages || '',
                    validate: (value: string) => {
                        if (!value || value.trim() === '') {
                            return 'Please enter at least one package name';
                        }
                        return true;
                    }
                });

                const isDev = await confirm({
                    message: '🛠️  Install as dev dependency?',
                    default: false
                });

                return {
                    packages: packagesInput.split(' ').filter((p: string) => p.trim()),
                    isDev
                };
            }

            /**
             * Prompt for package update selection
             */
            static async promptUpdate(): Promise<{ updateAll: boolean; packages?: string[] }> {
                const updateType = await select({
                    message: 'What do you want to update?',
                    choices: [
                        { name: 'All packages', value: 'all' },
                        { name: 'Specific packages', value: 'specific' }
                    ]
                });

                if (updateType === 'all') {
                    return {
                        updateAll: true
                    };
                }

                const packagesInput = await input({
                    message: '📦 Enter package names (space-separated):',
                    validate: (value: string) => {
                        if (!value || value.trim() === '') {
                            return 'Please enter at least one package name';
                        }
                        return true;
                    }
                });

                return {
                    updateAll: false,
                    packages: packagesInput.split(' ').filter((p: string) => p.trim())
                };
            }

            /**
             * Prompt user if they want to use current directory
             */
            static async promptUseCurrentDir(dirName: string): Promise<boolean> {
                const shouldUse = await confirm({
                    message: `Use current directory "${dirName}" as the space root?`,
                    default: true
                });

                return shouldUse;
            }

            /**
             * Prompt user if they want to delete existing directory
             */
            static async promptDeleteExistingDir(dirPath: string): Promise<boolean> {
                const shouldDelete = await confirm({
                    message: `⚠️  Directory already exists at "${dirPath}". Delete and recreate?`,
                    default: false
                });

                return shouldDelete;
            }

            /**
             * Show a success message with next steps
             */
            static showSuccess(spaceName: string, nextSteps: string[]) {
                console.log('');
                nextSteps.forEach((step, index) => {
                    console.log(`→ ${step}`);
                });
                console.log('');
            }

            /**
             * Show an error message
             */
            static showError(message: string, error?: Error) {
                console.log('\n✘ Error:', message);
                if (error && error.message) {
                    console.log(`   ${error.message}`);
                }
                console.log('');
            }

            /**
             * Show a warning message
             */
            static showWarning(message: string) {
                console.log('\n⚠️  Warning:', message);
                console.log('');
            }

            /**
             * Show an info message
             */
            static showInfo(message: string) {
                console.log('\nℹ️  ', message);
                console.log('');
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝