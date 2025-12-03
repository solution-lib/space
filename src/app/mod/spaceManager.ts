// src/app/mod/spaceManager.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as fs                      from 'fs';
    import * as path                    from 'path';
    import type { SpaceConfig, TemplateVariant } from '../../types.d';
    import { TemplateRegistry }         from './templateRegistry';
    import { JsonFormatter, PACKAGE_JSON_KEY_ORDER, SPACE_FILE_KEY_ORDER }            from './jsonFormatter';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class SpaceManager {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            private basePath: string;

            constructor(basePath: string = process.cwd()) {
                this.basePath = basePath;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

            // Create a new space by cloning from template
            async createSpace(config: SpaceConfig, spacePath?: string): Promise<void> {
                const targetPath = spacePath || path.join(this.basePath, config.repo.name);

                // Check if space already exists
                if (fs.existsSync(targetPath)) {
                    throw new Error(`Space path "${targetPath}" already exists!`);
                }

                let createdDir = false;

                try {
                    // Create directory if it doesn't exist
                    if (!fs.existsSync(targetPath)) {
                        fs.mkdirSync(targetPath, { recursive: true });
                        createdDir = true;
                    }

                    // Clone template from @solution-dist
                    await this.cloneTemplate(config.type, targetPath, config, config.template);

                    // Create .space config file
                    this.createSpaceConfig(targetPath, config);

                } catch (error) {
                    // Cleanup on failure - only if we created the directory
                    if (createdDir && fs.existsSync(targetPath)) {
                        try {
                            // Try to clean up, but don't fail if we can't
                            await this.safeDeleteDirectory(targetPath);
                        } catch {
                            // Ignore cleanup errors
                            console.warn(`Warning: Could not clean up directory at "${targetPath}"`);
                        }
                    }
                    throw error;
                }
            }

            // Load space configuration from .space file
            loadSpaceConfig(spacePath?: string): SpaceConfig | null {
                const targetPath = spacePath || this.basePath;
                const configPath = path.join(targetPath, '.space');

                if (!fs.existsSync(configPath)) {
                    return null;
                }

                const content = fs.readFileSync(configPath, 'utf-8');
                return JSON.parse(content);
            }

            // Check if current directory is a space
            isSpace(dirPath?: string): boolean {
                const targetPath = dirPath || this.basePath;
                return fs.existsSync(path.join(targetPath, '.space'));
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            // Clone template from @solution-dist repository
            private async cloneTemplate(
                type: 'lib' | 'cli' | 'server',
                targetPath: string,
                config: SpaceConfig,
                template: TemplateVariant
            ): Promise<void> {
                const repoName = TemplateRegistry.getRepoName(type, template);
                const repoUrl = `https://github.com/solution-dist/${repoName}.git`;

                try {
                    const { execSync } = await import('child_process');

                    // Clone silently (no output to terminal)
                    execSync(
                        `git clone --quiet --depth 1 ${repoUrl} "${targetPath}"`,
                        { stdio: 'pipe' }
                    );

                    // Remove .git directory
                    const gitPath = path.join(targetPath, '.git');
                    if (fs.existsSync(gitPath)) {
                        await this.safeDeleteDirectory(gitPath);
                    }

                    // Update files with project info
                    await this.updateTemplateFiles(targetPath, config);

                } catch (e: unknown) {
                    // Check if it's a "repository not found" error
                    if(e instanceof Error) {
                        if (e.message && e.message.includes('Repository not found')) {
                            throw new Error(
                                `Template repository not found: ${repoUrl}\n` +
                                `This template is not yet available. Please mark it as ready: false in templateRegistry.ts`
                            );
                        }

                        throw new Error(`Failed to clone template from ${repoUrl}: ${e.message || e}`);
                    } else {
                        throw new Error(`Failed to clone template from ${repoUrl}: ${e}`);
                    }
                }
            }

            // Update template files with project-specific information
            private async updateTemplateFiles(
                spacePath: string,
                config: SpaceConfig
            ): Promise<void> {

                // Generate context-aware URLs and values
                const isOrgProject = config.repo.org && config.repo.org.trim() !== '';
                const hasGithubId = config.author.id && config.author.id.trim() !== '';

                // Determine the GitHub owner (org or personal account)
                const githubOwner = isOrgProject ? config.repo.org : (hasGithubId ? config.author.id : '');

                // Generate URLs based on context
                const gitUrl = githubOwner
                    ? `git+https://github.com/${githubOwner}/${config.repo.name}.git`
                    : '';

                const homepage = githubOwner
                    ? `https://github.com/${githubOwner}/${config.repo.name}#readme`
                    : '';

                const issuesUrl = githubOwner
                    ? `https://github.com/${githubOwner}/${config.repo.name}/issues`
                    : '';

                // Prepare full package name (tag)
                const packageTag = isOrgProject
                    ? `@${config.repo.org}/${config.repo.name}`
                    : config.repo.name;

                // Prepare tag badge - format for shields.io badge
                let tagBadge = '🔥-';
                if (isOrgProject) {
                    tagBadge += `@${(config.repo.org.replace(/-/g, '--') + '/' + config.repo.name.replace(/-/g, '--')).replace(/ /g, '_')}`;
                } else if (config.author.name) {
                    tagBadge += (config.author.name.replace(/-/g, '--') + '/' + config.repo.name.replace(/-/g, '--')).replace(/ /g, '_');
                } else {
                    tagBadge += (config.repo.name.replace(/-/g, '--')).replace(/ /g, '_');
                }

                // Prepare author URL
                const authorUrl = hasGithubId
                    ? `https://github.com/${config.author.id}`
                    : (config.author.url || '');

                // ✅ REMOVED: keywordsJson preparation - we'll handle keywords in package.json only

                // Recursively find all files
                const allFiles = this.getAllFiles(spacePath);

                for (const filePath of allFiles) {
                    // Skip node_modules and .git
                    if (filePath.includes('node_modules') || filePath.includes('.git')) {
                        continue;
                    }

                    try {
                        let content = fs.readFileSync(filePath, 'utf-8');
                        // let hasChanges = false;

                        // STEP 1: Replace template variables in the raw content first
                        if (content.includes('{{')) {
                            // hasChanges = true;

                            // Replace all placeholders
                            content = content
                                // Package tag (full name with org if exists)
                                .replace(/\{\{tag\}\}/g,            packageTag)
                                .replace(/\{\{tag-badge\}\}/g,      tagBadge)

                                // Repo info
                                .replace(/\{\{name\}\}/g,           config.repo.name)
                                .replace(/\{\{repo\}\}/g,           config.repo.name)
                                .replace(/\{\{org\}\}/g,            config.repo.org || '')
                                .replace(/\{\{desc\}\}/g,           config.repo.desc || `A ${config.type} space`)
                                .replace(/\{\{description\}\}/g,    config.repo.desc || `A ${config.type} space`)
                                .replace(/\{\{version\}\}/g,        config.repo.version)
                                .replace(/\{\{license\}\}/g,        config.repo.license || 'MIT')
                                // ✅ REMOVED: keyword replacements here - handled in package.json section
                                // .replace(/\{\{kw\}\}/g,             keywordsJson)
                                // .replace(/\{\{keywords\}\}/g,       keywordsJson)

                                // URLs
                                .replace(/\{\{url\}\}/g,            gitUrl)
                                .replace(/\{\{repo_url\}\}/g,       gitUrl)
                                .replace(/\{\{git_url\}\}/g,        gitUrl)
                                .replace(/\{\{homepage\}\}/g,       homepage)
                                .replace(/\{\{issues\}\}/g,         issuesUrl)

                                // Space type, template, and PM
                                .replace(/\{\{type\}\}/g,           config.type)
                                .replace(/\{\{template\}\}/g,       config.template || 'clean')
                                .replace(/\{\{pm\}\}/g,             config.pm)

                                // Author info
                                .replace(/\{\{author\}\}/g,         config.author.name || '')
                                .replace(/\{\{author_name\}\}/g,    config.author.name || '')
                                .replace(/\{\{author_id\}\}/g,      config.author.id || '')
                                .replace(/\{\{author_email\}\}/g,   config.author.email || '')
                                .replace(/\{\{author_url\}\}/g,     authorUrl);

                            // Write the updated content
                            fs.writeFileSync(filePath, content, 'utf-8');
                        }

                        // Special handling for package.json FIRST
                        if (filePath.endsWith('package.json')) {
                            // STEP 2: Parse and further update the JSON
                            const packageJson = JSON.parse(content);

                            // Set full package name (with org if exists)
                            packageJson.name = packageTag;
                            packageJson.version = config.repo.version;
                            packageJson.description = config.repo.desc || `A ${config.type} space`;
                            packageJson.license = config.repo.license || 'MIT';

                            // ✅ Set keywords as array (this is correct and won't cause double-stringification)
                            if (config.repo.kw && config.repo.kw.length > 0) {
                                packageJson.keywords = config.repo.kw;
                            } else {
                                packageJson.keywords = [];
                            }

                            // Set homepage
                            if (homepage) {
                                packageJson.homepage = homepage;
                            }

                            // Set bugs/issues URL
                            if (issuesUrl) {
                                if (!packageJson.bugs) {
                                    packageJson.bugs = {};
                                }
                                packageJson.bugs.url = issuesUrl;
                            }

                            // Set author
                            if (config.author.name) {
                                if (config.author.email) {
                                    packageJson.author = {
                                        name: config.author.name,
                                        email: config.author.email,
                                        url: authorUrl || undefined
                                    };
                                } else {
                                    packageJson.author = {
                                        name: config.author.name,
                                        url: authorUrl || undefined
                                    };
                                }
                            }

                            // Set repository URL
                            if (gitUrl) {
                                packageJson.repository = {
                                    type: 'git',
                                    url: gitUrl
                                };
                            }

                            // Update bin name for CLI projects
                            if (config.type === 'cli' && packageJson.bin) {
                                const oldBinName = Object.keys(packageJson.bin)[0];
                                const binPath = packageJson.bin[oldBinName];
                                delete packageJson.bin[oldBinName];
                                packageJson.bin[config.repo.name] = binPath;
                            }

                            // Ensure bun engine exists
                            if (!packageJson.engines) {
                                packageJson.engines = {};
                            }
                            if (!packageJson.engines.bun) {
                                packageJson.engines.bun = '>=1.0.0';
                            }

                            // STEP 3: Format and write package.json
                            content = JsonFormatter.format(packageJson, { keyOrder: PACKAGE_JSON_KEY_ORDER });
                            fs.writeFileSync(filePath, content + '\n', 'utf-8');
                            continue; // Skip the rest of the loop for package.json
                        }

                    } catch {
                        // Silently skip files that can't be read/updated (like binaries)
                        continue;
                    }
                }
            }

            // Recursively get all files in a directory
            private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
                const files = fs.readdirSync(dirPath);

                files.forEach((file) => {
                    const fullPath = path.join(dirPath, file);

                    if (fs.statSync(fullPath).isDirectory()) {
                        arrayOfFiles = this.getAllFiles(fullPath, arrayOfFiles);
                    } else {
                        arrayOfFiles.push(fullPath);
                    }
                });

                return arrayOfFiles;
            }

            // Create .space configuration file
            private createSpaceConfig(spacePath: string, config: SpaceConfig): void {
                const configPath = path.join(spacePath, '.space');

                // Generate URLs for .space file
                const isOrgProject = config.repo.org && config.repo.org.trim() !== '';
                const hasGithubId = config.author.id && config.author.id.trim() !== '';
                const githubOwner = isOrgProject ? config.repo.org : (hasGithubId ? config.author.id : '');

                const gitUrl = githubOwner
                    ? `git+https://github.com/${githubOwner}/${config.repo.name}.git`
                    : '';

                const homepage = githubOwner
                    ? `https://github.com/${githubOwner}/${config.repo.name}#readme`
                    : '';

                const issuesUrl = githubOwner
                    ? `https://github.com/${githubOwner}/${config.repo.name}/issues`
                    : '';

                const authorUrl = hasGithubId
                    ? `https://github.com/${config.author.id}`
                    : (config.author.url || '');

                const configWithDefaults = {
                    type: config.type,
                    template: config.template || 'clean',
                    pm: config.pm,
                    repo: {
                        org: config.repo.org || '',
                        name: config.repo.name,
                        version: config.repo.version,
                        desc: config.repo.desc || `A ${config.type} space`,
                        kw: config.repo.kw || [],
                        license: config.repo.license || 'MIT',
                        issues: issuesUrl,
                        homepage: homepage,
                        git_url: gitUrl
                    },
                    author: {
                        id: config.author.id || '',
                        name: config.author.name || '',
                        email: config.author.email || '',
                        url: authorUrl
                    },
                    createdAt: new Date().toISOString()
                };

                const configContent = JsonFormatter.format(configWithDefaults, { keyOrder: SPACE_FILE_KEY_ORDER });

                fs.writeFileSync(configPath, configContent + '\n', 'utf-8');
            }

            // Safely delete directory with retry logic
            private async safeDeleteDirectory(dirPath: string, maxRetries: number = 3): Promise<void> {
                for (let i = 0; i < maxRetries; i++) {
                    try {
                        fs.rmSync(dirPath, {
                            recursive: true,
                            force: true,
                            maxRetries: 3,
                            retryDelay: 100
                        });

                        // Verify deletion
                        if (!fs.existsSync(dirPath)) {
                            return;
                        }
                    } catch (error) {
                        if (i === maxRetries - 1) {
                            throw error;
                        }
                        // Wait before retry
                        await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
                    }
                }
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝